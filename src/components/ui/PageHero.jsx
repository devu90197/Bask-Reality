import { motion } from 'framer-motion';

export default function PageHero({ eyebrow, title, text, children }) {
  return (
    <section className="page-hero">
      <span className="shape" style={{ width: 220, height: 220, right: '8%', top: '-40px' }} />
      <span className="shape" style={{ width: 120, height: 120, right: '28%', bottom: '-30px', animationDelay: '-4s' }} />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 900 }}
        >
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {text && <p>{text}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
