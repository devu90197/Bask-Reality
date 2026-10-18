import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../context/StoreContext';

export const NAV_LINKS = [
  { to: '/buy', label: 'Buy' },
  { to: '/rent', label: 'Rent' },
  { to: '/lease', label: 'Lease' },
  { to: '/sell', label: 'Sell' },
  { to: '/mortgage', label: 'Mortgage' },
  { to: '/agents', label: 'Find an Agent' },
  { to: '/blog', label: 'Guides' },
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="BASK Reality home">
      <span className="logo-mark">⌂</span>
      <span>BASK <b>Reality</b></span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const onLogout = () => { logout(); navigate('/'); };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <ul className="nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l.to}><NavLink to={l.to}>{l.label}</NavLink></li>
          ))}
        </ul>
        <div className="nav-actions">
          <Link to="/favorites" className="btn btn-ghost btn-sm hide-md">♡ Saved</Link>
          {session ? (
            <>
              {session.role === 'admin' && <Link to="/admin" className="btn btn-primary btn-sm hide-md">Admin</Link>}
              <button className="btn btn-ghost btn-sm hide-md" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm hide-md">Sign in</Link>
          )}
          <button className={`burger ${open ? 'open' : ''}`} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, rotateX: -15, y: -20 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ transformPerspective: 800, transformOrigin: 'top' }}
          >
            {NAV_LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
            <Link to="/favorites">Saved homes</Link>
            <Link to="/contact">Contact</Link>
            {session?.role === 'admin' && <Link to="/admin">Admin panel</Link>}
            {session
              ? <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onLogout}>Log out</button>
              : <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, borderBottom: 0 }}>Sign in</Link>}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
