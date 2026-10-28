// Every price is stored once, in the base currency (INR), exactly as entered. Other currencies are
// derived from it with the latest reference rate (Frankfurter / ECB), chosen in Admin → Settings.
export const BASE_CURRENCY = 'INR';

// `rate` = units of that currency per 1 INR. These are offline fallbacks only; live rates replace them.
export const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', locale: 'en-IN', rate: 1 },
  { code: 'USD', label: 'US Dollar', locale: 'en-US', rate: 0.0105 },
  { code: 'EUR', label: 'Euro', locale: 'de-DE', rate: 0.0094 },
  { code: 'GBP', label: 'British Pound', locale: 'en-GB', rate: 0.0079 },
  { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA', rate: 0.0147 },
  { code: 'AUD', label: 'Australian Dollar', locale: 'en-AU', rate: 0.015 },
  { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG', rate: 0.0135 },
  { code: 'CHF', label: 'Swiss Franc', locale: 'de-CH', rate: 0.0087 },
  { code: 'JPY', label: 'Japanese Yen', locale: 'ja-JP', rate: 1.66 },
];

let current = { ...CURRENCIES[0] };

export const setCurrency = (code, rate) => {
  const base = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  current = { ...base, rate: code === BASE_CURRENCY ? 1 : Number(rate) > 0 ? Number(rate) : base.rate };
};

export const getCurrency = () => current;

// Convert between the stored base (INR) and the display currency (used where people type prices).
export const toDisplay = (base) => Number(base) * current.rate;
export const toBase = (amount) => Number(amount) / current.rate;

// Human-friendly rate: "1 USD = ₹95.12" reads better than "1 INR = 0.0105 USD".
export const rateLabel = (code, rate) => {
  if (code === BASE_CURRENCY || !(rate > 0)) return '';
  const inv = 1 / rate;
  return `1 ${code} = ₹${inv >= 100 ? inv.toFixed(2) : inv.toFixed(inv >= 1 ? 3 : 5)}`;
};

export const currencySymbol = () =>
  new Intl.NumberFormat(current.locale, { style: 'currency', currency: current.code, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0).find((p) => p.type === 'currency')?.value || current.code;

const fmt = (n, opts = {}) =>
  new Intl.NumberFormat(current.locale, { style: 'currency', currency: current.code, maximumFractionDigits: 0, ...opts })
    .format(Number(n) * current.rate);

export const formatPrice = (n, rent = false) => fmt(n) + (rent ? '/mo' : '');

export const formatCompact = (n) => fmt(n, { notation: 'compact', maximumFractionDigits: 1 });

export const monthlyPayment = (principal, ratePct, years) => {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (!r) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const STATUSES = {
  sale: { label: 'For sale', badge: '', page: '/buy', recurring: false },
  rent: { label: 'For rent', badge: 'badge-rent', page: '/rent', recurring: true },
  lease: { label: 'For lease', badge: 'badge-lease', page: '/lease', recurring: true },
};

export const statusInfo = (s) => STATUSES[s] || STATUSES.sale;

export const listingPrice = (p) => formatPrice(p.price, statusInfo(p.status).recurring);
