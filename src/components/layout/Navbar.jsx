import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9v11h13V9" />
          <path d="M10 20v-5.5h4V20" />
          <path d="M16.5 5.2V3.8h1.8v3" />
        </svg>
      </span>
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
    if (!open) return undefined;
    const close = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.documentElement.style.overflow = 'hidden';
    window.__lenis?.stop();
    window.addEventListener('keydown', close);
    return () => {
      document.documentElement.style.overflow = '';
      window.__lenis?.start();
      window.removeEventListener('keydown', close);
    };
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
          <Link to={session?.role === 'user' ? '/account/saved' : '/favorites'} className="btn btn-ghost btn-sm hide-md">♡ Saved</Link>
          {session ? (
            <>
              {session.role === 'admin' && <Link to="/admin" className="btn btn-primary btn-sm hide-md">Admin</Link>}
              {session.role === 'user' && <Link to="/account" className="btn btn-primary btn-sm hide-md">My account</Link>}
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
      {/* Rendered into <body>: the glass navbar's backdrop-filter would otherwise trap this fixed drawer. */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div className="menu-backdrop" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.nav
                className="mobile-menu"
                aria-label="Menu"
                data-lenis-prevent
                initial={{ x: '105%' }}
                animate={{ x: 0 }}
                exit={{ x: '105%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              >
                <div className="menu-head">
                  <Logo />
                  <button className="menu-close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
                </div>
                {NAV_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
                <NavLink to={session?.role === 'user' ? '/account/saved' : '/favorites'}>Saved homes</NavLink>
                {session?.role === 'user' && <NavLink to="/account">My account</NavLink>}
                <NavLink to="/contact">Contact</NavLink>
                {session?.role === 'admin' && <NavLink to="/admin">Admin panel</NavLink>}
                <div className="menu-foot">
                  {session
                    ? <button className="btn btn-ghost btn-block" onClick={onLogout}>Log out</button>
                    : <Link to="/login" className="btn btn-primary btn-block">Sign in</Link>}
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
