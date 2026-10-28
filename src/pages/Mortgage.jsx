import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../components/ui/PageHero';
import { useStore } from '../context/StoreContext';
import { currencySymbol, formatPrice, getCurrency, monthlyPayment } from '../utils/format';
import Icon from '../components/ui/Icon';

const Change = ({ v }) => (
  <small style={{ color: v > 0 ? 'var(--danger)' : v < 0 ? 'var(--brand)' : 'var(--muted)', fontWeight: 600 }}>
    {v > 0 ? '▲' : v < 0 ? '▼' : '•'} {Math.abs(v).toFixed(2)} vs last week
  </small>
);

// Reads as plain bold text; click it to type a value. While typing the text is kept as entered
// (so "8." or "1,2" are fine) and every valid number updates the slider; on blur it tidies up.
function InlineNumber({ value, format, onChange, min, max, decimals = false, label }) {
  const [draft, setDraft] = useState(null);
  const text = draft ?? format(value);
  const commit = (raw) => {
    const n = Number.parseFloat(raw.replace(/[^\d.]/g, ''));
    if (Number.isNaN(n)) return;
    const v = Math.min(max, Math.max(min, decimals ? n : Math.round(n)));
    onChange(v);
  };
  // A hidden copy of the text sizes the wrapper, so the input is always exactly as wide as its value.
  return (
    <span className="inline-grow" data-value={text}>
      <input
        className="inline-amount" type="text" inputMode={decimals ? 'decimal' : 'numeric'} aria-label={label}
        value={text} size={1}
        onFocus={(e) => { setDraft(format(value)); e.target.select(); }}
        onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
    </span>
  );
}

