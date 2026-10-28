import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrency, setCurrency } from '../utils/format';
import CurrencyNotice from '../components/ui/CurrencyNotice';
import { fetchLiveRates, RATES_REFRESH_MS } from '../utils/rates';
import { API_BASE, DEMO, api, setToken } from '../utils/api';

const StoreContext = createContext(null);

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

// Per-browser conveniences only (homes saved before signing in, sign-in token, cached FX rates).
const usePersisted = (key, fallback) => {
  const [value, setValue] = useState(() => load(key, fallback));
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
};

const DEFAULT_SETTINGS = { currency: 'INR', priceBase: 'INR', rates: {}, autoRates: true, mortgageRate: null };

export function StoreProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  // Homes saved while signed out stay in this browser; a client's saved homes live on their account.
  const [localFavorites, setLocalFavorites] = usePersisted('bask.favorites', []);
  const [account, setAccount] = useState(null); // { profile, saved, calcs, activity, inquiries }
  const [auth, setAuth] = usePersisted('bask.auth', null); // { token, user }
  const [live, setLive] = usePersisted('bask.liveRates.inr', null);
  const [rateStatus, setRateStatus] = useState({ loading: false, error: '' });
  const [mortgage, setMortgage] = useState(null);

  setToken(auth?.token || null);
  const session = auth?.user || null;
  const isAdmin = session?.role === 'admin';
  const isClient = session?.role === 'user';
  const clientId = isClient ? session.id : null;

  const fetchers = useMemo(() => ({
    me: () => (clientId ? api('/me/data').then(setAccount) : Promise.resolve(setAccount(null))),
    properties: () => api('/properties').then(setProperties),
    agents: () => api('/agents').then(setAgents),
    settings: () => api('/settings').then((s) => setSettings({ ...DEFAULT_SETTINGS, ...s })),
    inquiries: () => (isAdmin ? api('/inquiries').then(setInquiries) : Promise.resolve()),
    users: () => (isAdmin ? api('/users').then(setUsers) : Promise.resolve()),
  }), [isAdmin, clientId]);

  // A change event refetches that collection. Account changes only refetch in that account's tabs,
  // and a client refetches their account when inquiries change (so status updates show live).
  const onRemoteChange = useCallback(({ collection, userId }) => {
    if (collection === 'me') { if (userId && userId === clientId) fetchers.me().catch(() => {}); return; }
    fetchers[collection]?.().catch(() => {});
    if (collection === 'inquiries' && clientId) fetchers.me().catch(() => {});
  }, [fetchers, clientId]);

  // Initial load, then live updates pushed by the server whenever anything changes.
  useEffect(() => {
    Promise.all(Object.values(fetchers).map((f) => f().catch(() => setOnline(false))))
      .finally(() => setReady(true));
    if (DEMO) {
      const onChange = (e) => onRemoteChange(e.detail);
      window.addEventListener('bask:change', onChange);
      return () => window.removeEventListener('bask:change', onChange);
    }
    const es = new EventSource(`${API_BASE}/events`);
    es.onopen = () => setOnline(true);
    es.onerror = () => setOnline(false);
    es.onmessage = (e) => onRemoteChange(JSON.parse(e.data));
    return () => es.close();
  }, [fetchers, onRemoteChange]);

  // Drop a sign-in the server no longer recognizes (e.g. after a server restart).
  useEffect(() => {
    if (!auth?.token) return;
    api('/auth/me').then((u) => {
      if (!u) setAuth(null);
      else if (u.name !== auth.user?.name) setAuth((a) => a && { ...a, user: { ...a.user, ...u } });
    }).catch(() => {});
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
  // Manual rates are "units per 1 INR"; anything saved before prices moved to INR is ignored.
  const liveRate = live?.base === 'INR' ? live.rates?.[settings.currency] : undefined;
  const manualRate = settings.priceBase === 'INR' ? settings.rates?.[settings.currency] : undefined;
  setCurrency(settings.currency, settings.autoRates !== false && liveRate ? liveRate : manualRate);
  const { code: curCode, rate: curRate } = getCurrency();

  // When the display currency or its rate changes (admin save, or a live rate update), prices briefly
  // blur under a loader, then a confirmation shows. Changes during the first moments after load are
  // just data settling in, so they update silently.
  const [currencyNotice, setCurrencyNotice] = useState(null);
  const prevCur = useRef(null);
  const settledAt = useRef(0);
  useEffect(() => { if (ready) settledAt.current = Date.now() + 3000; }, [ready]);
  useEffect(() => {
    const prev = prevCur.current;
    prevCur.current = { code: curCode, rate: curRate };
    if (!prev || !settledAt.current || Date.now() < settledAt.current) return undefined;
    const codeChanged = prev.code !== curCode;
    if (!codeChanged && Math.abs(prev.rate - curRate) / prev.rate < 0.0001) return undefined;
    const root = document.documentElement;
    root.classList.add('currency-updating');
    setCurrencyNotice({ phase: 'loading', code: curCode, rate: curRate, from: prev.code, codeChanged });
    const t1 = setTimeout(() => {
      root.classList.remove('currency-updating');
      setCurrencyNotice((n) => n && { ...n, phase: 'done' });
    }, 900);
    const t2 = setTimeout(() => setCurrencyNotice(null), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); root.classList.remove('currency-updating'); };
  }, [curCode, curRate]);

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

  const favorites = isClient ? account?.saved || [] : localFavorites;

  const saveSaved = useCallback((ids) => {
    setAccount((a) => a && { ...a, saved: ids });
    return api('/me/saved', { method: 'PATCH', body: { ids } }).catch(() => fetchers.me());
  }, [fetchers]);

  // Homes saved before signing in move onto the account the first time it loads.
  useEffect(() => {
    if (!isClient || !account || !localFavorites.length) return;
    const merged = [...new Set([...account.saved, ...localFavorites])];
    setLocalFavorites([]);
    if (merged.length !== account.saved.length) saveSaved(merged);
  }, [isClient, account, localFavorites, setLocalFavorites, saveSaved]);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    if (isClient) saveSaved(next);
    else setLocalFavorites(next);
  };

  // Views and searches go to the account history; everything else is logged by the server itself.
  const track = useCallback((type, data) => {
    if (clientId) api('/me/activity', { method: 'POST', body: { type, data } }).catch(() => {});
  }, [clientId]);

  const getUserData = useCallback((id) => api(`/users/${id}/data`), []);

  const value = {
    ready, online, properties, agents, inquiries, users, settings, favorites, session, isAdmin,
    live, rateStatus, refreshRates, mortgage,
    isClient, account, track,
    saveCalc: (calc) => {
      const method = calc.id ? 'PATCH' : 'POST';
      const path = calc.id ? `/me/calcs/${calc.id}` : '/me/calcs';
      return api(path, { method, body: calc }).then((res) => {
        setAccount((prev) => {
          if (!prev) return prev;
          const prevCalcs = prev.calcs || [];
          const idx = prevCalcs.findIndex((c) => c.id === res.id);
          const nextCalcs = idx >= 0
            ? prevCalcs.map((c, i) => (i === idx ? res : c))
            : [res, ...prevCalcs];
          return { ...prev, calcs: nextCalcs };
        });
        return res;
      });
    },
    deleteCalc: (id) => {
      setAccount((prev) => (prev ? { ...prev, calcs: (prev.calcs || []).filter((c) => c.id !== id) } : prev));
      return api(`/me/calcs/${id}`, { method: 'DELETE' });
    },
    clearHistory: () => api('/me/activity', { method: 'DELETE' }),
    updateProfile: async (patch) => {
      const u = await api('/me/profile', { method: 'PATCH', body: patch });
      setAuth((a) => a && { ...a, user: { ...a.user, ...u } });
      return u;
    },
    getUserData,
    addProperty: P.add, updateProperty: P.update, deleteProperty: P.remove,
    addAgent: A.add, updateAgent: A.update, deleteAgent: A.remove,
    addInquiry: I.add, updateInquiry: I.update, deleteInquiry: I.remove,
    deleteUser: (id) => api(`/users/${id}`, { method: 'DELETE' }),
    updateSettings: (patch) => api('/settings', { method: 'PATCH', body: patch }),
    toggleFavorite,
    login: signIn('/auth/login'),
    signup: signIn('/auth/signup'),
    logout: () => { api('/auth/logout', { method: 'POST' }).catch(() => {}); setAuth(null); setAccount(null); },
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      <CurrencyNotice notice={currencyNotice} />
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
