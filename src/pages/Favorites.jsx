import { Link, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import PageHero from '../components/ui/PageHero';
import PropertyCard from '../components/ui/PropertyCard';

export default function Favorites() {
  const { properties, favorites, isClient } = useStore();
  // Signed-in clients keep saved homes on their account.
  if (isClient) return <Navigate to="/account/saved" replace />;
  const saved = properties.filter((p) => favorites.includes(p.id));

  return (
    <>
      <PageHero eyebrow="Saved" title="Your saved homes" text={`${saved.length} home${saved.length === 1 ? '' : 's'} saved.`} />
      <section className="section">
        <div className="container">
          {saved.length ? (
            <div className="grid grid-auto">{saved.map((p) => <PropertyCard key={p.id} property={p} />)}</div>
          ) : (
            <div className="card empty">
              <h3>No saved homes yet</h3>
              <p>Tap the heart on any listing to save it here. <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create an account</Link> to keep them on every device.</p>
              <Link to="/buy" className="btn btn-primary">Browse homes</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