export default function Mortgage() {
  const { mortgage, settings, isClient, account, saveCalc, properties } = useStore();
  const [params] = useSearchParams();
  const rate = getCurrency().rate;
  // Inputs are in the display currency; formatPrice expects the stored base (INR), so convert back.
  const toBase = (v) => v / rate;
  const [price, setPrice] = useState(Math.round((Number(params.get('price')) || 10000000) * rate));
  const [downPct, setDownPct] = useState(20);
  const [interest, setInterest] = useState(settings.mortgageRate || 6.5);
  const [years, setYears] = useState(30);
  const [taxPct, setTaxPct] = useState(1.1);
  const [insurance, setInsurance] = useState(Math.round(10000 * rate));
  const [touched, setTouched] = useState(false);

  // Opening a saved calculation (?calc=id from the account) restores all of its inputs.
  const calcId = params.get('calc');
  const propertyId = params.get('property') || undefined;
  const [loadedCalc, setLoadedCalc] = useState(null);
  const currentCalcId = useRef(calcId || null);

  useEffect(() => {
    if (calcId) currentCalcId.current = calcId;
  }, [calcId]);

  useEffect(() => {
    const c = calcId && account?.calcs.find((x) => x.id === calcId);
    if (!c || loadedCalc === c.id) return;
    setPrice(Math.round(c.price * rate));
    setDownPct(c.downPct);
    setInterest(c.interest);
    setYears(c.years);
    setTaxPct(c.taxPct);
    setInsurance(Math.round(c.insurance * rate));
    setTouched(true);
    setLoadedCalc(c.id);
  }, [calcId, account, loadedCalc, rate]);

  const linkedTitle = propertyId && properties.find((x) => x.id === propertyId)?.title;
  const [calcName, setCalcName] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [autoSaveState, setAutoSaveState] = useState('idle'); // idle | saving | saved

  // Start from today's live rate until the user changes it.
  useEffect(() => {
    if (touched) return;
    const live = settings.mortgageRate || (years === 15 ? mortgage?.rate15 : mortgage?.rate30);
    if (live) setInterest(live);
  }, [mortgage, settings.mortgageRate, years, touched]);

  const loan = price * (1 - downPct / 100);
  const pi = monthlyPayment(loan, interest, years);
  const tax = (price * taxPct) / 100 / 12;
  const total = pi + tax + Number(insurance);
  const parts = [
    { label: 'Principal & interest', v: pi, c: 'var(--brand)' },
    { label: 'Property tax', v: tax, c: '#60a5fa' },
    { label: 'Insurance', v: Number(insurance), c: 'var(--accent)' },
  ];
  const money = (v) => formatPrice(Math.round(toBase(v)));

  // Auto-record calculation to account history when inputs change
  useEffect(() => {
    if (!isClient || !touched) return;
    setAutoSaveState('saving');
    const timer = setTimeout(async () => {
      try {
        const payload = {
          id: currentCalcId.current || undefined,
          name: calcName.trim() || linkedTitle || `Estimate for ${money(price)} (${years}yr @ ${Number(interest).toFixed(2)}%)`,
          propertyId,
          price: Math.round(toBase(price)),
          downPct,
          interest,
          years,
          taxPct,
          insurance: Math.round(toBase(insurance)),
          pi: Math.round(toBase(pi)),
          tax: Math.round(toBase(tax)),
          monthly: Math.round(toBase(total)),
          isAutoSaved: true,
        };
        const saved = await saveCalc(payload);
        if (saved?.id) currentCalcId.current = saved.id;
        setAutoSaveState('saved');
      } catch {
        setAutoSaveState('idle');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [isClient, touched, price, downPct, interest, years, taxPct, insurance, propertyId, linkedTitle, calcName]);

  // Saved in the base currency (INR) so it reads correctly whatever currency the site shows later.
  const save = async (e) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const saved = await saveCalc({
        id: currentCalcId.current || undefined,
        name: calcName.trim() || linkedTitle || `Home at ${money(price)}`,
        propertyId,
        price: Math.round(toBase(price)), downPct, interest, years, taxPct,
        insurance: Math.round(toBase(insurance)),
        pi: Math.round(toBase(pi)), tax: Math.round(toBase(tax)), monthly: Math.round(toBase(total)),
      });
      if (saved?.id) currentCalcId.current = saved.id;
      setSaveState('saved');
      setAutoSaveState('saved');
      setCalcName('');
    } catch {
      setSaveState('error');
    }
  };
  // Limits are set in INR (the base) and shown in the display currency.
  const max = Math.round(250000000 * rate);        // ₹25 crore
  const insuranceMax = Math.round(50000 * rate);   // ₹50,000 a month
  const sym = currencySymbol();

  const moneyText = (v) => `${sym}${Math.round(v).toLocaleString(getCurrency().locale)}`;
  const pctText = (v) => `${Number(v).toFixed(2)}%`;

  // Every row: label on the left, an editable value on the right, the slider underneath.
  const field = ({ label, value, setter, min = 0, max: maxV, step, format, decimals, extra, onTouch }) => {
    const set = (v) => { setter(v); onTouch?.(); };
    return (
      <div className="field">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          <span className="inline-value">
            <InlineNumber value={value} format={format} onChange={set} min={min} max={maxV} decimals={decimals} label={label} />
            {extra && <b>{extra}</b>}
          </span>
        </label>
        <input className="range" type="range" min={min} max={maxV} step={step} value={Math.min(value, maxV)} onChange={(e) => set(Number(e.target.value))} aria-label={`${label} slider`} />
      </div>
    );
  };

  return (
    <>
      <PageHero eyebrow="Mortgage" title="Mortgage calculator" text="See today's live mortgage rates and estimate your monthly payment." />
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="grid grid-3">
            <div className="card stat">
              <span className="muted"><span className="live-dot" />30-year fixed</span>
              <b>{mortgage ? `${mortgage.rate30.toFixed(2)}%` : '—'}</b>
              {mortgage && <Change v={mortgage.change30} />}
            </div>
            <div className="card stat">
              <span className="muted"><span className="live-dot" />15-year fixed</span>
              <b>{mortgage ? `${mortgage.rate15.toFixed(2)}%` : '—'}</b>
              {mortgage && <Change v={mortgage.change15} />}
            </div>
            <div className="card">
              <b>What is a mortgage?</b>
              <p className="muted" style={{ fontSize: '.9rem', margin: '6px 0 0' }}>
                A mortgage (home loan) is money borrowed from a bank to buy a home. The home is the security for the loan, and you repay it in monthly installments (EMIs) with interest over 15–30 years.
              </p>
            </div>
          </div>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 10 }}>
            {mortgage ? `US national averages for the week of ${new Date(mortgage.asOf).toLocaleDateString()}, from the ${mortgage.source}. Updated every Thursday.` : 'Loading live rates…'}
            {settings.mortgageRate ? ` The calculator uses a rate of ${settings.mortgageRate}% set by BASK Reality.` : ''}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            {field({ label: 'Home price', value: price, setter: setPrice, max, step: Math.max(1, Math.round(50000 * rate)), format: moneyText })}
            {field({ label: 'Down payment', value: downPct, setter: setDownPct, max: 60, step: 1, format: (v) => `${v}%`, extra: `(${money(price * downPct / 100)})` })}
            {field({ label: 'Interest rate', value: interest, setter: setInterest, min: 1, max: 15, step: 0.01, format: pctText, decimals: true, onTouch: () => setTouched(true) })}
            {field({ label: 'Property tax', value: taxPct, setter: setTaxPct, max: 3, step: 0.05, format: pctText, decimals: true })}
            {field({ label: 'Insurance / month', value: insurance, setter: setInsurance, max: insuranceMax, step: Math.max(1, Math.round(100 * rate)), format: moneyText })}
            <div className="field">
              <label>Loan term</label>
              <div className="chip-row">
                {[15, 20, 30].map((y) => <button key={y} className={`chip ${years === y ? 'active' : ''}`} onClick={() => setYears(y)}>{y} years</button>)}
              </div>
            </div>
          </div>
          <motion.div className="card" initial={{ rotateY: -20, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.8 }} style={{ transformPerspective: 1000 }}>
            <span className="eyebrow">Your estimate</span>
            <div className="calc-result">{money(total)}<small style={{ fontSize: '1rem' }}>/mo</small></div>
            <div className="bar">
              {parts.map((p) => <motion.div key={p.label} animate={{ width: `${(p.v / total) * 100}%` }} style={{ background: p.c }} />)}
            </div>
            {parts.map((p) => (
              <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: p.c, marginRight: 8 }} />{p.label}</span>
                <b>{money(p.v)}</b>
              </div>
            ))}
            <p className="muted" style={{ marginTop: 16 }}>Loan amount: <b>{money(loan)}</b>. This is an estimate, not a loan offer.</p>
            {isClient ? (
              <>
                <div style={{ margin: '14px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.84rem', padding: '9px 12px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--brand)' }}>
                    <Icon name={autoSaveState === 'saved' ? 'check' : autoSaveState === 'saving' ? 'refresh' : 'zap'} size={15} />
                    {autoSaveState === 'saving' ? 'Auto-saving to account history…' : autoSaveState === 'saved' ? 'Auto-saved to your account history' : 'Auto-saves calculations to your account history'}
                  </span>
                  <Link to="/account/calculations" style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'underline' }}>View history →</Link>
                </div>
                <form className="calc-save" onSubmit={save}>
                  <input
                    className="input" placeholder={linkedTitle || `Home at ${money(price)}`} value={calcName} aria-label="Calculation name"
                    onChange={(e) => { setCalcName(e.target.value); setSaveState('idle'); }}
                  />
                  <button className="btn btn-primary btn-sm" disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Saving…' : 'Save calculation'}</button>
                  {saveState === 'saved' && <p className="calc-save-note">✓ Saved. Find it in <Link to="/account/calculations">My account → Calculations</Link>.</p>}
                  {saveState === 'error' && <p className="calc-save-note err">Couldn't save. Please try again.</p>}
                </form>
              </>
            ) : (
              <p className="calc-save-note"><Link to="/login" state={{ from: '/mortgage' }}>Sign in</Link> to automatically save calculations to your account history.</p>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
