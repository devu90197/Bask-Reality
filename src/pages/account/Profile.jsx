import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export default function Profile() {
  const { account, updateProfile, logout } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ saving: false, saved: false, error: '' });
  if (!account) return <p className="muted">Loading…</p>;

  const p = account.profile;
  const values = form || { name: p.name, phone: p.phone || '' };
  const set = (k) => (e) => { setForm({ ...values, [k]: e.target.value }); setStatus((s) => ({ ...s, saved: false })); };

  const save = async (e) => {
    e.preventDefault();
    setStatus({ saving: true, saved: false, error: '' });
    try {
      await updateProfile(values);
      setForm(null);
      setStatus({ saving: false, saved: true, error: '' });
    } catch (err) {
      setStatus({ saving: false, saved: false, error: err.message });
    }
  };

  const initials = p.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  return (
    <>
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/account">My account</Link><span aria-hidden="true">/</span><span>Profile</span></nav>
          <h2 style={{ margin: 0 }}>Profile</h2>
        </div>
      </div>

      <div className="lf-layout ag-layout">
        <form className="card ag-panel" onSubmit={save}>
          <div className="ag-preview">
            <span className="ag-avatar" style={{ width: 56, height: 56, fontSize: 21 }}>{initials}</span>
            <div><b>{p.name}</b><div className="muted ag-sub">Member since {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div></div>
          </div>
          {status.saved && <div className="alert">Profile saved.</div>}
          {status.error && <div className="alert alert-error">{status.error}</div>}
          <section className="ag-section">
            <div className="fs-head"><h3>Your details</h3><p>Used to pre-fill tour requests and so agents can reach you.</p></div>
            <div className="ag-fields">
              <div className="field"><label htmlFor="pf-name">Full name</label><input id="pf-name" className="input" required value={values.name} onChange={set('name')} /></div>
              <div className="field"><label htmlFor="pf-phone">Phone</label><input id="pf-phone" className="input" type="tel" placeholder="+91 98450 11234" value={values.phone} onChange={set('phone')} /></div>
              <div className="field"><label htmlFor="pf-email">Email</label><input id="pf-email" className="input" value={p.email} disabled /><small className="muted field-hint">Your sign-in email can't be changed here.</small></div>
            </div>
          </section>
          <div className="ag-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
            <button className="btn btn-primary btn-sm" disabled={status.saving || !form}>{status.saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>

        <div className="card iq-detail">
          <section className="iq-block" style={{ borderTop: 0, paddingTop: 0 }}>
            <h4>What we keep for you</h4>
            <ul className="ai-notes">
              <li><b>{account.saved.length}</b> saved home{account.saved.length === 1 ? '' : 's'}, on every device you sign in on.</li>
              <li><b>{account.inquiries.length}</b> inquir{account.inquiries.length === 1 ? 'y' : 'ies'} with live status updates.</li>
              <li><b>{account.calcs.length}</b> saved mortgage calculation{account.calcs.length === 1 ? '' : 's'}.</li>
              <li><b>{account.activity.length}</b> history entries: homes viewed, searches, saves, inquiries and calculations (the latest 300).</li>
            </ul>
          </section>
          <section className="iq-block">
            <h4>Privacy</h4>
            <p className="muted" style={{ margin: 0, fontSize: '.85rem', lineHeight: 1.6 }}>
              Your history is only visible to you and to BASK Reality staff helping you. You can clear it any time from <Link to="/account/history" style={{ color: 'var(--brand)', fontWeight: 600 }}>History</Link>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
