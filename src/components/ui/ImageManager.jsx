import { useRef, useState } from 'react';
import SmartImage from './SmartImage';
import { api } from '../../utils/api';

const MAX_SIDE = 1600;

// Shrinks an uploaded photo so it fits comfortably in browser storage.
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read file'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error(`${file.name} is not a supported image`));
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const looksLikeImage = (url) => /^data:image\//.test(url) || /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i.test(url) || /images\.unsplash\.com/.test(url);

// Turns a pasted link (image or web page) into a direct image URL via the dev server.
async function resolveImageUrl(url) {
  if (looksLikeImage(url)) return url;
  const { image } = await api(`/resolve-image?url=${encodeURIComponent(url)}`);
  return image;
}

export default function ImageManager({ images, onChange }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const fileInput = useRef(null);

  const addUrl = async () => {
    const value = url.trim();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      const resolved = await resolveImageUrl(value);
      onChange([...images, resolved]);
      setUrl('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addFiles = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return setError('Please choose image files (JPG, PNG, WebP…).');
    setBusy(true);
    setError('');
    try {
      const urls = await Promise.all(list.map(fileToDataUrl));
      onChange([...images, ...urls]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (i) => onChange(images.filter((_, j) => j !== i));
  const makeCover = (i) => onChange([images[i], ...images.filter((_, j) => j !== i)]);

  return (
    <div className="field">
      <label>Photos</label>
      <div className="img-add">
        <input
          className="input"
          placeholder="Paste an image link or a web page link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
        />
        <button type="button" className="btn btn-ghost" onClick={addUrl} disabled={busy}>{busy ? 'Adding…' : 'Add link'}</button>
        <button type="button" className="btn btn-primary" onClick={() => fileInput.current.click()} disabled={busy}>📁 Upload from computer</button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <div
        className={`drop ${over ? 'over' : ''}`}
        onClick={() => fileInput.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      >
        Or drag &amp; drop photos here
      </div>
      {error && <div className="alert alert-error" style={{ marginTop: 10, marginBottom: 0 }}>{error}</div>}

      {images.length > 0 ? (
        <>
          <small className="muted" style={{ display: 'block', marginTop: 10 }}>{images.length} photo{images.length > 1 ? 's' : ''} · choose which one is the cover shown on listing cards.</small>
          <div className="img-manager">
            {images.map((src, i) => (
              <div key={`${i}-${src.slice(-24)}`} className={`img-tile ${i === 0 ? 'cover' : ''}`}>
                <div className="tile-actions">
                  <button type="button" title="Remove photo" onClick={() => remove(i)}>✕</button>
                </div>
                <SmartImage src={src} alt={`Photo ${i + 1}`} loading="eager" />
                <label className="cover-pick">
                  <input type="radio" name="cover" checked={i === 0} onChange={() => makeCover(i)} />
                  {i === 0 ? 'Cover photo' : 'Set as cover'}
                </label>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>No photos yet. Add as many as you like.</p>
      )}
    </div>
  );
}
