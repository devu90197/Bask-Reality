import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

const STATUSES = ['new', 'contacted', 'closed'];
const STATUS_LABEL = { new: 'New', contacted: 'Contacted', closed: 'Closed' };
const TYPE_LABEL = { tour: 'Tour request', valuation: 'Valuation', contact: 'General' };

const ICON = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  chat: <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  pin: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></>,
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</svg>
);

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// "2h ago" for today and yesterday, a short date after that.
const when = (ts) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const digits = (phone = '') => phone.replace(/[^\d+]/g, '');

function Detail({ q, onStatus, onDelete }) {
  if (!q) {
    return (
      <div className="card iq-detail iq-empty">
        <Icon name="inbox" />
        <b>Select an inquiry</b>
        <p className="muted">Pick one from the list to read it and reply.</p>
      </div>
    );
  }
  const subject = q.subject || (q.address ? `${q.address}` : TYPE_LABEL[q.type] || 'Inquiry');
  return (
    <div className="card iq-detail">
      <div className="iq-detail-head">
        <span className="ag-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{initials(q.name)}</span>
        <div>
          <b>{q.name}</b>
          <div className="muted ag-sub">{new Date(q.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
        <span className={`type-pill t-${q.type}`}>{TYPE_LABEL[q.type] || q.type}</span>
      </div>

      <div className="iq-actions">
        {q.email && <a className="iq-action" href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}><Icon name="mail" />Email</a>}
        {q.phone && <a className="iq-action" href={`tel:${digits(q.phone)}`}><Icon name="phone" />Call</a>}
        {q.phone && <a className="iq-action" href={`https://wa.me/${digits(q.phone).replace('+', '')}`} target="_blank" rel="noreferrer"><Icon name="chat" />WhatsApp</a>}
      </div>

      <section className="iq-block">
        <h4>Subject</h4>
        <p className="iq-subject">{subject}</p>
        {q.address && q.subject && <p className="muted iq-line"><Icon name="pin" />{q.address}</p>}
        {q.timeline && <p className="muted iq-line">Timeline: {q.timeline}</p>}
      </section>

      <section className="iq-block">
        <h4>Message</h4>
        <p className="iq-message">{q.message || <span className="muted">No message.</span>}</p>
      </section>

      <section className="iq-block">
        <h4>Contact</h4>
        <dl className="iq-dl">
          <dt>Email</dt><dd>{q.email || '—'}</dd>
          <dt>Phone</dt><dd className="ag-num">{q.phone || '—'}</dd>
        </dl>
      </section>

      <section className="iq-block">
        <h4>Status</h4>
        <div className="status-steps" role="radiogroup" aria-label="Inquiry status">
          {STATUSES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={q.status === s} className={`s-${s} ${q.status === s ? 'on' : ''}`} onClick={() => onStatus(s)}>
              <i aria-hidden="true" />{STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <div className="iq-foot">
        <button type="button" className="btn btn-ghost btn-sm iq-delete" onClick={onDelete}><Icon name="trash" />Delete inquiry</button>
      </div>
    </div>
  );
}

export default function Inquiries() {
  const { inquiries, updateInquiry, deleteInquiry } = useStore();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, inquiries.filter((q) => q.status === s).length]));
  const needle = query.trim().toLowerCase();
  const shown = inquiries.filter((q) =>
    (filter === 'all' || q.status === filter) &&
    (!needle || [q.name, q.email, q.phone, q.subject, q.address, q.message].some((v) => v?.toLowerCase().includes(needle))));
  const selected = inquiries.find((q) => q.id === selectedId) || shown[0] || null;

  const remove = (q) => {
    if (!confirm(`Delete the inquiry from ${q.name}?`)) return;
    deleteInquiry(q.id);
    setSelectedId(null);
  };

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/admin">Admin</Link><span aria-hidden="true">/</span><span>Inquiries</span></nav>
          <h2 style={{ margin: 0 }}>Inquiries <span className="count-pill">{inquiries.length}</span></h2>
        </div>
        <label className="search-field">
          <Icon name="search" />
          <input type="search" placeholder="Search name, email, property, message" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search inquiries" />
        </label>
      </div>

      <div className="seg form-tabs iq-tabs">
        {[['all', 'All', inquiries.length], ...STATUSES.map((s) => [s, STATUS_LABEL[s], counts[s]])].map(([k, l, n]) => (
          <button type="button" key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
            {k !== 'all' && <i className={`dot s-${k}`} aria-hidden="true" />}{l}<span className="count">{n}</span>
          </button>
        ))}
      </div>

      <div className="lf-layout ag-layout iq-layout">
        <div className="table-wrap">
          <table>
            <thead><tr><th>From</th><th>Type</th><th>Subject</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {shown.map((q) => (
                <tr
                  key={q.id}
                  className={`iq-row ${selected?.id === q.id ? 'row-editing' : ''} ${q.status === 'new' ? 'unread' : ''}`}
                  onClick={() => setSelectedId(q.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(q.id); }}
                  aria-selected={selected?.id === q.id}
                >
                  <td>
                    <div className="ag-cell">
                      <span className="ag-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials(q.name)}</span>
                      <div><b>{q.name}</b><div className="muted ag-sub">{q.email}</div></div>
                    </div>
                  </td>
                  <td><span className={`type-pill t-${q.type}`}>{TYPE_LABEL[q.type] || q.type}</span></td>
                  <td className="iq-snippet">
                    <b>{q.subject || q.address || TYPE_LABEL[q.type]}</b>
                    <div className="muted">{q.message}</div>
                  </td>
                  <td><span className={`status-pill s-${q.status}`}><i aria-hidden="true" />{STATUS_LABEL[q.status] || q.status}</span></td>
                  <td className="muted ag-num iq-when">{when(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <div className="empty">{inquiries.length ? 'No inquiries match.' : 'No inquiries yet. Tour, sell and contact form submissions appear here instantly.'}</div>}
        </div>

        <Detail
          q={selected}
          onStatus={(status) => selected && updateInquiry(selected.id, { status })}
          onDelete={() => selected && remove(selected)}
        />
      </div>
    </>
  );
}
