import { useState } from 'react';
import { useStore } from '../../context/StoreContext';

const EMPTY = { name: '', phone: '', email: '', city: '', photo: '' };

export default function AgentsAdmin() {
  const { agents, properties, addAgent, updateAgent, deleteAgent } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await (editing ? updateAgent(editing, form) : addAgent(form));
      setForm(EMPTY);
      setEditing(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (a) => { setEditing(a.id); setForm({ ...EMPTY, ...a }); };

  return (
    <div className="compact-form">
      <div className="admin-top"><h2 style={{ margin: 0 }}>Agents ({agents.length})</h2></div>
      <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="dense-grid">
          {[['name', 'Full name', true], ['phone', 'Phone'], ['email', 'Email'], ['city', 'City'], ['photo', 'Photo URL']].map(([k, l, req]) => (
            <div className="field" key={k}><label htmlFor={`ag-${k}`}>{l}</label><input id={`ag-${k}`} className="input" required={req} value={form[k]} onChange={set(k)} /></div>
          ))}
        </div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary btn-sm">{editing ? 'Save agent' : '+ Add agent'}</button>
          {editing && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Contact</th><th>City</th><th>Listings</th><th></th></tr></thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id}>
                <td><b>{a.name}</b></td>
                <td>{a.phone}<div className="muted" style={{ fontSize: '.82rem' }}>{a.email}</div></td>
                <td>{a.city}</td>
                <td>{properties.filter((p) => p.agentId === a.id).length}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => edit(a)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => confirm(`Remove ${a.name}?`) && deleteAgent(a.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!agents.length && <div className="empty">No agents yet. Add your first agent above.</div>}
      </div>
    </div>
  );
}
