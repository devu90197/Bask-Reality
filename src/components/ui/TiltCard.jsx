import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Wraps children in a card that tilts in 3D toward the pointer.
export default function TiltCard({ children, className = '', intensity = 12, ...rest }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), { stiffness: 200, damping: 18 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => { x.set(0.5); y.set(0.5); };

  return (
    <div style={{ perspective: 1000, height: '100%' }}>
      <motion.div
        className={className}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileHover={{ scale: 1.02 }}
        {...rest}
      >
        {children}
      </motion.div>
    </div>
  );
}
