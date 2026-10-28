import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
import AdminLayout from './components/layout/AdminLayout';
import AccountLayout from './components/layout/AccountLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import PropertyDetail from './pages/PropertyDetail';
import Sell from './pages/Sell';
import Mortgage from './pages/Mortgage';
import Agents from './pages/Agents';
import Blog from './pages/Blog';
import About from './pages/About';
import Contact from './pages/Contact';
import Favorites from './pages/Favorites';
import Auth from './pages/Auth';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import Listings from './pages/admin/Listings';
import ListingForm from './pages/admin/ListingForm';
import Inquiries from './pages/admin/Inquiries';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import AgentsAdmin from './pages/admin/AgentsAdmin';
import AccountOverview from './pages/account/Overview';
import AccountSaved from './pages/account/Saved';
import AccountInquiries from './pages/account/MyInquiries';
import AccountCalculations from './pages/account/Calculations';
import AccountHistory from './pages/account/History';
import AccountProfile from './pages/account/Profile';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="buy" element={<Search status="sale" />} />
        <Route path="rent" element={<Search status="rent" />} />
        <Route path="lease" element={<Search status="lease" />} />
        <Route path="property/:id" element={<PropertyDetail />} />
        <Route path="sell" element={<Sell />} />
        <Route path="mortgage" element={<Mortgage />} />
        <Route path="agents" element={<Agents />} />
        <Route path="blog" element={<Blog />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="signup" element={<Auth mode="signup" />} />
        <Route path="privacy" element={<Legal page="privacy" />} />
        <Route path="terms" element={<Legal page="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="account" element={<AccountLayout />}>
        <Route index element={<AccountOverview />} />
        <Route path="saved" element={<AccountSaved />} />
        <Route path="inquiries" element={<AccountInquiries />} />
        <Route path="calculations" element={<AccountCalculations />} />
        <Route path="history" element={<AccountHistory />} />
        <Route path="profile" element={<AccountProfile />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="listings" element={<Listings />} />
        <Route path="listings/new" element={<ListingForm />} />
        <Route path="listings/:id" element={<ListingForm />} />
        <Route path="agents" element={<AgentsAdmin />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
