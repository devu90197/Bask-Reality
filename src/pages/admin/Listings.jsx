import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { listingPrice, statusInfo, STATUSES } from '../../utils/format';
import SmartImage from '../../components/ui/SmartImage';

export default function Listings() {
  const { properties, deleteProperty, updateProperty } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const list = properties.filter((p) =>
    (status === 'all' || p.status === status) &&
    `${p.title} ${p.address} ${p.city}`.toLowerCase().includes(q.toLowerCase()));

  const remove = (p) => { if (confirm(`Delete "${p.address}"?`)) deleteProperty(p.id); };

  return (
    <>
      <div className="admin-top">
        <h2 style={{ margin: 0 }}>Listings ({list.length})</h2>
        <div className="chip-row">
                    <Link to="/admin/listings/new" className="btn btn-primary btn-sm">+ Add listing</Link>
        </div>
      </div>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search listings…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chip-row">
          {['all', ...Object.keys(STATUSES)].map((s) => <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s === 'all' ? 'All' : STATUSES[s].label}</button>)}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Photo</th><th>Address</th><th>Price</th><th>Type</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><SmartImage src={p.images?.[0]} /></td>
                <td><b>{p.address}</b><div className="muted" style={{ fontSize: '.82rem' }}>{p.city}, {p.state}</div></td>
                <td>{listingPrice(p)}</td>
                <td>{p.type}</td>
                <td><span className={`badge ${statusInfo(p.status).badge}`}>{statusInfo(p.status).label}</span></td>
                <td><input type="checkbox" checked={!!p.featured} onChange={(e) => updateProperty(p.id, { featured: e.target.checked })} aria-label="Featured" /></td>
                <td>
                  <div className="row-actions">
                    <Link to={`/property/${p.id}`} className="btn btn-ghost btn-sm">View</Link>
                    <Link to={`/admin/listings/${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="empty">No listings found.</div>}
      </div>
    </>
  );
}
