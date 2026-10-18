import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

// Full-screen photo viewer. Rendered into <body> so it always covers the viewport (page transitions
// apply transforms that would otherwise trap position: fixed), and it locks the page scroll while open.
export default function Lightbox({ photos, index, onIndex, onClose }) {
  const count = photos.length;
  const go = (d) => onIndex((index + d + count) % count);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((i) => (i + 1) % count);
      else if (e.key === 'ArrowLeft') onIndex((i) => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.__lenis?.stop();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      window.__lenis?.start();
    };
  }, [count, onClose, onIndex]);

  return createPortal(
    <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" data-lenis-prevent
      onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="lb-close" aria-label="Close" onClick={onClose}>✕</button>
      <span className="lb-count">{index + 1} / {count}</span>
      <motion.img
        key={index}
        src={photos[index]}
        alt={`Photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      />
      {count > 1 && (
        <>
          <button className="lb-nav prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
          <button className="lb-nav next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
          <div className="lb-thumbs" onClick={(e) => e.stopPropagation()}>
            {photos.map((src, i) => (
              <img key={i} src={src} alt="" className={i === index ? 'on' : ''} onClick={() => onIndex(i)} />
            ))}
          </div>
        </>
      )}
    </motion.div>,
    document.body,
  );
}
