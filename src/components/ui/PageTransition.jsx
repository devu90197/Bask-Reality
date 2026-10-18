import { motion, useReducedMotion } from 'framer-motion';

// Camera-style scene change between pages: the old page tilts away,
// the new one swings forward into place.
export default function PageTransition({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return <main>{children}</main>;

  return (
    <motion.main
      initial={{ opacity: 0, rotateX: 12, scale: 0.94, y: 60 }}
      animate={{
        opacity: 1, rotateX: 0, scale: 1, y: 0,
        // Clear the transform once settled so fixed overlays (lightbox) and sticky elements work.
        transitionEnd: { transform: 'none' },
      }}
      exit={{ opacity: 0, rotateX: -8, scale: 0.96, y: -40 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1600, transformOrigin: 'center top' }}
    >
      {children}
    </motion.main>
  );
}
