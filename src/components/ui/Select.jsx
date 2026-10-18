import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const toOption = (o) => (typeof o === 'object' ? o : { value: o, label: String(o) });

/**
 * Liquid-glass dropdown used everywhere in place of the native <select>.
 * - options: array of strings or { value, label }
 * - value / onChange(value): controlled; or defaultValue for uncontrolled use
 * - name: also renders a hidden input so it works inside plain <form> submissions
 * The list is portalled to <body> so it is never clipped by tables or cards,
 * and flips upward when there is not enough room below.
 */
export default function Select({ id, name, value, defaultValue, onChange, options, ariaLabel, className = '', size = 'md' }) {
  const opts = options.map(toOption);
  const [inner, setInner] = useState(defaultValue ?? opts[0]?.value);
  const current = value !== undefined ? value : inner;
  const selected = opts.find((o) => String(o.value) === String(current)) || opts[0];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const listHeight = Math.min(320, opts.length * 42 + 12);
    const below = window.innerHeight - r.bottom;
    const up = below < listHeight + 12 && r.top > below;
    setPos({ left: r.left, width: Math.max(r.width, 180), top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined, up });
  }, [opts.length]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!triggerRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  // Keep the highlighted option in view while navigating with the keyboard.
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const choose = (o) => {
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openList = () => {
    setActive(Math.max(0, opts.indexOf(selected)));
    setOpen(true);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(opts.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (opts[active]) choose(opts[active]); }
    else if (e.key.length === 1) {
      const i = opts.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`gselect gselect-${size} ${open ? 'open' : ''} ${className}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="gselect-value">{selected?.label}</span>
        <svg className="gselect-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {name && <input type="hidden" name={name} value={selected?.value ?? ''} />}
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="gselect-list"
              style={{ left: Math.min(pos.left, window.innerWidth - pos.width - 12), '--gs-min': `${pos.width}px`, top: pos.top, bottom: pos.bottom, transformOrigin: pos.up ? 'bottom center' : 'top center' }}
              initial={{ opacity: 0, scale: 0.96, y: pos.up ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: pos.up ? 4 : -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {opts.map((o, i) => {
                const isSel = o.value === selected?.value;
                return (
                  <li
                    key={String(o.value)}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSel}
                    className={`${i === active ? 'active' : ''} ${isSel ? 'selected' : ''}`}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(o)}
                  >
                    <span>{o.label}</span>
                    {isSel && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
