import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import Icon from '../../components/ui/Icon';
import { ACTIVITY_TYPES, dayLabel, describe, timeOf } from './activity';

const FILTERS = [
  ['all', 'Everything'],
  ['view', 'Viewed'],
  ['search', 'Searches'],
  ['save', 'Saved'],
  ['inquiry', 'Inquiries'],
  ['calc', 'Calculations'],
];

export default function History() {
  const { account, properties, clearHistory } = useStore();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  if (!account) return <p className="muted">Loading…</p>;

  const needle = query.trim().toLowerCase();
  const rows = account.activity
    .map((a) => ({ ...a, ...describe(a, properties) }))
    .filter((a) => (filter === 'all' || a.type === filter || (filter === 'save' && a.type === 'unsave')) && (!needle || a.text.toLowerCase().includes(needle)));
  const count = (k) => account.activity.filter((a) => a.type === k || (k === 'save' && a.type === 'unsave')).length;

  // Group consecutive entries by day for the timeline.
  const groups = rows.reduce((g, a) => {
    const label = dayLabel(a.at);
    if (g.at(-1)?.label !== label) g.push({ label, items: [] });
    g.at(-1).items.push(a);
    return g;
  }, []);

  const clear = () => { if (confirm('Clear your whole activity history? Saved homes, inquiries and calculations are kept.')) clearHistory(); };

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/account">My account</Link><span aria-hidden="true">/</span><span>History</span></nav>
          <h2 style={{ margin: 0 }}>History <span className="count-pill">{account.activity.length}</span></h2>
        </div>
        <div className="chip-row">
          <label className="search-field">
            <Icon name="search" />
            <input type="search" placeholder="Search your history" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search history" />
          </label>
          {account.activity.length > 0 && <button type="button" className="btn btn-ghost btn-sm iq-delete" onClick={clear}><Icon name="trash" />Clear</button>}
        </div>
      </div>

      <div className="seg form-tabs iq-tabs">
        {FILTERS.map(([k, l]) => (
          <button type="button" key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
            {l}<span className="count">{k === 'all' ? account.activity.length : count(k)}</span>
          </button>
        ))}
      </div>

      <div className="card acc-fill">
        {groups.length ? groups.map((g) => (
          <section key={g.label} className="tl-day">
            <h4>{g.label}</h4>
            <ul className="tl-list">
              {g.items.map((a) => {
                const t = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.view;
                return (
                  <li key={a.id} className="tl-item">
                    <span className={`tl-icon a-${t.tone}`}><Icon name={t.icon} /></span>
                    <div className="tl-body">
                      {a.to ? <Link to={a.to}>{a.text}</Link> : a.text}
                      <small>{timeOf(a.at)} · {t.label}</small>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )) : (
          <div className="empty">
            <h3>{account.activity.length ? 'Nothing matches' : 'No history yet'}</h3>
            <p>Homes you view, searches you make, homes you save, inquiries you send and calculations you save are all recorded here.</p>
          </div>
        )}
      </div>
    </>
  );
}
