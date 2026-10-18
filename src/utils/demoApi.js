// Demo mode: an in-browser stand-in for the API server so the site runs on static hosting
// (e.g. Vercel) with the sample data from server/seed.js. Changes are saved in this browser only.
// Turn it off by setting VITE_API_URL once the real backend is deployed.
import { buildSeed } from '../../server/seed.js';

const KEY = 'bask.demoDb.v1';
// Fixed rate so the sample rupee prices display exactly as written.
const DEMO_INR_PER_USD = 83;
const ADMIN = { email: 'admin@baskreality.com', password: 'admin123' };

const MORTGAGE = {
  asOf: '2026-10-15', rate30: 7.4, rate15: 6.71, change30: 0, change15: -0.02,
  source: 'Freddie Mac Primary Mortgage Market Survey (sample figures)', fetchedAt: Date.now(),
};

const fresh = () => {
  const seed = buildSeed(DEMO_INR_PER_USD);
  return { ...seed, settings: { ...seed.settings, autoRates: false, rates: { INR: DEMO_INR_PER_USD } }, sessions: {} };
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
const changed = (collection) => {
  save();
  window.dispatchEvent(new CustomEvent('bask:change', { detail: { collection } }));
};
const publicUser = ({ password, ...u }) => u;

export async function demoApi(path, { method = 'GET', body = {} } = {}, token) {
  const user = db.sessions[token] || null;
  const requireAdmin = () => { if (user?.role !== 'admin') fail(401, 'Admin sign-in required'); };
  const [route, query] = path.split('?');
  const parts = route.split('/').filter(Boolean);
  const [name, id] = parts;

  if (['properties', 'agents', 'inquiries'].includes(name)) {
    if (method === 'GET') { if (name === 'inquiries') requireAdmin(); return db[name]; }
    if (method === 'POST') {
      if (name !== 'inquiries') requireAdmin();
      const item = { ...body, id: uid(), createdAt: Date.now() };
      db[name] = [item, ...db[name]];
      changed(name);
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
    return db.users.map(publicUser);
  }

  if (name === 'settings') {
    if (method === 'PATCH') { requireAdmin(); db.settings = { ...db.settings, ...body }; changed('settings'); }
    return db.settings;
  }

  if (name === 'auth') {
    const session = (u) => { const t = uid() + uid(); db.sessions[t] = u; save(); return { token: t, user: u }; };
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
