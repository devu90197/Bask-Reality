import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import Icon from '../../components/ui/Icon';
import { ACTIVITY_TYPES, dayLabel, describe, timeOf } from '../account/activity';

const TABS = ['Activity', 'Saved', 'Inquiries', 'Calculations'];
const STATUS_LABEL = { new: 'New', contacted: 'Contacted', closed: 'Closed' };

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
const ago = (ts) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return mins < 1 ? 'Just now' : `${mins}m ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

// Everything one client has done, loaded on demand and refreshed live when their account changes.
function ClientDetail({ user, onRemove }) {
  const { getUserData, properties } = useStore();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('Activity');

  useEffect(() => {
    let alive = true;
    getUserData(user.id).then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [user, getUserData]);

  const savedHomes = data ? data.saved.map((id) => properties.find((p) => p.id === id)).filter(Boolean) : [];
  const counts = data ? { Activity: data.activity.length, Saved: savedHomes.length, Inquiries: data.inquiries.length, Calculations: data.calcs.length } : {};

  return (
    <div className="card iq-detail">
      <div className="iq-detail-head">
        <span className="ag-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{initials(user.name)}</span>
        <div><b>{user.name}</b><div className="muted ag-sub">{user.email}{user.phone ? ` · ${user.phone}` : ''}</div></div>
      </div>
      <div className="iq-actions">
        <a className="iq-action" href={`mailto:${user.email}`}><Icon name="inquiries" size={16} />Email</a>
        {user.phone && <a className="iq-action" href={`tel:${user.phone.replace(/[^\d+]/g, '')}`}><Icon name="profile" size={16} />Call</a>}
      </div>

      <div className="seg form-tabs iq-tabs user-tabs">
        {TABS.map((t) => (
          <button type="button" key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}<span className="count">{counts[t] ?? '…'}</span></button>
        ))}
      </div>

      {!data ? <p className="muted">Loading…</p> : (
        <div className="user-tab-body">
          {tab === 'Activity' && (data.activity.length ? (
            <ul className="tl-list">
              {data.activity.slice(0, 80).map((a) => {
                const t = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.view;
                const { text } = describe(a, properties);
                return (
                  <li key={a.id} className="tl-item">
                    <span className={`tl-icon a-${t.tone}`}><Icon name={t.icon} /></span>
                    <div className="tl-body">{text}<small>{dayLabel(a.at)} · {timeOf(a.at)}</small></div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="muted">No activity yet.</p>)}

          {tab === 'Saved' && (savedHomes.length ? savedHomes.map((p) => (
            <Link key={p.id} to={`/property/${p.id}`} className="acc-row">
              <span className="acc-thumb" style={p.images?.[0] ? { backgroundImage: `url(${p.images[0]})` } : undefined} />
              <div><b>{p.title}</b><small className="muted">{p.city}</small></div>
              <b className="acc-price">{formatPrice(p.price)}</b>
            </Link>
          )) : <p className="muted">No saved homes.</p>)}

          {tab === 'Inquiries' && (data.inquiries.length ? data.inquiries.map((q) => (
            <Link key={q.id} to="/admin/inquiries" className="acc-row">
              <div><b>{q.subject || q.address || 'General inquiry'}</b><small className="muted">{new Date(q.createdAt).toLocaleDateString()} · {q.type}</small></div>
              <span className={`status-pill s-${q.status}`}><i />{STATUS_LABEL[q.status] || q.status}</span>
            </Link>
          )) : <p className="muted">No inquiries.</p>)}

          {tab === 'Calculations' && (data.calcs.length ? data.calcs.map((c) => (
            <div key={c.id} className="acc-row">
              <div><b>{c.name}</b><small className="muted">{formatPrice(c.price)} · {c.downPct}% down · {Number(c.interest).toFixed(2)}% · {c.years} yr</small></div>
              <b className="acc-price">{formatPrice(c.monthly)}/mo</b>
            </div>
          )) : <p className="muted">No saved calculations.</p>)}
        </div>
      )}

      <div className="iq-foot">
        <button type="button" className="btn btn-ghost btn-sm iq-delete" onClick={onRemove}><Icon name="trash" />Remove account</button>
      </div>
    </div>
  );
}

export default function Users() {
  const { users, deleteUser } = useStore();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const needle = query.trim().toLowerCase();
  const shown = [...users]
    .sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))
    .filter((u) => !needle || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(needle)));
  const selected = users.find((u) => u.id === selectedId) || shown[0] || null;

  const remove = (u) => {
    if (!confirm(`Remove ${u.email}? Their saved homes, calculations and history are deleted too.`)) return;
    deleteUser(u.id);
    setSelectedId(null);
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/admin">Admin</Link><span aria-hidden="true">/</span><span>Users</span></nav>
          <h2 style={{ margin: 0 }}>Users <span className="count-pill">{users.length}</span></h2>
        </div>
        <label className="search-field">
          <Icon name="search" />
          <input type="search" placeholder="Search name, email, phone" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
        </label>
      </div>

      <div className="lf-layout ag-layout iq-layout">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Saved</th><th>Calculations</th><th>Last active</th><th>Joined</th></tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className={`iq-row ${selected?.id === u.id ? 'row-editing' : ''}`} onClick={() => setSelectedId(u.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(u.id); }}>
                  <td>
                    <div className="ag-cell">
                      <span className="ag-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials(u.name)}</span>
                      <div><b>{u.name}</b><div className="muted ag-sub">{u.email}</div></div>
                    </div>
                  </td>
                  <td><span className="listing-pill">{u.savedCount ?? 0}</span></td>
                  <td><span className="listing-pill">{u.calcCount ?? 0}</span></td>
                  <td className="muted ag-num iq-when">{u.lastActiveAt ? ago(u.lastActiveAt) : '—'}</td>
                  <td className="muted ag-num iq-when">{new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <div className="empty">{users.length ? 'No users match.' : 'No registered users yet. Clients who create an account appear here.'}</div>}
        </div>

        {selected
          ? <ClientDetail key={selected.id} user={selected} onRemove={() => remove(selected)} />
          : <div className="card iq-detail iq-empty"><Icon name="users" /><b>No client selected</b><p className="muted">Pick a client to see their saved homes, inquiries, calculations and history.</p></div>}
      </div>
    </>
  );
}
