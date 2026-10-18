// Thin client for the BASK Reality API (server/index.js).
// Without VITE_API_URL in a production build, requests are answered in the browser by the demo
// API (sample data), so the site works on static hosting before the backend is deployed.
import { demoApi } from './demoApi';

const API_URL = import.meta.env.VITE_API_URL || '';
export const DEMO = import.meta.env.VITE_DEMO === 'true' || (import.meta.env.PROD && !API_URL);
export const API_BASE = `${API_URL}/api`;

let token = null;

export const setToken = (t) => { token = t; };

export async function api(path, { method = 'GET', body } = {}) {
  if (DEMO) return structuredClone(await demoApi(path, { method, body }, token));

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}
