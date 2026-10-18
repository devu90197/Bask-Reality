import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';
import { getMortgageRates } from './rates.js';
import { resolveImage } from './resolveImage.js';

const PORT = Number(process.env.PORT) || 5174;
// Change these with environment variables before going live.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@baskreality.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const sessions = new Map(); // token -> { id, name, email, role }
const streams = new Set();

const uid = () => randomBytes(5).toString('hex');
const hash = (pw, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
const verify = (pw, stored) => {
  const [salt, key] = stored.split(':');
  return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(pw, salt, 32));
};
const publicUser = ({ password, ...u }) => u;

// Tells every open browser which collection changed so it can refetch.
const broadcast = (collection) => {
  for (const res of streams) res.write(`data: ${JSON.stringify({ collection })}\n\n`);
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
  sessions.set(token, user);
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
  ['POST', /^\/api\/(properties|agents|inquiries)$/, (m) => C[m[1]].create],
  ['PATCH', /^\/api\/(properties|agents|inquiries)\/([\w-]+)$/, (m) => C[m[1]].update],
  ['DELETE', /^\/api\/(properties|agents|inquiries)\/([\w-]+)$/, (m) => C[m[1]].remove],

  ['GET', /^\/api\/users$/, () => ({ auth: 'admin', fn: () => db.get('users').map(publicUser) })],
  ['DELETE', /^\/api\/users\/([\w-]+)$/, () => ({
    auth: 'admin',
    fn: ({ id }) => { db.set('users', db.get('users').filter((u) => u.id !== id)); broadcast('users'); return { ok: true }; },
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
