import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';
import { getMortgageRates } from './rates.js';
import { resolveImage } from './resolveImage.js';

const PORT = Number(process.env.PORT) || 5174;
// Change these with environment variables before going live.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@baskreality.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const streams = new Set();
const ACTIVITY_LIMIT = 300;
const TRACKED = ['view', 'search']; // activity types the browser may report; the rest are logged here

// Sign-ins are kept in the database (token -> { id, role }), so they survive a server restart.
// The account itself is looked up on every request, so profile edits and deletions apply at once.
const sessions = {
  get: (token) => {
    const s = db.get('sessions')?.[token];
    if (!s) return null;
    if (s.role === 'admin') return s;
    const u = db.get('users').find((x) => x.id === s.id);
    return u ? { ...publicUser(u), role: 'user' } : null;
  },
  set: (token, s) => db.set('sessions', { ...db.get('sessions'), [token]: s }),
  delete: (token) => {
    const all = { ...db.get('sessions') };
    delete all[token];
    db.set('sessions', all);
  },
};

const uid = () => randomBytes(5).toString('hex');
const hash = (pw, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
const verify = (pw, stored) => {
  const [salt, key] = stored.split(':');
  return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(pw, salt, 32));
};
const publicUser = ({ password, saved, calcs, activity, ...u }) => u;

// What the admin Users list shows: the profile plus a few counts.
const userSummary = (u) => ({
  ...publicUser(u),
  savedCount: (u.saved || []).length,
  calcCount: (u.calcs || []).length,
  lastActiveAt: u.activity?.[0]?.at || u.createdAt,
});

const findUser = (id) => {
  const u = db.get('users').find((x) => x.id === id);
  if (!u) throw Object.assign(new Error('Account not found'), { status: 404 });
  return u;
};

const updateUser = (id, fn) => {
  let updated = null;
  db.set('users', db.get('users').map((u) => (u.id === id ? (updated = fn(u)) : u)));
  broadcast('me', id);
  broadcast('users');
  return updated;
};

const logActivity = (id, type, data = {}) => updateUser(id, (u) => ({
  ...u,
  activity: [{ id: uid(), type, at: Date.now(), data }, ...(u.activity || [])].slice(0, ACTIVITY_LIMIT),
}));

// Everything an account owns, plus every inquiry it sent (by account, or by the same email before signing up).
const accountData = (id) => {
  const u = findUser(id);
  return {
    profile: publicUser(u),
    saved: u.saved || [],
    calcs: u.calcs || [],
    activity: u.activity || [],
    inquiries: db.get('inquiries').filter((q) => q.userId === id || (q.email && q.email.toLowerCase() === u.email)),
  };
};

// Tells every open browser which collection changed so it can refetch. `userId` scopes
// per-account changes, so only that account's tabs refetch.
const broadcast = (collection, userId) => {
  for (const res of streams) res.write(`data: ${JSON.stringify({ collection, userId })}\n\n`);
};

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (c) => {
    raw += c;
    if (raw.length > 25e6) reject(new Error('Request too large'));
  });
  req.on('end', () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); }
  });
});

const createSession = (user) => {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { id: user.id, role: user.role, ...(user.role === 'admin' ? { name: user.name, email: user.email } : {}) });
  return { token, user };
};

// Generic CRUD for an admin-managed collection.
const collection = (name, { publicRead = false, publicCreate = false } = {}) => ({
  list: { auth: publicRead ? null : 'admin', fn: () => db.get(name) },
  create: {
    auth: publicCreate ? null : 'admin',
    fn: ({ body }) => {
      const item = { ...body, id: uid(), createdAt: Date.now() };
      db.set(name, [item, ...db.get(name)]);
      broadcast(name);
      return item;
    },
  },
  update: {
    auth: 'admin',
    fn: ({ id, body }) => {
      let updated = null;
      db.set(name, db.get(name).map((x) => (x.id === id ? (updated = { ...x, ...body, id }) : x)));
      if (!updated) throw Object.assign(new Error('Not found'), { status: 404 });
      broadcast(name);
      return updated;
    },
  },
  remove: {
    auth: 'admin',
    fn: ({ id }) => {
      db.set(name, db.get(name).filter((x) => x.id !== id));
      broadcast(name);
      return { ok: true };
    },
  },
});

const C = {
  properties: collection('properties', { publicRead: true }),
  agents: collection('agents', { publicRead: true }),
  inquiries: collection('inquiries', { publicCreate: true }),
};

