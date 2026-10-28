import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import Icon from '../../components/ui/Icon';

const STATUSES = ['new', 'contacted', 'closed'];
const STATUS_LABEL = { new: 'Sent', contacted: 'Agent replied', closed: 'Closed' };
const STATUS_HINT = {
  new: 'Your request has reached our team. An agent usually replies within one business day.',
  contacted: 'An agent has been in touch by email or phone. Check your inbox and messages.',
  closed: 'This request is complete. Send a new one any time.',
};
const TYPE_LABEL = { tour: 'Tour request', valuation: 'Valuation', contact: 'General' };

export default function MyInquiries() {
  const { account, properties, agents } = useStore();
  const [selectedId, setSelectedId] = useState(null);
  if (!account) return <p className="muted">Loading…</p>;

  const list = account.inquiries;
  const q = list.find((x) => x.id === selectedId) || list[0] || null;
  const property = q?.propertyId && properties.find((p) => p.id === q.propertyId);
  const agent = property && agents.find((a) => a.id === property.agentId);
  const step = q ? STATUSES.indexOf(q.status) : -1;

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/account">My account</Link><span aria-hidden="true">/</span><span>My inquiries</span></nav>
          <h2 style={{ margin: 0 }}>My inquiries <span className="count-pill">{list.length}</span></h2>
        </div>
        <Link to="/contact" className="btn btn-primary btn-sm">New message</Link>
      </div>

      <div className="lf-layout ag-layout iq-layout">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Request</th><th>Type</th><th>Status</th><th>Sent</th></tr></thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} className={`iq-row ${q?.id === x.id ? 'row-editing' : ''}`} onClick={() => setSelectedId(x.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(x.id); }}>
                  <td className="iq-snippet"><b>{x.subject || x.address || TYPE_LABEL[x.type]}</b><div className="muted">{x.message}</div></td>
                  <td><span className={`type-pill t-${x.type}`}>{TYPE_LABEL[x.type] || x.type}</span></td>
                  <td><span className={`status-pill s-${x.status}`}><i />{STATUS_LABEL[x.status] || x.status}</span></td>
                  <td className="muted ag-num iq-when">{new Date(x.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <div className="empty">
              <h3>No inquiries yet</h3>
              <p>Request a tour from any listing, ask for a valuation, or send us a message. Every request and its status shows up here.</p>
              <Link to="/buy" className="btn btn-primary btn-sm">Browse homes</Link>
            </div>
          )}
        </div>

        {q ? (
          <div className="card iq-detail">
            <div className="iq-detail-head">
              <div>
                <b>{q.subject || q.address || TYPE_LABEL[q.type]}</b>
                <div className="muted ag-sub">Sent {new Date(q.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <span className={`type-pill t-${q.type}`}>{TYPE_LABEL[q.type] || q.type}</span>
            </div>

            <section className="iq-block">
              <h4>Progress</h4>
              <ol className="progress-steps">
                {STATUSES.map((s, i) => (
                  <li key={s} className={i <= step ? 'done' : ''}>
                    <span>{i <= step ? <Icon name="check" strokeWidth={3} /> : i + 1}</span>{STATUS_LABEL[s]}
                  </li>
                ))}
              </ol>
              <p className="muted iq-line" style={{ marginTop: 10 }}>{STATUS_HINT[q.status]}</p>
            </section>

            {property && (
              <section className="iq-block">
                <h4>Property</h4>
                <Link to={`/property/${property.id}`} className="acc-row">
                  <span className="acc-thumb" style={property.images?.[0] ? { backgroundImage: `url(${property.images[0]})` } : undefined} />
                  <div><b>{property.title}</b><small className="muted">{property.city}</small></div>
                  <Icon name="open" size={16} />
                </Link>
                {agent && <p className="muted iq-line">Your agent: <b style={{ color: 'var(--ink)' }}>{agent.name}</b>{agent.phone ? ` · ${agent.phone}` : ''}</p>}
              </section>
            )}

            <section className="iq-block">
              <h4>Your message</h4>
              <p className="iq-message">{q.message || <span className="muted">No message.</span>}</p>
              {q.timeline && <p className="muted iq-line">Timeline: {q.timeline}</p>}
            </section>

            <section className="iq-block">
              <h4>Contact details you gave</h4>
              <dl className="iq-dl">
                <dt>Name</dt><dd>{q.name}</dd>
                <dt>Email</dt><dd>{q.email || '—'}</dd>
                <dt>Phone</dt><dd className="ag-num">{q.phone || '—'}</dd>
              </dl>
            </section>
          </div>
        ) : (
          <div className="card iq-detail iq-empty"><Icon name="inquiries" /><b>Nothing to show yet</b><p className="muted">Your requests and their status appear here.</p></div>
        )}
      </div>
    </>
  );
}
