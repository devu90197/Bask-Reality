import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { currencySymbol, formatPrice, getCurrency, monthlyPayment } from '../../utils/format';
import Icon from '../../components/ui/Icon';

// Inline editable number input with auto-commit on blur or Enter
function InlineNumber({ value, format, onChange, min, max, decimals = false, label }) {
  const [draft, setDraft] = useState(null);
  const text = draft ?? format(value);
  const commit = (raw) => {
    const n = Number.parseFloat(raw.replace(/[^\d.]/g, ''));
    if (Number.isNaN(n)) return;
    const v = Math.min(max, Math.max(min, decimals ? n : Math.round(n)));
    onChange(v);
  };
  return (
    <span className="inline-grow" data-value={text}>
      <input
        className="inline-amount"
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        aria-label={label}
        value={text}
        size={1}
        onFocus={(e) => { setDraft(format(value)); e.target.select(); }}
        onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
    </span>
  );
}

export default function Calculations() {
  const { account, deleteCalc, saveCalc, properties, mortgage, settings } = useStore();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const rate = getCurrency().rate;
  const toBase = (v) => v / rate;
  const sym = currencySymbol();
  const money = (v) => formatPrice(Math.round(toBase(v)));
  const moneyText = (v) => `${sym}${Math.round(v).toLocaleString(getCurrency().locale)}`;
  const pctText = (v) => `${Number(v).toFixed(2)}%`;

  // Older or partial records still display: missing numbers count as zero.
  const rawCalcs = account?.calcs || [];
  const calcs = useMemo(() => rawCalcs.map((x) => ({
    downPct: 0,
    interest: 0,
    years: 0,
    taxPct: 0,
    insurance: 0,
    tax: 0,
    pi: x.monthly || 0,
    ...x,
  })), [rawCalcs]);

  // Selected calculation for detail view
  const c = calcs.find((x) => x.id === selectedId) || calcs[0] || null;
  const selectedProperty = c?.propertyId && properties.find((p) => p.id === c.propertyId);
  const detailLoan = c ? c.price * (1 - c.downPct / 100) : 0;
  const detailParts = c ? [
    ['Principal & interest', c.pi, 'var(--brand)'],
    ['Property tax', c.tax, '#60a5fa'],
    ['Insurance', c.insurance, 'var(--accent)'],
  ] : [];

  // Filtered list
  const filteredCalcs = useMemo(() => {
    if (!searchQuery.trim()) return calcs;
    const q = searchQuery.toLowerCase();
    return calcs.filter((item) => {
      const p = item.propertyId && properties.find((prop) => prop.id === item.propertyId);
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (p?.title && p.title.toLowerCase().includes(q)) ||
        formatPrice(item.price).toLowerCase().includes(q)
      );
    });
  }, [calcs, searchQuery, properties]);

  // Summary statistics
  const avgMonthly = calcs.length ? Math.round(calcs.reduce((acc, curr) => acc + (curr.monthly || 0), 0) / calcs.length) : 0;
  const lowestRate = calcs.length ? Math.min(...calcs.map((curr) => Number(curr.interest) || 999)) : 0;

  // Active panel tab: 'calculator' or 'detail'
  const [panelTab, setPanelTab] = useState(calcs.length === 0 ? 'calculator' : 'detail');

  // Interactive In-Page Calculator state
  const [editingId, setEditingId] = useState(null);
  const [calcPropertyId, setCalcPropertyId] = useState('');
  const [price, setPrice] = useState(Math.round(10000000 * rate));
  const [downPct, setDownPct] = useState(20);
  const [interest, setInterest] = useState(settings?.mortgageRate || 6.5);
  const [years, setYears] = useState(30);
  const [taxPct, setTaxPct] = useState(1.1);
  const [insurance, setInsurance] = useState(Math.round(10000 * rate));
  const [calcName, setCalcName] = useState('');
  const [calcTouched, setCalcTouched] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveState, setAutoSaveState] = useState('idle'); // idle | saving | saved
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  // Start with live rate
  useEffect(() => {
    if (calcTouched) return;
    const live = settings?.mortgageRate || (years === 15 ? mortgage?.rate15 : mortgage?.rate30);
    if (live) setInterest(live);
  }, [mortgage, settings?.mortgageRate, years, calcTouched]);

  // When property selection changes in the calculator dropdown
  const onSelectProperty = (propId) => {
    setCalcPropertyId(propId);
    setCalcTouched(true);
    if (!propId) return;
    const p = properties.find((x) => x.id === propId);
    if (p) {
      setPrice(Math.round(p.price * rate));
      if (!calcName.trim() || calcName.startsWith('Home at') || calcName.startsWith('Estimate for')) {
        setCalcName(p.title);
      }
    }
  };

  // Calculations for live in-page calculator
  const liveLoan = price * (1 - downPct / 100);
  const livePi = monthlyPayment(liveLoan, interest, years);
  const liveTax = (price * taxPct) / 100 / 12;
  const liveTotal = livePi + liveTax + Number(insurance);
  const liveParts = [
    { label: 'Principal & interest', v: livePi, c: 'var(--brand)' },
    { label: 'Property tax', v: liveTax, c: '#60a5fa' },
    { label: 'Insurance', v: Number(insurance), c: 'var(--accent)' },
  ];
  const totalLoanRepayment = liveTotal * years * 12;
  const totalLoanInterest = Math.max(0, totalLoanRepayment - liveLoan);

  const linkedProperty = calcPropertyId && properties.find((p) => p.id === calcPropertyId);
  const defaultDisplayName = linkedProperty?.title || `Home at ${money(price)}`;

  // Debounced auto-save effect for in-page calculator
  const autoSaveTimer = useRef(null);
  useEffect(() => {
    if (!autoSave || !calcTouched) return;
    setAutoSaveState('saving');
    clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = {
          id: editingId || undefined,
          name: calcName.trim() || defaultDisplayName,
          propertyId: calcPropertyId || undefined,
          price: Math.round(toBase(price)),
          downPct,
          interest,
          years,
          taxPct,
          insurance: Math.round(toBase(insurance)),
          pi: Math.round(toBase(livePi)),
          tax: Math.round(toBase(liveTax)),
          monthly: Math.round(toBase(liveTotal)),
        };
        const res = await saveCalc(payload);
        if (!editingId && res?.id) {
          setEditingId(res.id);
        }
        setAutoSaveState('saved');
      } catch {
        setAutoSaveState('idle');
      }
    }, 1200);

    return () => clearTimeout(autoSaveTimer.current);
  }, [
    autoSave,
    calcTouched,
    price,
    downPct,
    interest,
    years,
    taxPct,
    insurance,
    calcPropertyId,
    calcName,
    editingId,
    defaultDisplayName,
    saveCalc,
    livePi,
    liveTax,
    liveTotal,
    rate,
  ]);

  // Load an existing calculation into the interactive calculator
  const loadIntoCalculator = (item) => {
    setEditingId(item.id);
    setSelectedId(item.id);
    setPrice(Math.round(item.price * rate));
    setDownPct(item.downPct ?? 20);
    setInterest(item.interest ?? 6.5);
    setYears(item.years ?? 30);
    setTaxPct(item.taxPct ?? 1.1);
    setInsurance(Math.round((item.insurance ?? 0) * rate));
    setCalcName(item.name || '');
    setCalcPropertyId(item.propertyId || '');
    setCalcTouched(false);
    setAutoSaveState('idle');
    setSaveState('idle');
    setPanelTab('calculator');
  };

  // Start fresh calculation
  const startNewCalculation = () => {
    setEditingId(null);
    setCalcPropertyId('');
    setPrice(Math.round(10000000 * rate));
    setDownPct(20);
    setInterest(settings?.mortgageRate || mortgage?.rate30 || 6.5);
    setYears(30);
    setTaxPct(1.1);
    setInsurance(Math.round(10000 * rate));
    setCalcName('');
    setCalcTouched(false);
    setAutoSaveState('idle');
    setSaveState('idle');
    setPanelTab('calculator');
  };

  // Manual save handler
  const handleSave = async (asNew = false) => {
    setSaveState('saving');
    try {
      const payload = {
        id: asNew ? undefined : (editingId || undefined),
        name: calcName.trim() || defaultDisplayName,
        propertyId: calcPropertyId || undefined,
        price: Math.round(toBase(price)),
        downPct,
        interest,
        years,
        taxPct,
        insurance: Math.round(toBase(insurance)),
        pi: Math.round(toBase(livePi)),
        tax: Math.round(toBase(liveTax)),
        monthly: Math.round(toBase(liveTotal)),
      };
      const res = await saveCalc(payload);
      if (res?.id) {
        setEditingId(res.id);
        setSelectedId(res.id);
      }
      setSaveState('saved');
      setAutoSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const remove = (x) => {
    if (confirm(`Delete calculation “${x.name}”?`)) {
      deleteCalc(x.id);
      if (selectedId === x.id) setSelectedId(null);
      if (editingId === x.id) setEditingId(null);
    }
  };

  if (!account) return <p className="muted">Loading your calculations…</p>;

  const maxPrice = Math.round(250000000 * rate);
  const maxInsurance = Math.round(50000 * rate);

  const calcField = ({ label, value, setter, min = 0, max: maxV, step, format, decimals, extra }) => {
    const set = (v) => {
      setter(v);
      setCalcTouched(true);
      setSaveState('idle');
    };
    return (
      <div className="calc-form-field">
        <label>
          <span>{label}</span>
          <span className="inline-value">
            <InlineNumber value={value} format={format} onChange={set} min={min} max={maxV} decimals={decimals} label={label} />
            {extra && <small style={{ fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>{extra}</small>}
          </span>
        </label>
        <input
          className="range"
          type="range"
          min={min}
          max={maxV}
          step={step}
          value={Math.min(value, maxV)}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={`${label} slider`}
        />
      </div>
    );
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/account">My account</Link>
            <span aria-hidden="true">/</span>
            <span>Calculations</span>
          </nav>
          <h2 style={{ margin: 0 }}>
            Saved calculations <span className="count-pill">{calcs.length}</span>
          </h2>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={startNewCalculation}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={16} />
          <span>New calculation</span>
        </button>
      </div>

      <div className="lf-layout ag-layout iq-layout calc-iq-layout">
        {/* Left Side: Calculation History Table & Stats */}
        <div className="table-wrap">
          {calcs.length > 0 && (
            <>
              <div className="calc-stats-strip">
                <div className="calc-stat-pill">
                  <span>Saved Records</span>
                  <b>{calcs.length}</b>
                </div>
                <div className="calc-stat-pill">
                  <span>Avg Monthly EMI</span>
                  <b>{formatPrice(avgMonthly)}</b>
                </div>
                <div className="calc-stat-pill">
                  <span>Lowest Rate</span>
                  <b>{lowestRate > 0 ? `${lowestRate.toFixed(2)}%` : '—'}</b>
                </div>
              </div>

              <div className="calc-filter-row">
                <div className="calc-search-box">
                  <Icon name="search" />
                  <input
                    type="text"
                    placeholder="Search calculations by name or price…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search calculations"
                  />
                </div>
              </div>
            </>
          )}

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Home price</th>
                <th>Rate · term</th>
                <th>Monthly</th>
                <th aria-label="Actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalcs.map((x) => {
                const isSelected = (panelTab === 'detail' && c?.id === x.id) || (panelTab === 'calculator' && editingId === x.id);
                return (
                  <tr
                    key={x.id}
                    className={`iq-row ${isSelected ? 'row-editing' : ''}`}
                    onClick={() => {
                      setSelectedId(x.id);
                      setPanelTab('detail');
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedId(x.id);
                        setPanelTab('detail');
                      }
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <b>{x.name}</b>
                        {editingId === x.id && panelTab === 'calculator' && (
                          <span className="calc-editing-badge">Editing</span>
                        )}
                      </div>
                      <div className="muted ag-sub">
                        {new Date(x.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="ag-num">{formatPrice(x.price)}</td>
                    <td className="ag-num">
                      {Number(x.interest).toFixed(2)}% · {x.years} yr
                    </td>
                    <td className="ag-num">
                      <b style={{ color: 'var(--brand)' }}>{formatPrice(x.monthly)}</b>
                    </td>
                    <td>
                      <div className="row-actions icon-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Load into calculator & recalculate here"
                          aria-label={`Edit ${x.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            loadIntoCalculator(x);
                          }}
                        >
                          <Icon name="calc" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Delete"
                          aria-label={`Delete ${x.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(x);
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!calcs.length && (
            <div className="empty" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ display: 'inline-grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand)', marginBottom: 14 }}>
                <Icon name="calc" size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px' }}>No saved calculations yet</h3>
              <p style={{ maxWidth: 460, margin: '0 auto 16px', fontSize: '.9rem', color: 'var(--muted)' }}>
                Calculate monthly payments using the interactive calculator on the right. Your estimates and calculations will automatically be recorded and stored right here in your account!
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={startNewCalculation}
              >
                Use calculator now
              </button>
            </div>
          )}

          {calcs.length > 0 && !filteredCalcs.length && (
            <div className="empty" style={{ padding: '24px' }}>
              <p className="muted">No calculations match “{searchQuery}”.</p>
            </div>
          )}
        </div>

        {/* Right Side: Interactive In-Page Calculator & Detail Panel */}
        <div className="card iq-detail" style={{ minHeight: 520 }}>
          {/* Panel Navigation Tabs */}
          <nav className="calc-panel-nav" aria-label="Calculator mode">
            <button
              type="button"
              className={`calc-tab-btn ${panelTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setPanelTab('calculator')}
            >
              <Icon name="calc" size={16} />
              <span>{editingId ? 'Edit Calculator' : 'Calculator'}</span>
            </button>
            <button
              type="button"
              className={`calc-tab-btn ${panelTab === 'detail' ? 'active' : ''}`}
              onClick={() => setPanelTab('detail')}
              disabled={!c}
            >
              <Icon name="open" size={16} />
              <span>Saved Details</span>
            </button>
          </nav>

          <AnimatePresence mode="wait">
            {panelTab === 'calculator' ? (
              <motion.div
                key="calculator-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {/* Calculator Header */}
                <div className="iq-detail-head" style={{ paddingBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <b>{editingId ? 'Recalculate & Edit' : 'Mortgage Calculator'}</b>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: '.78rem' }}
                        onClick={startNewCalculation}
                        title="Reset inputs to defaults"
                      >
                        <Icon name="refresh" size={13} /> Reset
                      </button>
                    </div>
                    <div className="muted ag-sub">
                      Calculate monthly payment & auto-store to history
                    </div>
                  </div>
                </div>

                {/* Optional Property Selector */}
                <div style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Link with property (optional)
                  </label>
                  <select
                    className="calc-prop-select"
                    value={calcPropertyId}
                    onChange={(e) => onSelectProperty(e.target.value)}
                    aria-label="Select property"
                  >
                    <option value="">— Custom Calculation (No property link) —</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} · {formatPrice(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interactive Slider Inputs */}
                {calcField({
                  label: 'Home price',
                  value: price,
                  setter: setPrice,
                  min: Math.round(500000 * rate),
                  max: maxPrice,
                  step: Math.max(1, Math.round(50000 * rate)),
                  format: moneyText,
                })}

                {calcField({
                  label: 'Down payment',
                  value: downPct,
                  setter: setDownPct,
                  min: 0,
                  max: 60,
                  step: 1,
                  format: (v) => `${v}%`,
                  extra: `(${money(price * downPct / 100)})`,
                })}

                {/* Term Chips */}
                <div className="calc-form-field">
                  <label>
                    <span>Loan term</span>
                    <span style={{ fontWeight: 700 }}>{years} years</span>
                  </label>
                  <div className="chip-row" style={{ marginTop: 4 }}>
                    {[15, 20, 25, 30].map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={`chip ${years === y ? 'active' : ''}`}
                        onClick={() => {
                          setYears(y);
                          setCalcTouched(true);
                          setSaveState('idle');
                        }}
                      >
                        {y} yrs
                      </button>
                    ))}
                  </div>
                </div>

                {calcField({
                  label: 'Interest rate',
                  value: interest,
                  setter: setInterest,
                  min: 1,
                  max: 15,
                  step: 0.01,
                  format: pctText,
                  decimals: true,
                  extra: settings?.mortgageRate ? `(Live: ${settings.mortgageRate}%)` : (mortgage ? `(Avg: ${mortgage.rate30.toFixed(2)}%)` : ''),
                })}

                {calcField({
                  label: 'Property tax / year',
                  value: taxPct,
                  setter: setTaxPct,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  format: pctText,
                  decimals: true,
                  extra: `(${money(liveTax)}/mo)`,
                })}

                {calcField({
                  label: 'Insurance / month',
                  value: insurance,
                  setter: setInsurance,
                  min: 0,
                  max: maxInsurance,
                  step: Math.max(1, Math.round(100 * rate)),
                  format: moneyText,
                })}

                {/* Real-time Estimate Card */}
                <div className="calc-live-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--brand)' }}>
                      Estimated Monthly Payment
                    </span>
                    <span className={`auto-save-pill ${autoSaveState === 'saving' ? 'saving' : ''}`}>
                      <Icon name={autoSaveState === 'saved' ? 'check' : autoSaveState === 'saving' ? 'refresh' : 'zap'} size={13} />
                      {autoSaveState === 'saving' ? 'Auto-saving…' : autoSaveState === 'saved' ? 'Auto-saved to history' : 'Auto-store ready'}
                    </span>
                  </div>

                  <div className="calc-big" style={{ margin: '8px 0 6px' }}>
                    {money(liveTotal)}
                    <small>/mo</small>
                  </div>

                  <div className="bar" style={{ margin: '8px 0 10px', height: 8 }}>
                    {liveParts.map((p) => (
                      <div
                        key={p.label}
                        style={{ width: `${(p.v / liveTotal) * 100}%`, background: p.c, transition: 'width 0.3s ease' }}
                      />
                    ))}
                  </div>

                  <dl className="iq-dl calc-dl" style={{ fontSize: '.84rem' }}>
                    {liveParts.map((p) => (
                      <Fragment key={p.label}>
                        <dt>
                          <i style={{ background: p.c }} />
                          {p.label}
                        </dt>
                        <dd>{money(p.v)}</dd>
                      </Fragment>
                    ))}
                    <dt style={{ paddingTop: 6, borderTop: '1px dashed var(--line)' }}>Loan principal</dt>
                    <dd style={{ paddingTop: 6, borderTop: '1px dashed var(--line)' }}>{money(liveLoan)}</dd>
                    <dt>Total interest over {years}y</dt>
                    <dd>{money(totalLoanInterest)}</dd>
                  </dl>
                </div>

                {/* Auto-save & Calculation Name Controls */}
                <div className="calc-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                    />
                    <span>Auto-store calculations in account history</span>
                  </label>
                  <Icon name="history" size={16} />
                </div>

                <div style={{ marginTop: 4 }}>
                  <label style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Calculation name
                  </label>
                  <input
                    className="input"
                    placeholder={defaultDisplayName}
                    value={calcName}
                    onChange={(e) => {
                      setCalcName(e.target.value);
                      setCalcTouched(true);
                      setSaveState('idle');
                    }}
                    style={{ height: 38, fontSize: '.86rem', width: '100%', borderRadius: 10 }}
                    aria-label="Calculation name"
                  />
                </div>

                {/* Save & Action Buttons */}
                <div className="calc-btn-group">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSave(false)}
                    disabled={saveState === 'saving'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name={saveState === 'saved' ? 'check' : 'save'} size={15} />
                    <span>
                      {saveState === 'saving'
                        ? 'Saving…'
                        : saveState === 'saved'
                        ? 'Saved in history'
                        : editingId
                        ? 'Update in history'
                        : 'Save to history'}
                    </span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSave(true)}
                      title="Save as a new distinct calculation in your history"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <Icon name="plus" size={14} />
                      <span>Save as new copy</span>
                    </button>
                  )}

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm danger"
                      onClick={() => {
                        const target = calcs.find((item) => item.id === editingId);
                        if (target) remove(target);
                      }}
                      style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Icon name="trash" size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {saveState === 'saved' && (
                  <p className="calc-save-note" style={{ color: '#16a34a', fontWeight: 600 }}>
                    ✓ Calculation saved in your account history.
                  </p>
                )}
                {saveState === 'error' && (
                  <p className="calc-save-note err">Could not save calculation. Please try again.</p>
                )}
              </motion.div>
            ) : c ? (
              /* Saved Details Tab */
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="iq-detail-head">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b>{c.name}</b>
                    </div>
                    <div className="muted ag-sub">
                      Saved {new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      {c.updatedAt && (
                        <span> · Updated {new Date(c.updatedAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <section className="iq-block">
                  <h4>Monthly payment</h4>
                  <div className="calc-big">
                    {formatPrice(c.monthly)}
                    <small>/mo</small>
                  </div>
                  <div className="bar">
                    {detailParts.map(([l, v, col]) => (
                      <div
                        key={l}
                        style={{
                          width: `${(v / (c.monthly || 1)) * 100}%`,
                          background: col,
                        }}
                      />
                    ))}
                  </div>
                  <dl className="iq-dl calc-dl">
                    {detailParts.map(([l, v, col]) => (
                      <Fragment key={l}>
                        <dt>
                          <i style={{ background: col }} />
                          {l}
                        </dt>
                        <dd>{formatPrice(v)}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </section>

                <section className="iq-block">
                  <h4>Inputs</h4>
                  <dl className="iq-dl calc-dl">
                    <dt>Home price</dt>
                    <dd>{formatPrice(c.price)}</dd>
                    <dt>Down payment</dt>
                    <dd>
                      {c.downPct}% ({formatPrice((c.price * c.downPct) / 100)})
                    </dd>
                    <dt>Loan amount</dt>
                    <dd>{formatPrice(detailLoan)}</dd>
                    <dt>Interest rate</dt>
                    <dd>{Number(c.interest).toFixed(2)}%</dd>
                    <dt>Loan term</dt>
                    <dd>{c.years} years</dd>
                    <dt>Property tax</dt>
                    <dd>{Number(c.taxPct).toFixed(2)}% a year</dd>
                    {c.insurance > 0 && (
                      <>
                        <dt>Insurance</dt>
                        <dd>{formatPrice(c.insurance)}/mo</dd>
                      </>
                    )}
                  </dl>
                </section>

                {selectedProperty && (
                  <section className="iq-block">
                    <h4>For this home</h4>
                    <Link to={`/property/${selectedProperty.id}`} className="acc-row">
                      <span
                        className="acc-thumb"
                        style={
                          selectedProperty.images?.[0]
                            ? { backgroundImage: `url(${selectedProperty.images[0]})` }
                            : undefined
                        }
                      />
                      <div>
                        <b>{selectedProperty.title}</b>
                        <small className="muted">{selectedProperty.city}</small>
                      </div>
                      <Icon name="open" size={16} />
                    </Link>
                  </section>
                )}

                <div className="iq-foot" style={{ gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm iq-delete"
                    onClick={() => remove(c)}
                  >
                    <Icon name="trash" />
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => loadIntoCalculator(c)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name="calc" />
                    Recalculate / Edit here
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="card iq-detail iq-empty">
                <Icon name="calc" />
                <b>No calculation selected</b>
                <p className="muted">Use the calculator tab or select a calculation from your history.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setPanelTab('calculator')}
                  style={{ marginTop: 8 }}
                >
                  Open calculator
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