const routes = [
  ['GET', /^\/api\/(properties|agents|inquiries)$/, (m) => C[m[1]].list],
  // Inquiries from a signed-in client are tied to their account and added to its history.
  ['POST', /^\/api\/inquiries$/, () => ({
    fn: ({ body, user }) => {
      const mine = user?.role === 'user';
      const item = { ...body, id: uid(), createdAt: Date.now(), ...(mine ? { userId: user.id } : {}) };
      db.set('inquiries', [item, ...db.get('inquiries')]);
      broadcast('inquiries');
      if (mine) logActivity(user.id, 'inquiry', { inquiryId: item.id, type: item.type, subject: item.subject || item.address || '', propertyId: item.propertyId });
      return item;
    },
  })],
  ['POST', /^\/api\/(properties|agents)$/, (m) => C[m[1]].create],
  ['PATCH', /^\/api\/(properties|agents|inquiries)\/([\w-]+)$/, (m) => C[m[1]].update],
  ['DELETE', /^\/api\/(properties|agents|inquiries)\/([\w-]+)$/, (m) => C[m[1]].remove],

  ['GET', /^\/api\/users$/, () => ({ auth: 'admin', fn: () => db.get('users').map(userSummary) })],
  ['GET', /^\/api\/users\/([\w-]+)\/data$/, () => ({ auth: 'admin', fn: ({ id }) => accountData(id) })],

  // ---- Client account: saved homes, calculations, history, profile ----
  ['GET', /^\/api\/me\/data$/, () => ({ auth: 'user', fn: ({ user }) => accountData(user.id) })],
  ['PATCH', /^\/api\/me\/saved$/, () => ({
    auth: 'user',
    fn: ({ user, body }) => {
      const before = new Set(findUser(user.id).saved || []);
      const ids = [...new Set((body.ids || []).filter((x) => typeof x === 'string'))];
      const after = new Set(ids);
      const titleOf = (pid) => db.get('properties').find((p) => p.id === pid)?.title || '';
      updateUser(user.id, (u) => ({ ...u, saved: ids }));
      ids.filter((pid) => !before.has(pid)).forEach((pid) => logActivity(user.id, 'save', { propertyId: pid, title: titleOf(pid) }));
      [...before].filter((pid) => !after.has(pid)).forEach((pid) => logActivity(user.id, 'unsave', { propertyId: pid, title: titleOf(pid) }));
      return { saved: ids };
    },
  })],
  ['POST', /^\/api\/me\/calcs$/, () => ({
    auth: 'user',
    fn: ({ user, body }) => {
      const u = findUser(user.id);
      const existingIdx = body.id ? (u.calcs || []).findIndex((c) => c.id === body.id) : -1;
      let calc;
      if (existingIdx >= 0) {
        calc = { ...u.calcs[existingIdx], ...body, updatedAt: Date.now() };
        const nextCalcs = [...(u.calcs || [])];
        nextCalcs[existingIdx] = calc;
        updateUser(user.id, (prev) => ({ ...prev, calcs: nextCalcs }));
      } else {
        calc = { ...body, id: uid(), createdAt: Date.now() };
        updateUser(user.id, (prev) => ({ ...prev, calcs: [calc, ...(prev.calcs || [])] }));
        logActivity(user.id, 'calc', { calcId: calc.id, name: calc.name, monthly: calc.monthly });
      }
      return calc;
    },
  })],
  ['PATCH', /^\/api\/me\/calcs\/([\w-]+)$/, () => ({
    auth: 'user',
    fn: ({ user, id, body }) => {
      let updated = null;
      updateUser(user.id, (prev) => {
        const calcs = (prev.calcs || []).map((c) => {
          if (c.id === id) {
            updated = { ...c, ...body, id, updatedAt: Date.now() };
            return updated;
          }
          return c;
        });
        return { ...prev, calcs };
      });
      if (!updated) throw Object.assign(new Error('Calculation not found'), { status: 404 });
      return updated;
    },
  })],
  ['DELETE', /^\/api\/me\/calcs\/([\w-]+)$/, () => ({
    auth: 'user',
    fn: ({ user, id }) => { updateUser(user.id, (u) => ({ ...u, calcs: (u.calcs || []).filter((c) => c.id !== id) })); return { ok: true }; },
  })],
  ['POST', /^\/api\/me\/activity$/, () => ({
    auth: 'user',
    fn: ({ user, body }) => {
      if (!TRACKED.includes(body.type)) throw Object.assign(new Error('Unknown activity'), { status: 400 });
      logActivity(user.id, body.type, body.data || {});
      return { ok: true };
    },
  })],
  ['DELETE', /^\/api\/me\/activity$/, () => ({
    auth: 'user',
    fn: ({ user }) => { updateUser(user.id, (u) => ({ ...u, activity: [] })); return { ok: true }; },
  })],
  ['PATCH', /^\/api\/me\/profile$/, () => ({
    auth: 'user',
    fn: ({ user, body }) => {
      const name = String(body.name ?? '').trim();
      if (!name) throw Object.assign(new Error('Name is required'), { status: 400 });
      const u = updateUser(user.id, (x) => ({ ...x, name, phone: String(body.phone ?? x.phone ?? '').trim() }));
      return publicUser(u);
    },
  })],
  ['DELETE', /^\/api\/users\/([\w-]+)$/, () => ({
    auth: 'admin',
    fn: ({ id }) => {
      db.set('users', db.get('users').filter((u) => u.id !== id));
      db.set('sessions', Object.fromEntries(Object.entries(db.get('sessions')).filter(([, x]) => x.id !== id)));
      broadcast('users');
      return { ok: true };
    },
  })],

  ['GET', /^\/api\/settings$/, () => ({ fn: () => db.get('settings') })],
  ['PATCH', /^\/api\/settings$/, () => ({
    auth: 'admin',
    fn: ({ body }) => { db.set('settings', { ...db.get('settings'), ...body }); broadcast('settings'); return db.get('settings'); },
  })],

  ['POST', /^\/api\/auth\/login$/, () => ({
    fn: ({ body }) => {
      const { email = '', password = '' } = body;
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return createSession({ id: 'admin', name: 'Administrator', email, role: 'admin' });
      }
      const u = db.get('users').find((x) => x.email === email.toLowerCase());
      if (!u || !verify(password, u.password)) throw Object.assign(new Error('Invalid email or password'), { status: 401 });
      return createSession({ ...publicUser(u), role: 'user' });
    },
  })],
  ['POST', /^\/api\/auth\/signup$/, () => ({
    fn: ({ body }) => {
      const email = String(body.email || '').toLowerCase();
      if (!body.name || !email || String(body.password || '').length < 6) throw Object.assign(new Error('Name, email and a 6+ character password are required'), { status: 400 });
      if (email === ADMIN_EMAIL || db.get('users').some((u) => u.email === email)) throw Object.assign(new Error('Email already registered'), { status: 409 });
      const user = { id: uid(), name: body.name, email, password: hash(body.password), createdAt: Date.now() };
      db.set('users', [...db.get('users'), user]);
      broadcast('users');
      return createSession({ ...publicUser(user), role: 'user' });
    },
  })],
  ['POST', /^\/api\/auth\/logout$/, () => ({ fn: ({ token }) => { sessions.delete(token); return { ok: true }; } })],
  ['GET', /^\/api\/auth\/me$/, () => ({ fn: ({ user }) => user || null })],

  ['GET', /^\/api\/mortgage-rates$/, () => ({ fn: () => getMortgageRates() })],
  ['GET', /^\/api\/resolve-image$/, () => ({ auth: 'admin', fn: async ({ query }) => ({ image: await resolveImage(query.get('url')) }) })],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 3000\n\n');
    streams.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => { clearInterval(ping); streams.delete(res); });
    return;
  }

  for (const [method, pattern, handler] of routes) {
    const m = url.pathname.match(pattern);
    if (!m || req.method !== method) continue;
    const { auth, fn } = handler(m);
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const user = sessions.get(token) || null;
    if (auth === 'admin' && user?.role !== 'admin') return send(res, 401, { error: 'Admin sign-in required' });
    if (auth === 'user' && user?.role !== 'user') return send(res, 401, { error: 'Please sign in to your account' });
    try {
      const body = ['POST', 'PATCH'].includes(method) ? await readBody(req) : {};
      return send(res, 200, await fn({ body, id: m[2] || m[1], user, token, query: url.searchParams }));
    } catch (e) {
      return send(res, e.status || 400, { error: e.message || 'Request failed' });
    }
  }
  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`BASK Reality API running on http://localhost:${PORT}`));
