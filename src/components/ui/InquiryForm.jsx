import { useState } from 'react';
import { useStore } from '../../context/StoreContext';

// Saves a lead to the store; it then shows up in Admin → Inquiries.
export default function InquiryForm({ type = 'tour', propertyId, subject = '', defaultMessage = '', extraFields = null, submitLabel = 'Send request' }) {
  const { addInquiry, session } = useStore();
  const [form, setForm] = useState({ name: session?.name || '', email: session?.email || '', phone: '', message: defaultMessage });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const extra = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      await addInquiry({ ...extra, ...form, type, propertyId, subject, status: 'new' });
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (sent) {
    return <div className="alert">Thanks, {form.name.split(' ')[0] || 'there'}! We'll get back to you within one business day.</div>;
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field"><label htmlFor="iq-name">Full name</label><input id="iq-name" className="input" required value={form.name} onChange={set('name')} /></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="iq-email">Email</label><input id="iq-email" className="input" type="email" required value={form.email} onChange={set('email')} /></div>
        <div className="field"><label htmlFor="iq-phone">Phone</label><input id="iq-phone" className="input" type="tel" value={form.phone} onChange={set('phone')} /></div>
      </div>
      {extraFields}
      <div className="field"><label htmlFor="iq-msg">Message</label><textarea id="iq-msg" className="textarea" value={form.message} onChange={set('message')} /></div>
      <button className="btn btn-primary btn-block">{submitLabel}</button>
    </form>
  );
}
