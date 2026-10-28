import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { formatCompact, STATUSES } from '../../utils/format';
import TiltCard from '../../components/ui/TiltCard';

// Sections fade up out of a blur one after another, like the reference dashboard.
const stagger = { show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const rise = {
  hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }, transitionEnd: { filter: 'none' } },
};

// Numbers count up from zero; non-numeric values (e.g. "$4.2M") are shown as-is.
function CountUp({ value, delay = 0, format = (n) => Math.round(n).toLocaleString() }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (typeof value !== 'number') return undefined;
    const controls = animate(mv, value, { duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, delay, mv]);
  return typeof value === 'number' ? <motion.span>{text}</motion.span> : <span>{value}</span>;
}

const STAT_ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9v11h13V9" /></>,
  sale: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  rent: <><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l2 2" /></>,
  lease: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  agent: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.5 2.8 3.5 5.7" /></>,
  rate: <><path d="M3 17 9 11l4 4 8-8" /><path d="M15 7h6v6" /></>,
};
// Shorter names used when the stats shrink into one slim row.
const SHORT_LABEL = { 'Total listings': 'Total', 'New inquiries': 'Inquiries', 'Registered users': 'Users', '30-yr mortgage': 'Mortgage' };

const StatIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{STAT_ICONS[name]}</svg>
);

// Plain-English summary under the expanded chart: totals per type and what stands out.
function AreaInsights({ areas, total }) {
  const sum = (k) => areas.reduce((n, a) => n + a[k], 0);
  const types = [['sale', 'For sale', sum('sale')], ['rent', 'For rent', sum('rent')], ['lease', 'For lease', sum('lease')]];
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const top = areas[0]?.total || 0;
  const leaders = areas.filter((a) => a.total === top).map((a) => a.city.split(',')[0]);
  const singles = areas.filter((a) => a.total === 1).length;
  const [, mainLabel, mainCount] = [...types].sort((x, y) => y[2] - x[2])[0];
  const list = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]);

  return (
    <motion.div
      className="area-insights"
      initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ai-totals">
        {types.map(([k, l, n]) => (
          <div key={k} className="ai-total">
            <span><i className={`lg-${k}`} />{l}</span>
            <b>{n}</b>
            <small>{pct(n)}% of all listings</small>
          </div>
        ))}
      </div>
      <div className="ai-mix" aria-label="Overall mix">
        {types.filter(([, , n]) => n).map(([k, , n]) => <i key={k} className={`seg-${k}`} style={{ flexGrow: n }} />)}
      </div>
      <ul className="ai-notes">
        <li><b>{total} listings</b> across <b>{areas.length} areas</b>.</li>
        {top > 0 && <li><b>{list(leaders)}</b> {leaders.length > 1 ? 'lead' : 'leads'} with <b>{top}</b> listing{top > 1 ? 's' : ''}{leaders.length > 1 ? ' each' : ''}.</li>}
        <li>Most homes are <b>{mainLabel.toLowerCase()}</b>: {mainCount} of {total} ({pct(mainCount)}%).</li>
        {singles > 0 && <li><b>{singles}</b> {singles > 1 ? 'areas have' : 'area has'} just one listing, a chance to add more stock there.</li>}
        <li className="muted">How to read it: each bar is one area. The coloured pills show how many homes are for sale, rent or lease, and the number on the right is that area's total.</li>
      </ul>
    </motion.div>
  );
}

