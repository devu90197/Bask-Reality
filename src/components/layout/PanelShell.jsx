import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { Logo } from './Navbar';
import ThemeToggle, { useAdminTheme } from '../ui/ThemeToggle';
import Icon from '../ui/Icon';

// The liquid-glass app shell shared by the admin panel and the client account portal:
// floating sidebar (collapsible to icons, a drawer on phones), light/dark switch, and a
// main area fixed to the screen where only the inner containers scroll.

const COLLAPSE_KEY = 'bask.adminSidebarCollapsed';

const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
};

// Exactly one menu item is highlighted: the most specific link that matches the current page.
const activeLink = (links, home, pathname) => links
  .map((l) => l.to)
  .filter((to) => pathname === to || (to !== home && pathname.startsWith(`${to}/`)))
  .sort((a, b) => b.length - a.length)[0];

function NavItem({ to, icon, label, active, onClick, badge }) {
  const content = (
    <>
      <span className="nav-icon"><Icon name={icon} /></span>
      <span className="nav-label">{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </>
  );
  // title gives a tooltip when the sidebar is collapsed to icons only.
  return onClick
    ? <button type="button" title={label} onClick={onClick}>{content}</button>
    : <Link to={to} title={label} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>{content}</Link>;
}

export default function PanelShell({ links, home, title, ariaLabel }) {
  const { logout } = useStore();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const [theme, toggleTheme] = useAdminTheme();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsed]);

  const current = activeLink(links, home, pathname);

  return (
    <div className={`admin ${collapsed ? 'collapsed' : ''}`}>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      {open && <div className="admin-backdrop" onClick={() => setOpen(false)} />}
      <div className="admin-mobile-bar">
        <b>{title}</b>
        <div className="mobile-bar-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="btn btn-sm btn-light" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : 'Menu'}</button>
        </div>
      </div>
      <aside className={`admin-side ${open ? 'open' : ''}`} aria-label={ariaLabel}>
        <div className="side-head">
          <Logo />
          <div className="side-tools">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
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
        </div>
        {links.map((l) => <NavItem key={l.to} {...l} active={current === l.to} />)}
        <div className="side-foot">
          <NavItem to="/" icon="site" label="View site" />
          <NavItem icon="logout" label="Log out" onClick={() => { logout(); navigate('/'); }} />
        </div>
      </aside>
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="admin-main"
          initial={{ opacity: 0, rotateX: -6, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1400, transformOrigin: 'top' }}
        >
          <div className="admin-page">{outlet}</div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
