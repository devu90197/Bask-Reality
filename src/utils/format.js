// Prices are stored in USD and converted to the display currency chosen in Admin → Settings.
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', locale: 'en-US', rate: 1 },
  { code: 'INR', label: 'Indian Rupee', locale: 'en-IN', rate: 83 },
  { code: 'EUR', label: 'Euro', locale: 'de-DE', rate: 0.92 },
  { code: 'GBP', label: 'British Pound', locale: 'en-GB', rate: 0.79 },
  { code: 'AED', label: 'UAE Dirham', locale: 'en-AE', rate: 3.67 },
  { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA', rate: 1.36 },
  { code: 'AUD', label: 'Australian Dollar', locale: 'en-AU', rate: 1.52 },
  { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG', rate: 1.34 },
  { code: 'JPY', label: 'Japanese Yen', locale: 'ja-JP', rate: 150 },
];

let current = { ...CURRENCIES[0] };

export const setCurrency = (code, rate) => {
  const base = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  current = { ...base, rate: Number(rate) > 0 ? Number(rate) : base.rate };
};

export const getCurrency = () => current;

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
