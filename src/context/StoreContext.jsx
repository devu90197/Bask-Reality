import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setCurrency } from '../utils/format';
import { fetchLiveRates, RATES_REFRESH_MS } from '../utils/rates';
import { api, setToken } from '../utils/api';

const StoreContext = createContext(null);

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

// Per-browser conveniences only (saved homes, sign-in token, cached FX rates).
const usePersisted = (key, fallback) => {
  const [value, setValue] = useState(() => load(key, fallback));
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
};

const DEFAULT_SETTINGS = { currency: 'USD', rates: {}, autoRates: true, mortgageRate: null };

export function StoreProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [favorites, setFavorites] = usePersisted('bask.favorites', []);
  const [auth, setAuth] = usePersisted('bask.auth', null); // { token, user }
  const [live, setLive] = usePersisted('bask.liveRates', null);
  const [rateStatus, setRateStatus] = useState({ loading: false, error: '' });
  const [mortgage, setMortgage] = useState(null);

  setToken(auth?.token || null);
  const session = auth?.user || null;
  const isAdmin = session?.role === 'admin';

  const fetchers = useMemo(() => ({
    properties: () => api('/properties').then(setProperties),
    agents: () => api('/agents').then(setAgents),
    settings: () => api('/settings').then((s) => setSettings({ ...DEFAULT_SETTINGS, ...s })),
    inquiries: () => (isAdmin ? api('/inquiries').then(setInquiries) : Promise.resolve()),
    users: () => (isAdmin ? api('/users').then(setUsers) : Promise.resolve()),
  }), [isAdmin]);

  // Initial load, then live updates pushed by the server whenever anything changes.
  useEffect(() => {
    Promise.all(Object.values(fetchers).map((f) => f().catch(() => setOnline(false))))
      .finally(() => setReady(true));
    const es = new EventSource('/api/events');
    es.onopen = () => setOnline(true);
    es.onerror = () => setOnline(false);
    es.onmessage = (e) => {
      const { collection } = JSON.parse(e.data);
      fetchers[collection]?.().catch(() => {});
    };
    return () => es.close();
  }, [fetchers]);

  // Drop a sign-in the server no longer recognizes (e.g. after a server restart).
  useEffect(() => {
    if (!auth?.token) return;
    api('/auth/me').then((u) => { if (!u) setAuth(null); }).catch(() => {});
  }, [auth?.token, setAuth]);

  const refreshRates = useCallback(async () => {
    setRateStatus({ loading: true, error: '' });
    try {
      setLive(await fetchLiveRates());
      setRateStatus({ loading: false, error: '' });
    } catch (e) {
      setRateStatus({ loading: false, error: e.message || 'Could not load live rates' });
    }
  }, [setLive]);

  useEffect(() => {
    refreshRates();
    const t = setInterval(refreshRates, RATES_REFRESH_MS);
    return () => clearInterval(t);
  }, [refreshRates]);

  useEffect(() => {
    const get = () => api('/mortgage-rates').then(setMortgage).catch(() => {});
    get();
    const t = setInterval(get, 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Applied during render so every formatPrice call below uses the chosen currency.
  const liveRate = live?.rates?.[settings.currency];
  setCurrency(settings.currency, settings.autoRates !== false && liveRate ? liveRate : settings.rates?.[settings.currency]);

  const crud = (path) => ({
    add: (item) => api(`/${path}`, { method: 'POST', body: item }),
    update: (id, patch) => api(`/${path}/${id}`, { method: 'PATCH', body: patch }),
    remove: (id) => api(`/${path}/${id}`, { method: 'DELETE' }),
  });
  const P = crud('properties');
  const A = crud('agents');
  const I = crud('inquiries');

  const signIn = (path) => async (form) => {
    try {
      setAuth(await api(path, { method: 'POST', body: form }));
      return null;
    } catch (e) {
      return e.message;
    }
  };

  const value = {
    ready, online, properties, agents, inquiries, users, settings, favorites, session, isAdmin,
    live, rateStatus, refreshRates, mortgage,
    addProperty: P.add, updateProperty: P.update, deleteProperty: P.remove,
    addAgent: A.add, updateAgent: A.update, deleteAgent: A.remove,
    addInquiry: I.add, updateInquiry: I.update, deleteInquiry: I.remove,
    deleteUser: (id) => api(`/users/${id}`, { method: 'DELETE' }),
    updateSettings: (patch) => api('/settings', { method: 'PATCH', body: patch }),
    toggleFavorite: (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    login: signIn('/auth/login'),
    signup: signIn('/auth/signup'),
    logout: () => { api('/auth/logout', { method: 'POST' }).catch(() => {}); setAuth(null); },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
