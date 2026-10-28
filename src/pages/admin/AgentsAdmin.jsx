import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { fileToDataUrl } from '../../components/ui/ImageManager';

const EMPTY = { name: '', phone: '', email: '', city: '', photo: '' };

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

function Avatar({ name, photo, size = 36 }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="ag-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photo && !broken ? <img src={photo} alt="" onError={() => setBroken(true)} /> : initials(name)}
    </span>
  );
}

const ICON = {
  edit: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  upload: <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</svg>
);

// Photo can come from a link or straight from the device (resized to a small headshot in the browser).
function PhotoField({ value, onChange }) {
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const uploaded = value?.startsWith('data:');

  const pick = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image (JPG, PNG, WebP…).');
    setBusy(true);
    setError('');
    try { onChange(await fileToDataUrl(file, 400)); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="field">
      <label htmlFor="ag-photo">Photo</label>
      <div
        className={`photo-drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      >
        <button type="button" className="photo-upload-btn" onClick={() => fileInput.current?.click()} disabled={busy}>
          {busy ? <span className="cur-spinner" aria-hidden="true" /> : <Icon name="upload" />}
          <span><b>{busy ? 'Processing…' : uploaded ? 'Replace photo' : 'Upload from device'}</b><small>or drag an image here</small></span>
        </button>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
      </div>
      <div className="photo-or"><span>or paste a link</span></div>
      <div className="photo-url">
        <input
          id="ag-photo" className="input" type="url" placeholder="https://…"
          value={uploaded ? '' : value} disabled={uploaded}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className="icon-btn" onClick={() => onChange('')} title="Remove photo" aria-label="Remove photo"><Icon name="close" /></button>
        )}
      </div>
      {uploaded && <small className="muted field-hint">Using the uploaded photo. Remove it to paste a link instead.</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

function FormSection({ title, hint, children }) {
  return (
    <section className="ag-section">
      <div className="fs-head"><h3>{title}</h3><p>{hint}</p></div>
      <div className="ag-fields">{children}</div>
    </section>
  );
}

export default function AgentsAdmin() {
  const { agents, properties, addAgent, updateAgent, deleteAgent } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await (editing ? updateAgent(editing, form) : addAgent(form));
      setForm(EMPTY);
      setEditing(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (a) => { setEditing(a.id); setForm({ ...EMPTY, ...a }); setError(''); };
  const cancel = () => { setEditing(null); setForm(EMPTY); setError(''); };

  const countFor = (id) => properties.filter((p) => p.agentId === id).length;
  const q = query.trim().toLowerCase();
  const shown = agents.filter((a) => !q || [a.name, a.email, a.phone, a.city].some((v) => v?.toLowerCase().includes(q)));

  const input = (k, label, extra = {}) => (
    <div className="field"><label htmlFor={`ag-${k}`}>{label}</label><input id={`ag-${k}`} className="input" value={form[k]} onChange={set(k)} {...extra} /></div>
  );

  return (
    <div className="compact-form">
      <div className="admin-top">
        <div>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/admin">Admin</Link><span aria-hidden="true">/</span><span>Agents</span></nav>
          <h2 style={{ margin: 0 }}>Agents <span className="count-pill">{agents.length}</span></h2>
        </div>
        <label className="search-field">
          <Icon name="search" />
          <input type="search" placeholder="Search name, email, phone, city" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search agents" />
        </label>
      </div>

      <div className="lf-layout ag-layout">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Agent</th><th>Phone</th><th>Area</th><th>Listings</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} className={editing === a.id ? 'row-editing' : undefined}>
                  <td>
                    <div className="ag-cell">
                      <Avatar name={a.name} photo={a.photo} />
                      <div><b>{a.name}</b><div className="muted ag-sub">{a.email || 'No email'}</div></div>
                    </div>
                  </td>
                  <td className="ag-num">{a.phone || <span className="muted">—</span>}</td>
                  <td>{a.city || <span className="muted">—</span>}</td>
                  <td><span className="listing-pill">{countFor(a.id)}</span></td>
                  <td>
                    <div className="row-actions icon-actions">
                      <button type="button" className="icon-btn" onClick={() => edit(a)} title={`Edit ${a.name}`} aria-label={`Edit ${a.name}`}><Icon name="edit" /></button>
                      <button type="button" className="icon-btn danger" onClick={() => confirm(`Remove ${a.name}?`) && deleteAgent(a.id)} title={`Remove ${a.name}`} aria-label={`Remove ${a.name}`}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <div className="empty">{agents.length ? 'No agents match your search.' : 'No agents yet. Add your first agent on the right.'}</div>}
        </div>

        <form className="card ag-panel" onSubmit={submit}>
          <div className="ag-panel-head">
            <div>
              <h3>{editing ? 'Edit agent' : 'New agent'}</h3>
              <p className="muted">{editing ? 'Changes appear on the public Agents page instantly.' : 'Agents can be assigned to listings.'}</p>
            </div>
          </div>

          <div className="ag-preview">
            <Avatar name={form.name} photo={form.photo} size={56} />
            <div>
              <b>{form.name || 'Agent name'}</b>
              <div className="muted ag-sub">{form.city || 'Area'}{form.phone ? ` · ${form.phone}` : ''}</div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <FormSection title="Profile" hint="Shown on listings and the Agents page.">
            {input('name', 'Full name', { required: true, placeholder: 'Ananya Rao' })}
            {input('city', 'Area', { placeholder: 'Whitefield, Bengaluru' })}
            <PhotoField value={form.photo} onChange={(photo) => setForm((f) => ({ ...f, photo }))} />
          </FormSection>
          <FormSection title="Contact" hint="How buyers reach this agent.">
            {input('phone', 'Phone', { type: 'tel', placeholder: '+91 98450 11234' })}
            {input('email', 'Email', { type: 'email', placeholder: 'name@baskreality.com' })}
          </FormSection>

          <div className="ag-actions">
            {editing && <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>}
            <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add agent'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
