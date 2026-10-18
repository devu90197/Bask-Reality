import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import ImageManager from '../../components/ui/ImageManager';
import AmenityPicker from '../../components/ui/AmenityPicker';
import Select from '../../components/ui/Select';
import { STATUSES } from '../../utils/format';

const EMPTY = {
  title: '', address: '', city: '', state: '', zip: '', price: '', status: 'sale', type: 'House',
  beds: '', baths: '', sqft: '', yearBuilt: '', lot: '', description: '',
  images: [], features: [], featured: false, hot: false, agentId: '',
};

const TABS = ['Details', 'Photos', 'Amenities', 'Description'];

export default function ListingForm() {
  const { id } = useParams();
  const { properties, ready } = useStore();
  if (!ready) return <p className="muted">Loading…</p>;
  const existing = properties.find((p) => p.id === id);
  if (id && !existing) return <p className="muted">Listing not found.</p>;
  return <ListingEditor key={id || 'new'} existing={existing} />;
}

function ListingEditor({ existing }) {
  const { agents, addProperty, updateProperty } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...EMPTY, ...existing }));
  const [tab, setTab] = useState('Details');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const patch = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.address || !form.city || !form.price) {
      setTab('Details');
      return setError('Address, city and price are required.');
    }
    const data = {
      ...form,
      price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
      sqft: Number(form.sqft), yearBuilt: Number(form.yearBuilt),
      images: form.images.filter(Boolean),
      title: form.title || `${form.beds ? `${form.beds} Bed ` : ''}${form.type} in ${form.city}`,
    };
    setSaving(true);
    try {
      await (existing ? updateProperty(existing.id, data) : addProperty(data));
      navigate('/admin/listings');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input = (k, label, type = 'text', extra = {}) => (
    <div className="field"><label htmlFor={`f-${k}`}>{label}</label><input id={`f-${k}`} className="input" type={type} value={form[k]} onChange={set(k)} {...extra} /></div>
  );

  const badge = { Photos: form.images.length, Amenities: form.features.length };

  return (
    <form className="compact-form" onSubmit={submit}>
      <div className="form-header">
        <h2 style={{ margin: 0 }}>{existing ? 'Edit listing' : 'Add listing'}</h2>
        <div className="chip-row">
          <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured</label>
          <label className="check"><input type="checkbox" checked={form.hot} onChange={set('hot')} /> Hot home</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/listings')}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save changes' : 'Create listing'}</button>
        </div>
      </div>

      <div className="seg form-tabs">
        {TABS.map((t) => (
          <button type="button" key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}{badge[t] > 0 && <span className="count">{badge[t]}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'Details' && (
          <div className="dense-grid">
            {input('address', 'Street address')}
            {input('city', 'City')}
            {input('state', 'State')}
            {input('zip', 'ZIP / PIN')}
            {input('price', STATUSES[form.status].recurring ? 'Price per month (USD)' : 'Price (USD)', 'number', { min: 0 })}
            <div className="field"><label htmlFor="f-status">Status</label>
              <Select id="f-status" value={form.status} onChange={patch('status')} options={Object.entries(STATUSES).map(([k, s]) => ({ value: k, label: s.label }))} />
            </div>
            <div className="field"><label htmlFor="f-type">Type</label>
              <Select id="f-type" value={form.type} onChange={patch('type')} options={['House', 'Condo', 'Apartment', 'Villa', 'Townhouse', 'Multi-family', 'Land']} />
            </div>
            {input('beds', 'Beds', 'number', { min: 0 })}
            {input('baths', 'Baths', 'number', { min: 0, step: 0.5 })}
            {input('sqft', 'Sq ft', 'number', { min: 0 })}
            {input('yearBuilt', 'Year built', 'number')}
            {input('lot', 'Lot size')}
            <div className="field"><label htmlFor="f-agent">Agent</label>
              <Select id="f-agent" value={form.agentId} onChange={patch('agentId')} options={[{ value: '', label: 'No agent' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]} />
            </div>
            {input('title', 'Title (optional)')}
          </div>
        )}

        {tab === 'Photos' && <ImageManager images={form.images} onChange={patch('images')} />}

        {tab === 'Amenities' && <AmenityPicker value={form.features} onChange={patch('features')} />}

        {tab === 'Description' && (
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="f-desc">Description</label>
            <textarea id="f-desc" className="textarea" rows={8} value={form.description} onChange={set('description')} placeholder="Describe the home, neighborhood and highlights…" />
          </div>
        )}
      </div>
    </form>
  );
}
