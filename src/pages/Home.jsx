import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { HERO_CREDIT, HERO_IMAGE, HERO_IMAGE_LARGE, IMAGES } from '../data/images';
import { articles } from '../data/content';
import PropertyCard from '../components/ui/PropertyCard';
import Reveal from '../components/ui/Reveal';
import TiltCard from '../components/ui/TiltCard';
import SmartImage from '../components/ui/SmartImage';

const TITLE = "Find the place you'll love to call home.";

const services = [
  { icon: '🏡', title: 'Buy a home', text: 'Browse thousands of listings with real-time updates and tour on your schedule.', to: '/buy' },
  { icon: '💰', title: 'Sell for more', text: 'Get a free valuation and premium marketing from a local listing agent.', to: '/sell' },
  { icon: '🔑', title: 'Rent a place', text: 'Find apartments, condos and houses for rent that match your lifestyle.', to: '/rent' },
  { icon: '📝', title: 'Lease property', text: 'Long-term leases for homes, offices and commercial spaces.', to: '/lease' },
  { icon: '📊', title: 'Get financing', text: 'Estimate payments and connect with lenders offering competitive rates.', to: '/mortgage' },
];


export default function Home() {
  const { properties, agents, ready } = useStore();
  const [mode, setMode] = useState('buy');
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  // Cinematic scroll scene: the hero stays pinned while the camera zooms into the photo,
  // the copy drifts slowly upward while fading out, and the shot fades to white into the page.
  const heroRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const m = (from, to) => (reduce ? from : to);
  const bgScale = useTransform(hp, [0, 1], [1.02, m(1.02, 1.6)]);
  const bgY = useTransform(hp, [0, 1], ['0%', m('0%', '6%')]);
  // Fade the whole shot out (not paint over it) so it dissolves into the page background seamlessly.
  const heroOpacity = useTransform(hp, [0.45, 0.95], [1, m(1, 0)]);
  const textY = useTransform(hp, [0, 0.6], [0, m(0, -220)]);
  const textOpacity = useTransform(hp, [0.05, 0.5], [1, m(1, 0)]);
  const cueOpacity = useTransform(hp, [0, 0.1], [1, 0]);

  const forSale = properties.filter((p) => p.status === 'sale');
  const featured = [...forSale].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.createdAt - a.createdAt).slice(0, 8);
  const rentals = properties.filter((p) => p.status !== 'sale').slice(0, 4);
  const cities = Object.entries(properties.reduce((m, p) => (p.city ? { ...m, [p.city]: [...(m[p.city] || []), p] } : m), {}))
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6);

  const submit = (e) => {
    e.preventDefault();
    navigate(mode === 'sell' ? '/sell' : `/${mode}?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <section ref={heroRef} className="hero-scene">
        <motion.div className="hero" style={{ opacity: heroOpacity }}>
          <motion.div className="hero-bg" style={{ scale: bgScale, y: bgY }}>
            <div className="hero-photo" style={{ '--hero-sm': `url(${HERO_IMAGE})`, '--hero-lg': `url(${HERO_IMAGE_LARGE})` }} />
          </motion.div>
          <div className="hero-vignette" />
          <div className="hero-glow" />

          <div className="container hero-content">
            <motion.div style={{ y: textY, opacity: textOpacity }}>
              <motion.span className="eyebrow glass-pill" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
                <span className="live-dot" />Real estate, reimagined
              </motion.span>
              <h1 className="cine-title" aria-label={TITLE}>
                {TITLE.split(' ').map((w, i) => (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 70, rotateX: -90, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.35 + i * 0.09, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {w}&nbsp;
                  </motion.span>
                ))}
              </h1>
              <motion.p className="lead" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.9 }}>
                Search homes for sale, rent and lease, work with local agents, and move with confidence.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 40, rotateX: -30 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 1.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <div className="search-tabs" role="tablist">
                  {['buy', 'rent', 'lease', 'sell'].map((m) => (
                    <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)} type="button">
                      {m[0].toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
                <form className="search-box" onSubmit={submit}>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, address, ZIP or neighborhood" aria-label="Search" />
                  <button className="btn btn-primary">Search</button>
                </form>
              </motion.div>

              <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
                <div className="glass-stat"><strong>{forSale.length}</strong><span>For sale</span></div>
                <div className="glass-stat"><strong>{properties.length - forSale.length}</strong><span>Rent &amp; lease</span></div>
                <div className="glass-stat"><strong>{agents.length}</strong><span>Agents</span></div>
              </motion.div>
            </motion.div>
          </div>

          {HERO_CREDIT && <a className="hero-credit" href={HERO_CREDIT.url} target="_blank" rel="noreferrer">{HERO_CREDIT.text}</a>}
          <motion.div className="scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
            <span />Scroll
          </motion.div>
        </motion.div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">What we do</span>
              <h2>Everything you need to move</h2>
            </div>
            <p>From your first search to the closing table, BASK Reality has the tools and people to help.</p>
          </Reveal>
          <div className="grid grid-4">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <TiltCard className="card tile">
                  <Link to={s.to}>
                    <div className="tile-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p className="muted">{s.text}</p>
                    <b style={{ color: 'var(--brand)' }}>Learn more →</b>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Featured</span>
              <h2>New homes for sale</h2>
            </div>
            <Link to="/buy" className="btn btn-ghost">View all homes →</Link>
          </Reveal>
          {featured.length ? (
            <div className="grid grid-auto">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.08}><PropertyCard property={p} /></Reveal>
              ))}
            </div>
          ) : (
            <div className="card empty">{ready ? 'No homes for sale yet. New listings appear here the moment they are published.' : 'Loading live listings…'}</div>
          )}
        </div>
      </section>

      {cities.length > 0 && (
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Popular markets</span>
              <h2>Explore homes by city</h2>
            </div>
          </Reveal>
          <div className="grid grid-3">
            {cities.map(([c, list], i) => (
              <Reveal key={c} delay={(i % 3) * 0.08}>
                <TiltCard className="pcard">
                  <Link to={`/buy?q=${c}`} style={{ position: 'relative', display: 'block', aspectRatio: '16/10' }}>
                    <SmartImage src={list.find((p) => p.images?.[0])?.images[0] || IMAGES[i % IMAGES.length]} alt={c} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent 60%)', display: 'flex', alignItems: 'flex-end', padding: 20, color: '#fff' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{c}</h3>
                        <span>{list.length} listing{list.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Rentals</span>
              <h2>Homes for rent &amp; lease</h2>
            </div>
            <Link to="/rent" className="btn btn-ghost">View rentals →</Link>
          </Reveal>
          {rentals.length ? (
            <div className="grid grid-auto">
              {rentals.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}><PropertyCard property={p} /></Reveal>
              ))}
            </div>
          ) : (
            <div className="card empty">{ready ? 'No rentals or leases listed yet.' : 'Loading live listings…'}</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="cta">
            <div>
              <h2 style={{ color: '#fff' }}>What's your home worth?</h2>
              <p style={{ opacity: 0.9 }}>Get a free, no-obligation estimate from a BASK Reality agent in your area.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/sell" className="btn btn-light">Get my estimate</Link>
              <Link to="/agents" className="btn" style={{ border: '1px solid rgba(255,255,255,.5)', color: '#fff' }}>Talk to an agent</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Guides</span>
              <h2>Real estate tips and insights</h2>
            </div>
            <Link to="/blog" className="btn btn-ghost">All guides →</Link>
          </Reveal>
          <div className="grid grid-3">
            {articles.slice(0, 3).map((a, i) => (
              <Reveal key={a.id} delay={i * 0.08}>
                <TiltCard className="card">
                  <span className="badge">{a.tag}</span>
                  <h3 style={{ marginTop: 12 }}>{a.title}</h3>
                  <p className="muted">{a.excerpt}</p>
                  <small className="muted">{a.read} read</small>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
