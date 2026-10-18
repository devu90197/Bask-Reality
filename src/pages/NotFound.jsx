import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="container section empty">
      <motion.h1 animate={{ rotateY: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '6rem', transformPerspective: 600 }}>404</motion.h1>
      <h2>This page moved out</h2>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  );
}
