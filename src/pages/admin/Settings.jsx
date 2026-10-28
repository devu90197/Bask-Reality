import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { BASE_CURRENCY, CURRENCIES, formatPrice, rateLabel } from '../../utils/format';
import { RATES_SOURCE } from '../../utils/rates';
import Select from '../../components/ui/Select';

const money = (n, code, locale) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);

// Rates are stored as "units per 1 INR"; people think in "₹ per 1 unit", so the form shows the inverse.
const perUnit = (r) => (r > 0 ? 1 / r : '');
const inrText = (r) => (r > 0 ? `₹${(1 / r).toLocaleString('en-IN', { maximumFractionDigits: 1 / r >= 100 ? 2 : 4 })}` : '—');
const SAMPLE = 10000000; // ₹1 crore

export default function Settings() {
  const { settings, updateSettings, live, rateStatus, refreshRates, mortgage } = useStore();
  const [mortgageRate, setMortgageRate] = useState(settings.mortgageRate ?? '');
  const [code, setCode] = useState(settings.currency);
  const [auto, setAuto] = useState(settings.autoRates !== false);
  const base = CURRENCIES.find((c) => c.code === code);
  const liveRate = live?.base === BASE_CURRENCY ? live.rates?.[code] : undefined;
  const savedManual = settings.priceBase === BASE_CURRENCY ? settings.rates?.[code] : undefined;
  const [manual, setManual] = useState(perUnit(savedManual ?? liveRate ?? base.rate));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const effectiveRate = code === BASE_CURRENCY ? 1 : auto && liveRate ? liveRate : Number(manual) > 0 ? 1 / Number(manual) : 0;

  const pick = (c) => {
    setCode(c);
    const lr = live?.base === BASE_CURRENCY ? live.rates?.[c] : undefined;
    const sm = settings.priceBase === BASE_CURRENCY ? settings.rates?.[c] : undefined;
    setManual(perUnit(sm ?? lr ?? CURRENCIES.find((x) => x.code === c).rate));
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await updateSettings({ currency: code, autoRates: auto, priceBase: BASE_CURRENCY, rates: { ...(settings.priceBase === BASE_CURRENCY ? settings.rates : {}), ...(code !== BASE_CURRENCY && Number(manual) > 0 ? { [code]: 1 / Number(manual) } : {}) }, mortgageRate: mortgageRate === '' ? null : Number(mortgageRate) });
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/admin">Admin</Link><span aria-hidden="true">/</span><span>Settings</span></nav>
          <h2 style={{ margin: 0 }}>Settings</h2>
        </div>
      </div>

      <div className="grid grid-2 settings-grid" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={save}>
          <h3>Currency</h3>
          <p className="muted">Every price is stored in its original currency, <b>INR</b>, exactly as entered. Visitors see it converted to the currency you choose here, using the latest reference rate.</p>
          {saved && <div className="alert">Saved. Prices on every open page, including the public site, now use {settings.currency}.</div>}
          {saveError && <div className="alert alert-error">{saveError}</div>}

          <div className="field">
            <label htmlFor="cur">Display currency</label>
            <Select id="cur" value={code} onChange={pick} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))} />
          </div>

          <label className="switch settings-switch">
            <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setSaved(false); }} /><i aria-hidden="true" />
            Auto-update from Frankfurter (ECB rates)
          </label>

          {!auto && (
            <div className="field">
              <label htmlFor="rate">Manual rate (1 {code} = ? INR)</label>
              <input id="rate" className="input" type="number" step="any" min="0.0001" required disabled={code === BASE_CURRENCY}
                value={code === BASE_CURRENCY ? 1 : manual} onChange={(e) => { setManual(e.target.value); setSaved(false); }} />
            </div>
          )}

          <div className="alert" style={{ background: 'var(--glass)', color: 'var(--ink)' }}>
            {code === BASE_CURRENCY ? <b>Showing original INR prices (no conversion)</b> : <>Rate in use: <b>{rateLabel(code, effectiveRate)}</b></>}
            {auto && code !== BASE_CURRENCY && !liveRate && <div className="muted">Live rate unavailable, using the manual rate.</div>}
            {auto && liveRate && live?.rateDate && <div className="muted" style={{ fontSize: '.85rem' }}>Reference rate for {new Date(live.rateDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {RATES_SOURCE.name}</div>}
            <div className="muted" style={{ fontSize: '.9rem' }}>
              A {money(SAMPLE, 'INR', 'en-IN')} home shows as <b>{money(SAMPLE * effectiveRate, code, base.locale)}</b> (site currently shows {formatPrice(SAMPLE)}).
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

          <button className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="cur-spinner sm" aria-hidden="true" /> Saving…</> : 'Save settings'}
          </button>
        </form>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Live exchange rates</h3>
            <button className="btn btn-ghost btn-sm" onClick={refreshRates} disabled={rateStatus.loading}>
              {rateStatus.loading ? 'Refreshing…' : '↻ Refresh now'}
            </button>
          </div>
          {rateStatus.error && <div className="alert alert-error" style={{ marginTop: 12 }}>{rateStatus.error}</div>}
          {live?.base === BASE_CURRENCY ? (
            <>
              <div className="rate-meta">
                <div><span>Rate date</span><b>{new Date(live.rateDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</b></div>
                <div><span>Last checked</span><b>{new Date(live.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div>
                <div><span>Next publication</span><b>{new Date(live.nextUpdateAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</b></div>
              </div>
              <table style={{ minWidth: 0 }}>
                <thead><tr><th>Currency</th><th>1 unit =</th><th>₹1 crore =</th></tr></thead>
                <tbody>
                  {CURRENCIES.filter((c) => c.code !== BASE_CURRENCY).map((c) => (
                    <tr key={c.code} className={c.code === settings.currency ? 'row-editing' : undefined}>
                      <td><b>{c.code}</b> <span className="muted">{c.label}</span></td>
                      <td className="ag-num">{inrText(live.rates[c.code])}</td>
                      <td className="ag-num">{live.rates[c.code] ? money(SAMPLE * live.rates[c.code], c.code, c.locale) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>{rateStatus.loading ? 'Loading live rates…' : 'No live rates loaded yet.'}</p>
          )}
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 12, marginBottom: 0 }}>
            Rates by <a href={RATES_SOURCE.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Frankfurter</a> (open source, European Central Bank reference rates). New rates are published once per working day around 16:00 CET; this site checks every 15 minutes and updates prices automatically.
          </p>
        </div>
      </div>
    </>
  );
}
