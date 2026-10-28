import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import ImageManager from '../../components/ui/ImageManager';
import AmenityPicker from '../../components/ui/AmenityPicker';
import Select from '../../components/ui/Select';
import { BASE_CURRENCY, currencySymbol, formatPrice, getCurrency, rateLabel, toBase, toDisplay, STATUSES } from '../../utils/format';

const EMPTY = {
  title: '', address: '', city: '', state: '', zip: '', price: '', status: 'sale', type: 'House',
  beds: '', baths: '', sqft: '', yearBuilt: '', lot: '', description: '',
  images: [], features: [], featured: false, hot: false, agentId: '',
};

const TABS = ['Details', 'Photos', 'Amenities', 'Description'];

// Live summary of what the listing will look like, updated as the form is filled in.
function ListingPreview({ form, agent }) {
  const status = STATUSES[form.status];
  const cover = form.images[0];
  const steps = [
    ['Location', Boolean(form.address && form.city)],
    ['Price', Number(form.price) > 0],
    ['Specs', Boolean(form.beds || form.sqft)],
    ['Photos', form.images.length > 0],
    ['Description', Boolean(form.description?.trim())],
  ];
  const done = steps.filter(([, ok]) => ok).length;
  return (
    <aside className="lf-preview">
      <div className="card lf-card">
        <div className="lf-cover" style={cover ? { backgroundImage: `url(${cover.url || cover})` } : undefined}>
          {!cover && <span>No cover photo yet</span>}
          <span className="lf-status">{status.label}</span>
        </div>
        <div className="lf-body">
          <div className="lf-price">{Number(form.price) > 0 ? formatPrice(Number(form.price), status.recurring) : '—'}</div>
          <div className="lf-title">{form.title || form.address || 'Untitled listing'}</div>
          <div className="muted lf-addr">{[form.city, form.state, form.zip].filter(Boolean).join(', ') || 'Address not set'}</div>
          <div className="lf-specs">
            <span><b>{form.beds || 0}</b> bd</span><span><b>{form.baths || 0}</b> ba</span><span><b>{form.sqft || 0}</b> sq ft</span>
          </div>
          <div className="lf-agent muted">{agent ? `Agent: ${agent.name}` : 'No agent assigned'}</div>
        </div>
      </div>
      <div className="card lf-progress">
        <div className="lf-progress-head"><b>Completeness</b><span>{done}/{steps.length}</span></div>
        <div className="lf-meter"><i style={{ width: `${(done / steps.length) * 100}%` }} /></div>
        <ul>
          {steps.map(([l, ok]) => <li key={l} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : ''}</span>{l}</li>)}
        </ul>
      </div>
    </aside>
  );
}

// Price is typed in the display currency and stored in INR. The typed text is kept as-is while editing,
// and re-derived from the stored INR value whenever the site's currency or rate changes.
const shown = (base) => (Number(base) > 0 ? String(Math.round(toDisplay(base))) : '');

function PriceInput({ value, onChange, label }) {
  const { code, rate } = getCurrency();
  const [text, setText] = useState(() => shown(value));
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setText(shown(value));
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(t);
  }, [code, rate]); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (e) => {
    setText(e.target.value);
    onChange(e.target.value === '' ? '' : toBase(e.target.value));
  };
  return (
    <div className="field">
      <label htmlFor="f-price">{label} ({code})</label>
      <div className={`input-adorned ${flash ? 'flash' : ''}`}>
        <span className="adorn" aria-hidden="true">{currencySymbol()}</span>
        <input id="f-price" className="input" type="number" min="0" step="any" placeholder="0" value={text} onChange={change} />
      </div>
      {code !== BASE_CURRENCY && Number(value) > 0 && <small className="muted field-hint">Saved as {Math.round(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} · {rateLabel(code, rate)}</small>}
    </div>
  );
}

function FormSection({ title, hint, children }) {
  return (
    <section className="form-section">
      <div className="fs-head"><h3>{title}</h3><p>{hint}</p></div>
      <div className="fs-body">{children}</div>
    </section>
  );
}

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
      price: Math.round(Number(form.price)), beds: Number(form.beds), baths: Number(form.baths),
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
        <div>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/admin/listings">Listings</Link><span aria-hidden="true">/</span><span>{existing ? 'Edit' : 'New'}</span>
          </nav>
          <h2 style={{ margin: 0 }}>{existing ? 'Edit listing' : 'Add listing'}</h2>
        </div>
        <div className="chip-row">
          <label className="switch"><input type="checkbox" checked={form.featured} onChange={set('featured')} /><i aria-hidden="true" /> Featured</label>
          <label className="switch"><input type="checkbox" checked={form.hot} onChange={set('hot')} /><i aria-hidden="true" /> Hot home</label>
          <span className="header-divider" aria-hidden="true" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/listings')}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save changes' : 'Create listing'}</button>
        </div>
      </div>

      <div className="lf-layout">
      <div className="lf-main">
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
          <>
            <FormSection title="Location" hint="Where the property is. Shown on the listing and used by search.">
              <div className="fs-grid">
                <div className="span-2">{input('address', 'Street address', 'text', { placeholder: '221 Brigade Road' })}</div>
                {input('city', 'City', 'text', { placeholder: 'Bengaluru' })}
                {input('state', 'State', 'text', { placeholder: 'Karnataka' })}
                {input('zip', 'ZIP / PIN', 'text', { placeholder: '560001' })}
              </div>
            </FormSection>
            <FormSection title="Pricing & status" hint="How the property is offered and who represents it.">
              <div className="fs-grid">
                <PriceInput value={form.price} onChange={patch('price')} label={STATUSES[form.status].recurring ? 'Price per month' : 'Price'} />
                <div className="field"><label htmlFor="f-status">Status</label>
                  <Select id="f-status" value={form.status} onChange={patch('status')} options={Object.entries(STATUSES).map(([k, s]) => ({ value: k, label: s.label }))} />
                </div>
                <div className="field"><label htmlFor="f-type">Property type</label>
                  <Select id="f-type" value={form.type} onChange={patch('type')} options={['House', 'Condo', 'Apartment', 'Villa', 'Townhouse', 'Multi-family', 'Land']} />
                </div>
                <div className="field"><label htmlFor="f-agent">Listing agent</label>
                  <Select id="f-agent" value={form.agentId} onChange={patch('agentId')} options={[{ value: '', label: 'No agent' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]} />
                </div>
              </div>
            </FormSection>
            <FormSection title="Property specs" hint="Size and layout of the home.">
              <div className="fs-grid">
                {input('beds', 'Bedrooms', 'number', { min: 0, placeholder: '0' })}
                {input('baths', 'Bathrooms', 'number', { min: 0, step: 0.5, placeholder: '0' })}
                {input('sqft', 'Area (sq ft)', 'number', { min: 0, placeholder: '0' })}
                {input('yearBuilt', 'Year built', 'number', { placeholder: 'YYYY' })}
                {input('lot', 'Lot size', 'text', { placeholder: 'e.g. 0.25 acres' })}
              </div>
            </FormSection>
            <FormSection title="Presentation" hint="Leave the title empty to generate one from the address.">
              <div className="fs-grid">
                <div className="span-2">{input('title', 'Listing title (optional)', 'text', { placeholder: 'Sunlit 3BHK near MG Road' })}</div>
              </div>
            </FormSection>
          </>
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
      </div>
      <ListingPreview form={form} agent={agents.find((a) => a.id === form.agentId)} />
      </div>
    </form>
  );
}
