import { useState } from 'react';

// Shows the whole photo (never cropped) at any aspect ratio, with a blurred copy filling the empty space.
export default function SmartImage({ src, alt = '', className = '', onClick, loading = 'lazy' }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`smart-img ${className}`} onClick={onClick}>
      {!failed && src ? (
        <>
          <img className="smart-img-bg" src={src} alt="" aria-hidden="true" loading={loading} />
          <img className="smart-img-fg" src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />
        </>
      ) : (
        <div className="smart-img-empty">⌂ <span>Photo unavailable</span></div>
      )}
    </div>
  );
}
