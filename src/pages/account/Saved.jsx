import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { STATUSES } from '../../utils/format';
import PropertyCard from '../../components/ui/PropertyCard';

export default function Saved() {
  const { account, properties } = useStore();
  const [status, setStatus] = useState('all');
  if (!account) return <p className="muted">Loading…</p>;

  // Keep the order they were saved in, newest first.
  const saved = [...account.saved].reverse().map((id) => properties.find((p) => p.id === id)).filter(Boolean);
  const shown = saved.filter((p) => status === 'all' || p.status === status);
  const count = (k) => saved.filter((p) => p.status === k).length;

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/account">My account</Link><span aria-hidden="true">/</span><span>Saved homes</span></nav>
          <h2 style={{ margin: 0 }}>Saved homes <span className="count-pill">{saved.length}</span></h2>
        </div>
        <Link to="/buy" className="btn btn-ghost btn-sm">Find more homes</Link>
      </div>

      <div className="seg form-tabs iq-tabs">
        {[['all', 'All', saved.length], ...Object.entries(STATUSES).map(([k, s]) => [k, s.label, count(k)])].map(([k, l, n]) => (
          <button type="button" key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>{l}<span className="count">{n}</span></button>
        ))}
      </div>

      <div className="card acc-fill">
        {shown.length ? (
          <div className="acc-cards">{shown.map((p) => <PropertyCard key={p.id} property={p} />)}</div>
        ) : (
          <div className="empty">
            <h3>{saved.length ? 'Nothing in this group' : 'No saved homes yet'}</h3>
            <p>Tap the ♡ on any listing to save it. Saved homes stay with your account on every device.</p>
            <Link to="/buy" className="btn btn-primary btn-sm">Browse homes</Link>
          </div>
        )}
      </div>
    </>
  );
}
