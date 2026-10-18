import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

// Cinematic, scroll-linked 3D entrance: content tilts up from the floor, fades in
// and settles as it reaches the middle of the screen, then drifts back as it leaves.
export default function Reveal({ children, delay = 0, className, style, as = 'div' }) {
  const Tag = motion[as];
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  // A small per-item lag gives grids a staggered "wave" feel.
  const lag = Math.min(delay, 0.3) * 0.25;
  const inStart = 0.0 + lag;
  const inEnd = 0.32 + lag;

  const rotateX = useTransform(p, [inStart, inEnd, 0.85, 1], [28, 0, 0, -10]);
  const y = useTransform(p, [inStart, inEnd], [90, 0]);
  const scale = useTransform(p, [inStart, inEnd, 0.85, 1], [0.88, 1, 1, 0.96]);
  const opacity = useTransform(p, [inStart, inEnd - 0.12], [0, 1]);

  if (reduce) {
    return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ rotateX, y, scale, opacity, transformPerspective: 1100, transformOrigin: 'center bottom', ...style }}
    >
      {children}
    </Tag>
  );
}
