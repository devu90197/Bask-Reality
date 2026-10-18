import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { Logo } from './Navbar';

const LINKS = [
  { to: '/admin', icon: '📊', label: 'Dashboard' },
  { to: '/admin/listings', icon: '🏠', label: 'Listings' },
  { to: '/admin/listings/new', icon: '➕', label: 'Add listing' },
  { to: '/admin/agents', icon: '🧑‍💼', label: 'Agents' },
  { to: '/admin/inquiries', icon: '✉️', label: 'Inquiries' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

// Exactly one menu item is highlighted: the most specific link that matches the current page.
const activeLink = (pathname) => LINKS
  .map((l) => l.to)
  .filter((to) => pathname === to || (to !== '/admin' && pathname.startsWith(`${to}/`)))
  .sort((a, b) => b.length - a.length)[0];

const COLLAPSE_KEY = 'bask.adminSidebarCollapsed';

const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
};

function NavItem({ to, icon, label, active, onClick }) {
  const content = (
    <>
      <span className="nav-icon" aria-hidden="true">{icon}</span>
      <span className="nav-label">{label}</span>
    </>
  );
  // title gives a tooltip when the sidebar is collapsed to icons only.
  return onClick
    ? <button type="button" title={label} onClick={onClick}>{content}</button>
    : <Link to={to} title={label} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>{content}</Link>;
}

export default function AdminLayout() {
  const { session, logout } = useStore();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsed]);

  if (session?.role !== 'admin') return <Navigate to="/login" replace />;

  const current = activeLink(pathname);

  return (
    <div className={`admin ${collapsed ? 'collapsed' : ''}`}>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} />}
      <div className="admin-mobile-bar">
        <b>BASK Admin</b>
        <button className="btn btn-sm btn-light" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : 'Menu'}</button>
      </div>
      <aside className={`admin-side ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="side-head">
          <Logo />
          <button
            type="button"
            className="side-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        {LINKS.map((l) => <NavItem key={l.to} {...l} active={current === l.to} />)}
        <div className="side-foot">
          <NavItem to="/" icon="🌐" label="View site" />
          <NavItem icon="🚪" label="Log out" onClick={() => { logout(); navigate('/'); }} />
        </div>
      </aside>
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="admin-main"
          initial={{ opacity: 0, rotateX: -6, y: 20 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          style={{ transformPerspective: 1400, transformOrigin: 'top' }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
