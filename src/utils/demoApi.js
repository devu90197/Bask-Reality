// Demo mode: an in-browser stand-in for the API server so the site runs on static hosting
// (e.g. Vercel) with the sample data from server/seed.js. Changes are saved in this browser only.
// Turn it off by setting VITE_API_URL once the real backend is deployed.
import { buildSeed } from '../../server/seed.js';

const KEY = 'bask.demoDb.v3'; // v3: client accounts keep saved homes, calculations and history
const ADMIN = { email: 'admin@baskreality.com', password: 'admin123' };

const MORTGAGE = {
  asOf: '2026-10-15', rate30: 7.4, rate15: 6.71, change30: 0, change15: -0.02,
  source: 'Freddie Mac Primary Mortgage Market Survey (sample figures)', fetchedAt: Date.now(),
};

const fresh = () => {
  const seed = buildSeed();
  return { ...seed, sessions: {} };
};

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.properties) return saved;
  } catch { /* storage unavailable or corrupt */ }
  return fresh();
};

let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full */ } };

const uid = () => Math.random().toString(36).slice(2, 12);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const changed = (collection, userId) => {
  save();
  window.dispatchEvent(new CustomEvent('bask:change', { detail: { collection, userId } }));
};
const publicUser = ({ password, saved, calcs, activity, ...u }) => u;
const userSummary = (u) => ({ ...publicUser(u), savedCount: (u.saved || []).length, calcCount: (u.calcs || []).length, lastActiveAt: u.activity?.[0]?.at || u.createdAt });

// Same account features as the real server (server/index.js), kept in this browser.
const findUser = (id) => db.users.find((u) => u.id === id) || fail(404, 'Account not found');
const updateUser = (id, fn) => {
  let updated = null;
  db.users = db.users.map((u) => (u.id === id ? (updated = fn(u)) : u));
  changed('me', id);
  changed('users');
  return updated;
};
const logActivity = (id, type, data = {}) => updateUser(id, (u) => ({
  ...u, activity: [{ id: uid(), type, at: Date.now(), data }, ...(u.activity || [])].slice(0, 300),
}));
const accountData = (id) => {
  const u = findUser(id);
  return {
    profile: publicUser(u), saved: u.saved || [], calcs: u.calcs || [], activity: u.activity || [],
    inquiries: db.inquiries.filter((q) => q.userId === id || (q.email && q.email.toLowerCase() === u.email)),
  };
};

