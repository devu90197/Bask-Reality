import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../components/ui/PageHero';
import { useStore } from '../context/StoreContext';
import { formatPrice, getCurrency, monthlyPayment } from '../utils/format';

const Change = ({ v }) => (
  <small style={{ color: v > 0 ? 'var(--danger)' : v < 0 ? 'var(--brand)' : 'var(--muted)', fontWeight: 600 }}>
    {v > 0 ? '▲' : v < 0 ? '▼' : '•'} {Math.abs(v).toFixed(2)} vs last week
  </small>
);

export default function Mortgage() {
  const { mortgage, settings } = useStore();
  const [params] = useSearchParams();
  const rate = getCurrency().rate;
  // Inputs are in the display currency; formatPrice expects USD, so convert back.
  const toUsd = (v) => v / rate;
  const [price, setPrice] = useState(Math.round((Number(params.get('price')) || 500000) * rate));
  const [downPct, setDownPct] = useState(20);
  const [interest, setInterest] = useState(settings.mortgageRate || 6.5);
  const [years, setYears] = useState(30);
  const [taxPct, setTaxPct] = useState(1.1);
  const [insurance, setInsurance] = useState(Math.round(120 * rate));
  const [touched, setTouched] = useState(false);

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
  const money = (v) => formatPrice(Math.round(toUsd(v)));
  const max = Math.round(3000000 * rate);

  const slider = (label, value, setter, min, maxV, step, fmt, onTouch) => (
    <div className="field">
      <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>{label}</span><b style={{ color: 'var(--ink)' }}>{fmt(value)}</b></label>
      <input className="range" type="range" min={min} max={maxV} step={step} value={value} onChange={(e) => { setter(Number(e.target.value)); onTouch?.(); }} />
    </div>
  );

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
            {slider('Home price', price, setPrice, 0, max, Math.max(1, Math.round(5000 * rate)), money)}
            {slider('Down payment', downPct, setDownPct, 0, 60, 1, (v) => `${v}% (${money(price * v / 100)})`)}
            {slider('Interest rate', interest, setInterest, 1, 15, 0.01, (v) => `${v.toFixed(2)}%`, () => setTouched(true))}
            {slider('Property tax', taxPct, setTaxPct, 0, 3, 0.05, (v) => `${v.toFixed(2)}%`)}
            {slider('Insurance / month', insurance, setInsurance, 0, Math.round(600 * rate), Math.max(1, Math.round(10 * rate)), money)}
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
          </motion.div>
        </div>
      </section>
    </>
  );
}
