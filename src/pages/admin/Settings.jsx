import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CURRENCIES, formatPrice } from '../../utils/format';
import Select from '../../components/ui/Select';

const money = (n, code, locale) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);

const rateText = (r) => (r == null ? '—' : r >= 100 ? r.toFixed(2) : r.toFixed(4));

export default function Settings() {
  const { settings, updateSettings, live, rateStatus, refreshRates, mortgage } = useStore();
  const [mortgageRate, setMortgageRate] = useState(settings.mortgageRate ?? '');
  const [code, setCode] = useState(settings.currency);
  const [auto, setAuto] = useState(settings.autoRates !== false);
  const base = CURRENCIES.find((c) => c.code === code);
  const liveRate = live?.rates?.[code];
  const [manual, setManual] = useState(settings.rates?.[code] ?? liveRate ?? base.rate);
  const [saved, setSaved] = useState(false);

  const effectiveRate = code === 'USD' ? 1 : auto && liveRate ? liveRate : Number(manual) || 0;

  const pick = (c) => {
    setCode(c);
    setManual(settings.rates?.[c] ?? live?.rates?.[c] ?? CURRENCIES.find((x) => x.code === c).rate);
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    await updateSettings({ currency: code, autoRates: auto, rates: { ...settings.rates, [code]: Number(manual) }, mortgageRate: mortgageRate === '' ? null : Number(mortgageRate) });
    setSaved(true);
  };

  return (
    <>
      <div className="admin-top">
        <div><h2 style={{ margin: 0 }}>Settings</h2><p className="muted" style={{ margin: 0 }}>Site-wide preferences.</p></div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={save}>
          <h3>Currency</h3>
          <p className="muted">Prices are stored in USD and converted to the currency you choose here.</p>
          {saved && <div className="alert">Saved. Every open page has been updated.</div>}

          <div className="field">
            <label htmlFor="cur">Display currency</label>
            <Select id="cur" value={code} onChange={pick} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))} />
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setSaved(false); }} />
            Update the rate automatically from live market data
          </label>

          {!auto && (
            <div className="field">
              <label htmlFor="rate">Manual rate (1 USD = ? {code})</label>
              <input id="rate" className="input" type="number" step="any" min="0.0001" required disabled={code === 'USD'}
                value={code === 'USD' ? 1 : manual} onChange={(e) => { setManual(e.target.value); setSaved(false); }} />
            </div>
          )}

          <div className="alert" style={{ background: 'var(--glass)', color: 'var(--ink)' }}>
            Rate in use: <b>1 USD = {rateText(effectiveRate)} {code}</b>
            {auto && code !== 'USD' && !liveRate && <div className="muted">Live rate unavailable, using manual rate.</div>}
            <div className="muted" style={{ fontSize: '.9rem' }}>
              A {money(500000, 'USD', 'en-US')} home shows as <b>{money(500000 * effectiveRate, code, base.locale)}</b> (site currently shows {formatPrice(500000)}).
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Mortgage rate</h3>
          <p className="muted" style={{ fontSize: '.9rem' }}>
            Live US average: <b>{mortgage ? `${mortgage.rate30.toFixed(2)}% (30-yr) · ${mortgage.rate15.toFixed(2)}% (15-yr)` : 'loading…'}</b>.
            Leave blank to use it, or enter your local bank rate (for example an Indian home-loan rate).
          </p>
          <div className="field">
            <label htmlFor="mrate">Custom interest rate (%)</label>
            <input id="mrate" className="input" type="number" step="0.01" min="0" max="30" placeholder="Use live US average" value={mortgageRate} onChange={(e) => { setMortgageRate(e.target.value); setSaved(false); }} />
          </div>

          <button className="btn btn-primary">Save settings</button>
        </form>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Live exchange rates</h3>
            <button className="btn btn-ghost btn-sm" onClick={refreshRates} disabled={rateStatus.loading}>
              {rateStatus.loading ? 'Refreshing…' : '↻ Refresh now'}
            </button>
          </div>
          {rateStatus.error && <div className="alert alert-error" style={{ marginTop: 12 }}>{rateStatus.error}</div>}
          {live ? (
            <>
              <p className="muted" style={{ fontSize: '.88rem', margin: '10px 0' }}>
                Market rate published {new Date(live.sourceUpdatedAt).toLocaleString()} · checked {new Date(live.fetchedAt).toLocaleTimeString()}
                <br />Next update from the source: {new Date(live.nextUpdateAt).toLocaleString()}
              </p>
              <table style={{ minWidth: 0 }}>
                <thead><tr><th>Currency</th><th>1 USD =</th></tr></thead>
                <tbody>
                  {CURRENCIES.map((c) => (
                    <tr key={c.code} style={c.code === settings.currency ? { background: 'var(--brand-50)' } : undefined}>
                      <td><b>{c.code}</b> <span className="muted">{c.label}</span></td>
                      <td>{rateText(live.rates[c.code])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>{rateStatus.loading ? 'Loading live rates…' : 'No live rates loaded yet.'}</p>
          )}
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 12, marginBottom: 0 }}>
            Rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>ExchangeRate-API</a>. Checked every 30 minutes; the free source publishes a new rate once a day.
          </p>
        </div>
      </div>
    </>
  );
}