export default function Dashboard() {
  const { properties, inquiries, users, agents, session, mortgage, online } = useStore();
  const count = (s) => properties.filter((p) => p.status === s).length;
  const forSale = properties.filter((p) => p.status === 'sale');
  const value = forSale.reduce((s, p) => s + Number(p.price || 0), 0);
  const saleShare = properties.length ? forSale.length / properties.length : 0;
  // Per-area breakdown, busiest first (top 8).
  const byCity = Object.values(properties.reduce((m, p) => {
    const row = m[p.city] || (m[p.city] = { city: p.city, sale: 0, rent: 0, lease: 0, total: 0 });
    if (row[p.status] !== undefined) row[p.status] += 1;
    row.total += 1;
    return m;
  }, {})).sort((x, y) => y.total - x.total || x.city.localeCompare(y.city));
  const maxCity = Math.max(1, ...byCity.map((r) => r.total));
  const [expanded, setExpanded] = useState(false);
  const shownAreas = expanded ? byCity : byCity.slice(0, 5);

  const newInquiries = inquiries.filter((q) => q.status === 'new').length;
  // [label, value, caption, icon, accent]
  const stats = [
    ['Total listings', properties.length, 'All statuses', 'home', 'blue'],
    ...Object.entries(STATUSES).map(([k, st]) => [st.label, count(k), `${properties.length ? Math.round((count(k) / properties.length) * 100) : 0}% of listings`, k, { sale: 'indigo', rent: 'sky', lease: 'violet' }[k]]),
    ['New inquiries', newInquiries, newInquiries ? 'Awaiting reply' : 'All caught up', 'mail', 'amber'],
    ['Agents', agents.length, 'On the team', 'agent', 'teal'],
    ['Registered users', users.length, 'Site accounts', 'users', 'pink'],
    ['30-yr mortgage', mortgage ? `${mortgage.rate30.toFixed(2)}%` : '—', 'US weekly average', 'rate', 'green'],
  ];

  return (
    <motion.div className={`dash ${expanded ? 'compact' : ''}`} variants={stagger} initial="hidden" animate="show">
      <motion.div className="admin-top" variants={rise}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p className="muted" style={{ margin: 0 }}>
            {online ? <><span className="live-dot" />Live: changes appear on every open page instantly.</> : 'Reconnecting to the server…'} Welcome back, {session.name}.
          </p>
        </div>
        <Link to="/admin/listings/new" className="btn btn-primary">+ Add listing</Link>
      </motion.div>

      <div className="dash-hero-row">
        <motion.div className="dash-hero" variants={rise}>
          {/* Colour blooms out of the top-left corner like a soft blush, then keeps gently breathing */}
          <motion.div
            className="dash-hero-fill"
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="dash-hero-content"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="dash-hero-pill">Sale portfolio</span>
            <div className="dash-hero-value">
              <CountUp value={value} delay={0.9} format={(n) => formatCompact(n)} />
            </div>
            <div className="dash-hero-bar">
              <motion.i initial={{ width: 0 }} animate={{ width: `${saleShare * 100}%` }} transition={{ duration: 1.2, delay: 1.1, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <div className="dash-hero-foot">
              <span>{forSale.length} of {properties.length} listings for sale</span>
              <Link to="/admin/listings" className="dash-hero-btn">Manage listings</Link>
            </div>
          </motion.div>
        </motion.div>
        <div className="dash-stats">
          {stats.map(([l, v, caption, icon, accent]) => (
            <motion.div key={l} variants={rise} layout="position" transition={{ layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}>
              <TiltCard className={`card stat dash-stat a-${accent}`} intensity={6}>
                <div className="ds-top"><span className="ds-label"><span className="ds-full">{l}</span><span className="ds-short">{SHORT_LABEL[l] || l}</span></span><span className="ds-icon"><StatIcon name={icon} /></span></div>
                <strong className="ds-value"><CountUp value={v} /></strong>
                <span className="ds-caption">{caption}</span>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div className={`dash-panels ${expanded ? 'expanded' : ''}`}>
        <motion.div className="card dash-panel area-panel" variants={rise}>
          <div className="chart-head">
            <div><h3>Listings by area</h3><p className="muted">How many homes each area has, and how they're offered</p></div>
            <div className="chart-legend">
              <span><i className="lg-sale" />For sale</span><span><i className="lg-rent" />For rent</span><span><i className="lg-lease" />For lease</span>
            </div>
          </div>
          {byCity.length ? (
            <div className="area-list">
              {shownAreas.map(({ city, sale, rent, lease, total }, i) => (
                <div key={city} className="area-row">
                  <span className="area-name" title={city}>{city.split(',')[0]}</span>
                  <div className="area-track" title={`${city}: ${sale} for sale, ${rent} for rent, ${lease} for lease`}>
                    <motion.div
                      className="area-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / maxCity) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.4 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {[['sale', sale], ['rent', rent], ['lease', lease]].filter(([, n]) => n > 0).map(([k, n], j) => (
                        <motion.i
                          key={k}
                          className={`seg-${k}`}
                          style={{ flexGrow: n }}
                          initial={{ opacity: 0, x: -24, scale: 0.6 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.55 + i * 0.07 + j * 0.12 }}
                        >
                          {n}
                        </motion.i>
                      ))}
                    </motion.div>
                  </div>
                  <b className="area-total">{total}</b>
                </div>
              ))}
            </div>
          ) : <p className="muted">No listings yet.</p>}

          <AnimatePresence initial={false}>
            {expanded && <AreaInsights key="insights" areas={byCity} total={properties.length} />}
          </AnimatePresence>

          {(byCity.length > 5 || expanded) && (
            <button type="button" className="area-toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
              {expanded ? 'Show less' : `View full details · all ${byCity.length} areas`}
              <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: expanded ? 180 : 0 }}><path d="m6 9 6 6 6-6" /></motion.svg>
            </button>
          )}
        </motion.div>
        <motion.div className="card dash-panel inquiry-panel" variants={rise}>
          <h3>Latest inquiries</h3>
          {inquiries.length ? inquiries.slice(0, 5).map((q) => (
            <div key={q.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <b>{q.name}</b> <span className="badge" style={{ marginLeft: 6 }}>{q.type}</span>
              <div className="muted" style={{ fontSize: '.88rem' }}>{q.subject || q.email}</div>
            </div>
          )) : <p className="muted">No inquiries yet. Submissions from tour, sell and contact forms appear here instantly.</p>}
          <Link to="/admin/inquiries" style={{ color: 'var(--brand)', fontWeight: 600, display: 'inline-block', marginTop: 12 }}>View all →</Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
