import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import PanelShell from './PanelShell';

// Client account portal: same liquid-glass shell as the admin panel.
export default function AccountLayout() {
  const { session, account } = useStore();
  const { pathname } = useLocation();

  if (!session) return <Navigate to="/login" replace state={{ from: pathname }} />;
  if (session.role === 'admin') return <Navigate to="/admin" replace />;

  const openInquiries = (account?.inquiries || []).filter((q) => q.status !== 'closed').length;
  const links = [
    { to: '/account', icon: 'dashboard', label: 'Overview' },
    { to: '/account/saved', icon: 'heart', label: 'Saved homes', badge: account?.saved.length },
    { to: '/account/inquiries', icon: 'inquiries', label: 'My inquiries', badge: openInquiries },
    { to: '/account/calculations', icon: 'calc', label: 'Calculations', badge: account?.calcs.length },
    { to: '/account/history', icon: 'history', label: 'History' },
    { to: '/account/profile', icon: 'profile', label: 'Profile' },
  ];
  return <PanelShell links={links} home="/account" title="My account" ariaLabel="Account navigation" />;
}
