import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatCompact, STATUSES } from '../../utils/format';
import TiltCard from '../../components/ui/TiltCard';

export default function Dashboard() {
  const { properties, inquiries, users, agents, session, mortgage, online } = useStore();
  const count = (s) => properties.filter((p) => p.status === s).length;
  const value = properties.filter((p) => p.status === 'sale').reduce((s, p) => s + Number(p.price || 0), 0);
  const byCity = Object.entries(properties.reduce((m, p) => ({ ...m, [p.city]: (m[p.city] || 0) + 1 }), {})).slice(0, 8);
  const maxCity = Math.max(1, ...byCity.map(([, n]) => n));

  const stats = [
    ['Total listings', properties.length],
    ...Object.entries(STATUSES).map(([k, s]) => [s.label, count(k)]),
    ['Sale portfolio value', formatCompact(value)],
    ['New inquiries', inquiries.filter((q) => q.status === 'new').length],
    ['Agents', agents.length],
    ['Registered users', users.length],
    ['30-yr mortgage (US)', mortgage ? `${mortgage.rate30.toFixed(2)}%` : '—'],
  ];

  return (
    <div className="dash">
      <div className="admin-top">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p className="muted" style={{ margin: 0 }}>
            {online ? <><span className="live-dot" />Live: changes appear on every open page instantly.</> : 'Reconnecting to the server…'} Welcome back, {session.name}.
          </p>
        </div>
        <Link to="/admin/listings/new" className="btn btn-primary">+ Add listing</Link>
      </div>
      <div className="dash-stats">
        {stats.map(([l, v]) => (
          <TiltCard key={l} className="card stat dash-stat" intensity={6}><span className="muted">{l}</span><b>{v}</b></TiltCard>
        ))}
      </div>
      <div className="dash-panels">
        <div className="card dash-panel">
          <h3>Listings by city</h3>
          {byCity.length ? (
            <div className="chart" style={{ marginBottom: 28 }}>
              {byCity.map(([c, n]) => <div key={c} style={{ height: `${(n / maxCity) * 100}%` }} title={`${c}: ${n}`}><span>{c.slice(0, 3)}</span></div>)}
            </div>
          ) : <p className="muted">No listings yet.</p>}
        </div>
        <div className="card dash-panel">
          <h3>Latest inquiries</h3>
          {inquiries.length ? inquiries.slice(0, 5).map((q) => (
            <div key={q.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <b>{q.name}</b> <span className="badge" style={{ marginLeft: 6 }}>{q.type}</span>
              <div className="muted" style={{ fontSize: '.88rem' }}>{q.subject || q.email}</div>
            </div>
          )) : <p className="muted">No inquiries yet. Submissions from tour, sell and contact forms appear here instantly.</p>}
          <Link to="/admin/inquiries" style={{ color: 'var(--brand)', fontWeight: 600, display: 'inline-block', marginTop: 12 }}>View all →</Link>
        </div>
      </div>
    </div>
  );
}
