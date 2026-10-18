import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import PageHero from '../components/ui/PageHero';
import Reveal from '../components/ui/Reveal';
import TiltCard from '../components/ui/TiltCard';

const values = [
  { icon: '🤝', title: 'Client first', text: 'Our agents are measured on your satisfaction, not just closed deals.' },
  { icon: '⚡', title: 'Technology', text: 'Instant alerts, 3D tours and smart search help you move faster.' },
  { icon: '💡', title: 'Transparency', text: 'Clear fees, honest pricing and data you can trust.' },
];

export default function About() {
  const { properties, agents } = useStore();
  const cities = new Set(properties.map((p) => p.city).filter(Boolean)).size;
  return (
    <>
      <PageHero eyebrow="About us" title="We're building a better way to move" text="BASK Reality combines local expertise with modern technology to make buying, selling and renting simpler." />
      <section className="section">
        <div className="container">
          <div className="grid grid-4" style={{ marginBottom: 64 }}>
            {[[properties.length, 'Live listings'], [cities, 'Cities'], [agents.length, 'Agents'], [properties.filter((p) => p.status !== 'sale').length, 'Rentals & leases']].map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.08} className="card stat"><b style={{ color: 'var(--brand)' }}>{n}</b><span className="muted">{l}</span></Reveal>
            ))}
          </div>
          <h2>Our values</h2>
          <div className="grid grid-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <TiltCard className="card tile"><div className="tile-icon">{v.icon}</div><h3>{v.title}</h3><p className="muted">{v.text}</p></TiltCard>
              </Reveal>
            ))}
          </div>
          <Reveal className="cta" style={{ marginTop: 64 }}>
            <div><h2 style={{ color: '#fff' }}>Join our team of agents</h2><p>Grow your career with leads, tools and support.</p></div>
            <div><Link to="/contact" className="btn btn-light">Get in touch</Link></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
