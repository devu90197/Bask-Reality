// Live reference rates from Frankfurter (open source, no API key, European Central Bank and other
// official reference data). The source publishes one new rate per working day, around 16:00 CET;
// we check often so a new publication shows up within minutes.
import { BASE_CURRENCY } from './format';

const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}`;

export const RATES_SOURCE = { name: 'Frankfurter (European Central Bank reference rates)', url: 'https://frankfurter.dev' };
export const RATES_REFRESH_MS = 15 * 60 * 1000;

// Next expected publication: the following weekday at 16:00 CET (15:00 UTC).
const nextPublication = (from = new Date()) => {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 15));
  if (d <= from) d.setUTCDate(d.getUTCDate() + 1);
  while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
};

export async function fetchLiveRates() {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error(`Rate service returned ${res.status}`);
  const data = await res.json();
  if (!data.rates) throw new Error('Rate service returned no rates');
  return {
    base: data.base,
    rates: { ...data.rates, [data.base]: 1 },
    rateDate: data.date, // the business day the reference rate is for
    sourceUpdatedAt: Date.parse(`${data.date}T15:00:00Z`),
    nextUpdateAt: nextPublication(),
    fetchedAt: Date.now(),
  };
}