export async function demoApi(path, { method = 'GET', body = {} } = {}, token) {
  const s = db.sessions[token];
  const account = s?.role === 'user' ? db.users.find((u) => u.id === s.id) : null;
  const user = s?.role === 'admin' ? s : account ? { ...publicUser(account), role: 'user' } : null;
  const requireUser = () => { if (user?.role !== 'user') fail(401, 'Please sign in to your account'); };
  const requireAdmin = () => { if (user?.role !== 'admin') fail(401, 'Admin sign-in required'); };
  const [route, query] = path.split('?');
  const parts = route.split('/').filter(Boolean);
  const [name, id] = parts;

  if (['properties', 'agents', 'inquiries'].includes(name)) {
    if (method === 'GET') { if (name === 'inquiries') requireAdmin(); return db[name]; }
    if (method === 'POST') {
      if (name !== 'inquiries') requireAdmin();
      const mine = name === 'inquiries' && user?.role === 'user';
      const item = { ...body, id: uid(), createdAt: Date.now(), ...(mine ? { userId: user.id } : {}) };
      db[name] = [item, ...db[name]];
      changed(name);
      if (mine) logActivity(user.id, 'inquiry', { inquiryId: item.id, type: item.type, subject: item.subject || item.address || '', propertyId: item.propertyId });
      return item;
    }
    requireAdmin();
    if (method === 'PATCH') {
      db[name] = db[name].map((x) => (x.id === id ? { ...x, ...body, id } : x));
      changed(name);
      return db[name].find((x) => x.id === id);
    }
    if (method === 'DELETE') { db[name] = db[name].filter((x) => x.id !== id); changed(name); return { ok: true }; }
  }

  if (name === 'users') {
    requireAdmin();
    if (method === 'DELETE') { db.users = db.users.filter((u) => u.id !== id); changed('users'); return { ok: true }; }
    if (id && parts[2] === 'data') return accountData(id);
    return db.users.map(userSummary);
  }

  if (name === 'me') {
    requireUser();
    const [, section, itemId] = parts;
    if (section === 'data') return accountData(user.id);
    if (section === 'saved' && method === 'PATCH') {
      const before = new Set(account.saved || []);
      const ids = [...new Set(body.ids || [])];
      const titleOf = (pid) => db.properties.find((p) => p.id === pid)?.title || '';
      updateUser(user.id, (u) => ({ ...u, saved: ids }));
      ids.filter((pid) => !before.has(pid)).forEach((pid) => logActivity(user.id, 'save', { propertyId: pid, title: titleOf(pid) }));
      [...before].filter((pid) => !ids.includes(pid)).forEach((pid) => logActivity(user.id, 'unsave', { propertyId: pid, title: titleOf(pid) }));
      return { saved: ids };
    }
    if (section === 'calcs' && method === 'POST') {
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
    }
    if (section === 'calcs' && method === 'PATCH') {
      let updated = null;
      updateUser(user.id, (prev) => {
        const calcs = (prev.calcs || []).map((c) => {
          if (c.id === itemId) {
            updated = { ...c, ...body, id: itemId, updatedAt: Date.now() };
            return updated;
          }
          return c;
        });
        return { ...prev, calcs };
      });
      if (!updated) fail(404, 'Calculation not found');
      return updated;
    }
    if (section === 'calcs' && method === 'DELETE') { updateUser(user.id, (u) => ({ ...u, calcs: (u.calcs || []).filter((c) => c.id !== itemId) })); return { ok: true }; }
    if (section === 'activity' && method === 'POST') {
      if (!['view', 'search'].includes(body.type)) fail(400, 'Unknown activity');
      logActivity(user.id, body.type, body.data || {});
      return { ok: true };
    }
    if (section === 'activity' && method === 'DELETE') { updateUser(user.id, (u) => ({ ...u, activity: [] })); return { ok: true }; }
    if (section === 'profile' && method === 'PATCH') {
      const nm = String(body.name ?? '').trim();
      if (!nm) fail(400, 'Name is required');
      return publicUser(updateUser(user.id, (u) => ({ ...u, name: nm, phone: String(body.phone ?? u.phone ?? '').trim() })));
    }
  }

  if (name === 'settings') {
    if (method === 'PATCH') { requireAdmin(); db.settings = { ...db.settings, ...body }; changed('settings'); }
    return db.settings;
  }

  if (name === 'auth') {
    const session = (u) => {
      const t = uid() + uid();
      db.sessions[t] = u.role === 'admin' ? u : { id: u.id, role: 'user' };
      save();
      return { token: t, user: u };
    };
    if (id === 'login') {
      const email = String(body.email || '').toLowerCase();
      if (email === ADMIN.email && body.password === ADMIN.password) return session({ id: 'admin', name: 'Administrator', email, role: 'admin' });
      const u = db.users.find((x) => x.email === email && x.password === body.password);
      if (!u) fail(401, 'Invalid email or password');
      return session({ ...publicUser(u), role: 'user' });
    }
    if (id === 'signup') {
      const email = String(body.email || '').toLowerCase();
      if (email === ADMIN.email || db.users.some((u) => u.email === email)) fail(409, 'Email already registered');
      const u = { id: uid(), name: body.name, email, password: body.password, createdAt: Date.now() };
      db.users = [...db.users, u];
      changed('users');
      return session({ ...publicUser(u), role: 'user' });
    }
    if (id === 'logout') { delete db.sessions[token]; save(); return { ok: true }; }
    if (id === 'me') return user;
  }

  if (name === 'mortgage-rates') return MORTGAGE;

  if (name === 'resolve-image') {
    // No server to read web pages in demo mode; direct image links still work.
    const url = new URLSearchParams(query).get('url') || '';
    fail(400, `Paste a direct image link (ending in .jpg, .png, .webp) or upload the photo. Page links need the server: ${url.slice(0, 40)}`);
  }

  fail(404, 'Not found');
}

export const resetDemoData = () => { db = fresh(); save(); window.location.reload(); };
