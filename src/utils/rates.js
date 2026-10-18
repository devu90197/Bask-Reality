// Free, no-key exchange rates (ExchangeRate-API open access). The source refreshes once a day.
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

export const RATES_REFRESH_MS = 30 * 60 * 1000;

export async function fetchLiveRates() {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error(`Rate service returned ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error('Rate service returned an error');
  return {
    rates: data.rates,
    sourceUpdatedAt: data.time_last_update_unix * 1000,
    nextUpdateAt: data.time_next_update_unix * 1000,
    fetchedAt: Date.now(),
  };
}
