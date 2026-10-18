import { useState } from 'react';
import { AMENITY_GROUPS, amenityIcon } from '../../data/amenities';

export default function AmenityPicker({ value, onChange }) {
  const [group, setGroup] = useState(AMENITY_GROUPS[0].group);
  const [custom, setCustom] = useState('');
  const toggle = (name) => onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);
  const items = AMENITY_GROUPS.find((g) => g.group === group).items;

  const addCustom = () => {
    const name = custom.trim();
    if (name && !value.includes(name)) onChange([...value, name]);
    setCustom('');
  };

  return (
    <div>
      <div className="seg">
        {AMENITY_GROUPS.map((g) => {
          const n = g.items.filter(([name]) => value.includes(name)).length;
          return (
            <button type="button" key={g.group} className={group === g.group ? 'active' : ''} onClick={() => setGroup(g.group)}>
              {g.group}{n > 0 && <span className="count">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="amenity-grid">
        {items.map(([name, icon]) => (
          <button type="button" key={name} className={`amenity ${value.includes(name) ? 'on' : ''}`} onClick={() => toggle(name)}>
            <span>{icon}</span>{name}
          </button>
        ))}
      </div>
      <div className="img-add" style={{ marginTop: 10 }}>
        <input className="input" placeholder="Add your own amenity…" value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={addCustom}>+ Add</button>
      </div>
      {value.length > 0 && (
        <div className="selected-amenities">
          <small className="muted">Selected ({value.length}):</small>
          {value.map((v) => (
            <span key={v} className="amenity on mini">
              {amenityIcon(v)} {v}
              <button type="button" aria-label={`Remove ${v}`} onClick={() => toggle(v)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
