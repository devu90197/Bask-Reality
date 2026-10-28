import { Navigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import PanelShell from './PanelShell';

const LINKS = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/listings', icon: 'listings', label: 'Listings' },
  { to: '/admin/listings/new', icon: 'add', label: 'Add listing' },
  { to: '/admin/agents', icon: 'agents', label: 'Agents' },
  { to: '/admin/inquiries', icon: 'inquiries', label: 'Inquiries' },
  { to: '/admin/users', icon: 'users', label: 'Users' },
  { to: '/admin/settings', icon: 'settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { session } = useStore();
  if (session?.role !== 'admin') return <Navigate to="/login" replace />;
  return <PanelShell links={LINKS} home="/admin" title="BASK Admin" ariaLabel="Admin navigation" />;
}
