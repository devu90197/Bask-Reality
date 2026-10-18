import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from '../ui/PageTransition';
import { useStore } from '../../context/StoreContext';
import useSmoothScroll from '../../hooks/useSmoothScroll';

export default function SiteLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const { online } = useStore();

  useSmoothScroll(pathname);

  return (
    <>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <Navbar />
      <AnimatePresence mode="wait">
        <PageTransition key={pathname}>{outlet}</PageTransition>
      </AnimatePresence>
      <Footer />
      {!online && <div className="offline-bar">Reconnecting to live data…</div>}
    </>
  );
}
