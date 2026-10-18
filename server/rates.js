// Live US mortgage rates: Freddie Mac Primary Mortgage Market Survey via FRED (no API key needed).
// Freddie Mac publishes new averages every Thursday.
const FRED_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US,MORTGAGE15US';
const CACHE_MS = 6 * 60 * 60 * 1000;

let cache = null;

export async function getMortgageRates() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache;

  const res = await fetch(FRED_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`FRED returned ${res.status}`);
  const rows = (await res.text()).trim().split('\n').slice(1)
    .map((line) => line.split(','))
    .filter(([, r30, r15]) => r30 !== '.' && r15 !== '.');

  const [date, r30, r15] = rows.at(-1);
  const [, prev30, prev15] = rows.at(-2);
  cache = {
    asOf: date,
    rate30: Number(r30),
    rate15: Number(r15),
    change30: +(r30 - prev30).toFixed(2),
    change15: +(r15 - prev15).toFixed(2),
    history: rows.slice(-12).map(([d, a, b]) => ({ date: d, rate30: Number(a), rate15: Number(b) })),
    source: 'Freddie Mac Primary Mortgage Market Survey (via FRED)',
    fetchedAt: Date.now(),
  };
  return cache;
}
