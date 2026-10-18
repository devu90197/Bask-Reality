import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { formatPrice, listingPrice, monthlyPayment, statusInfo } from '../utils/format';
import MapEmbed from '../components/ui/MapEmbed';
import PropertyCard from '../components/ui/PropertyCard';
import InquiryForm from '../components/ui/InquiryForm';
import SmartImage from '../components/ui/SmartImage';
import Lightbox from '../components/ui/Lightbox';
import { amenityIcon } from '../data/amenities';

export default function PropertyDetail() {
  const { id } = useParams();
  const { properties, agents, favorites, toggleFavorite, ready, mortgage, settings } = useStore();
  const [lightbox, setLightbox] = useState(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const p = properties.find((x) => x.id === id);

  if (!ready) return <div className="container section empty">Loading…</div>;

  if (!p) {
    return (
      <div className="container section empty">
        <h2>Listing not found</h2>
        <Link to="/buy" className="btn btn-primary">Browse homes</Link>
      </div>
    );
  }

  const agent = agents.find((a) => a.id === p.agentId);
  const info = statusInfo(p.status);
  const isRent = info.recurring;
  const similar = properties.filter((x) => x.id !== p.id && x.status === p.status).slice(0, 4);
  const rate = settings.mortgageRate || mortgage?.rate30;
  const est = rate ? monthlyPayment(p.price * 0.8, rate, 30) : null;
  const photos = (p.images || []).filter(Boolean);

  return (
    <div className="container" style={{ paddingBlock: '28px 80px' }}>
      <nav className="muted" style={{ marginBottom: 16, fontSize: '.9rem' }}>
        <Link to="/">Home</Link> / <Link to={info.page}>{info.label}</Link> / {p.city}
      </nav>

      <div style={{ position: 'relative' }}>
        <motion.div className="gallery" initial={{ opacity: 0, rotateX: 12, y: 30 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ duration: 0.8 }} style={{ transformPerspective: 1200 }}>
          {(photos.length ? photos : ['']).slice(0, 3).map((img, i) => (
            <SmartImage key={i} src={img} alt={`${p.title} photo ${i + 1}`} onClick={() => photos.length && setLightbox(i)} loading="eager" />
          ))}
        </motion.div>
        {photos.length > 1 && (
          <button className="btn btn-light btn-sm gallery-all" onClick={() => setLightbox(0)}>▦ View all {photos.length} photos</button>
        )}
      </div>

      <div className="detail-layout">
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
            <div>
              <div className="chip-row" style={{ marginBottom: 10 }}>
                <span className={`badge ${info.badge}`}>{info.label}</span>
                {p.hot && <span className="badge badge-hot">Hot home</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 1.3rem + 2vw, 2.8rem)', margin: 0 }}>{listingPrice(p)}</h1>
              <p className="muted" style={{ fontSize: '1.1rem' }}>{p.address}, {p.city}, {p.state} {p.zip}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => toggleFavorite(p.id)}>
              {favorites.includes(p.id) ? '♥ Saved' : '♡ Save'}
            </button>
          </div>

          <div className="facts">
            {[['Beds', p.beds], ['Baths', p.baths], ['Sq ft', p.sqft && Number(p.sqft).toLocaleString()], ['Type', p.type], ['Year built', p.yearBuilt], ['Lot', p.lot]]
              .filter(([, v]) => v)
              .map(([l, v]) => <div key={l} className="fact"><span>{l}</span><b>{v}</b></div>)}
          </div>

          <h2 style={{ fontSize: '1.5rem' }}>About this home</h2>
          <p>{p.description || 'Contact us for more details about this home.'}</p>

          {p.features.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginTop: 32 }}>Amenities</h2>
              <ul className="feature-list">{p.features.map((f) => <li key={f}>{amenityIcon(f)} {f}</li>)}</ul>
            </>
          )}

          {!isRent && est && (
            <div className="card" style={{ marginTop: 32 }}>
              <h3>Estimated monthly payment</h3>
              <div className="calc-result">{formatPrice(Math.round(est))}<small style={{ fontSize: '1rem' }}>/mo</small></div>
              <p className="muted">Based on 20% down and a 30-year fixed loan at {rate.toFixed(2)}%{settings.mortgageRate ? '' : " (this week's US average)"}. <Link to={`/mortgage?price=${p.price}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>Customize →</Link></p>
            </div>
          )}

          <h2 style={{ fontSize: '1.5rem', marginTop: 32 }}>Location</h2>
          <MapEmbed query={[p.address, p.city, p.state, p.zip].filter(Boolean).join(', ')} height={300} />
        </div>

        <aside className="detail-aside">
          <div className="card">
            {agent && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                {agent.photo && <img src={agent.photo} alt={agent.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />}
                <div>
                  <b>{agent.name}</b>
                  <div className="muted" style={{ fontSize: '.88rem' }}>BASK Reality agent{agent.phone ? ` · ${agent.phone}` : ''}</div>
                </div>
              </div>
            )}
            <h3>{isRent ? 'Request a tour' : 'Tour this home'}</h3>
            <InquiryForm propertyId={p.id} subject={`${p.address}, ${p.city}`} defaultMessage={`I'm interested in ${p.address}.`} />
          </div>
        </aside>
      </div>

      <section style={{ marginTop: 64 }}>
        <h2>Similar homes</h2>
        <div className="grid grid-auto">{similar.map((s) => <PropertyCard key={s.id} property={s} />)}</div>
      </section>

      <AnimatePresence>
        {lightbox !== null && photos.length > 0 && (
          <Lightbox photos={photos} index={lightbox} onIndex={setLightbox} onClose={closeLightbox} />
        )}
      </AnimatePresence>
    </div>
  );
}
