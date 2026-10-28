import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/format';
import Icon from '../../components/ui/Icon';
import { ACTIVITY_TYPES, describe, timeOf, dayLabel } from './activity';

const STATUS_LABEL = { new: 'Sent', contacted: 'Agent replied', closed: 'Closed' };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const rise = {
  hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }, transitionEnd: { filter: 'none' } },
};

export default function Overview() {
  const { session, account, properties } = useStore();
  if (!account) return <p className="muted">Loading your account…</p>;

  const weekAgo = Date.now() - 7 * 86400000;
  const open = account.inquiries.filter((q) => q.status !== 'closed');
  const tiles = [
    ['Saved homes', account.saved.length, '/account/saved', 'heart', 'pink'],
    ['Open inquiries', open.length, '/account/inquiries', 'inquiries', 'amber'],
    ['Calculations', account.calcs.length, '/account/calculations', 'calc', 'green'],
    ['Activity this week', account.activity.filter((a) => a.at > weekAgo).length, '/account/history', 'history', 'indigo'],
  ];
  const savedHomes = properties.filter((p) => account.saved.includes(p.id)).slice(0, 4);
  const first = session.name.split(' ')[0];

  return (
    <motion.div className="acc-overview" variants={stagger} initial="hidden" animate="show">
      <motion.div className="admin-top" variants={rise}>
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><span>My account</span></nav>
          <h2 style={{ margin: 0 }}>Welcome back, {first}</h2>
        </div>
        <Link to="/buy" className="btn btn-primary btn-sm">Browse homes</Link>
      </motion.div>

      <div className="acc-tiles">
        {tiles.map(([label, n, to, icon, accent]) => (
          <motion.div key={label} variants={rise}>
            <Link to={to} className={`card dash-stat acc-tile a-${accent}`}>
              <div className="ds-top"><span className="ds-label">{label}</span><span className="ds-icon"><Icon name={icon} /></span></div>
              <strong className="ds-value">{n}</strong>
              <span className="ds-caption">View all →</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="acc-grid">
        <motion.section className="card acc-panel" variants={rise}>
          <div className="acc-panel-head"><h3>Recent activity</h3><Link to="/account/history">See all</Link></div>
          <div className="acc-scroll">
            {account.activity.length ? (
              <ul className="tl-list">
                {account.activity.slice(0, 12).map((a) => {
                  const t = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.view;
                  const { text, to } = describe(a, properties);
                  return (
                    <li key={a.id} className="tl-item">
                      <span className={`tl-icon a-${t.tone}`}><Icon name={t.icon} /></span>
                      <div className="tl-body">{to ? <Link to={to}>{text}</Link> : text}<small>{dayLabel(a.at)} · {timeOf(a.at)}</small></div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted acc-empty">Your activity will appear here as you browse, save homes and send inquiries.</p>}
          </div>
        </motion.section>

        <div className="acc-side">
          <motion.section className="card acc-panel" variants={rise}>
            <div className="acc-panel-head"><h3>Inquiry status</h3><Link to="/account/inquiries">Open</Link></div>
            <div className="acc-scroll">
              {account.inquiries.length ? account.inquiries.slice(0, 4).map((q) => (
                <Link key={q.id} to="/account/inquiries" className="acc-row">
                  <div><b>{q.subject || q.address || 'General inquiry'}</b><small className="muted">{new Date(q.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small></div>
                  <span className={`status-pill s-${q.status}`}><i />{STATUS_LABEL[q.status] || q.status}</span>
                </Link>
              )) : <p className="muted acc-empty">No inquiries yet. Request a tour from any listing.</p>}
            </div>
          </motion.section>

          <motion.section className="card acc-panel" variants={rise}>
            <div className="acc-panel-head"><h3>Saved homes</h3><Link to="/account/saved">Open</Link></div>
            <div className="acc-scroll">
              {savedHomes.length ? savedHomes.map((p) => (
                <Link key={p.id} to={`/property/${p.id}`} className="acc-row">
                  <span className="acc-thumb" style={p.images?.[0] ? { backgroundImage: `url(${p.images[0]})` } : undefined} />
                  <div><b>{p.title}</b><small className="muted">{p.city}</small></div>
                  <b className="acc-price">{formatPrice(p.price)}</b>
                </Link>
              )) : <p className="muted acc-empty">Tap ♡ on any home to save it here.</p>}
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
