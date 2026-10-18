import { Link } from 'react-router-dom';
import TiltCard from './TiltCard';
import SmartImage from './SmartImage';
import { useStore } from '../../context/StoreContext';
import { listingPrice, statusInfo } from '../../utils/format';

export default function PropertyCard({ property: p }) {
  const { favorites, toggleFavorite } = useStore();
  const fav = favorites.includes(p.id);

  return (
    <TiltCard className="pcard" intensity={8}>
      <Link to={`/property/${p.id}`} className="pcard-media">
        <SmartImage src={p.images?.[0]} alt={p.title} />
        <div className="pcard-tags">
          <span className={`badge ${statusInfo(p.status).badge}`}>{statusInfo(p.status).label}</span>
          {p.hot && <span className="badge badge-hot">Hot home</span>}
        </div>
      </Link>
      <button
        className="fav-btn"
        aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
        onClick={() => toggleFavorite(p.id)}
        style={{ color: fav ? '#d64545' : '#5d6b66' }}
      >
        {fav ? '♥' : '♡'}
      </button>
      <Link to={`/property/${p.id}`} className="pcard-body">
        <div className="pcard-price">{listingPrice(p)}</div>
        <div className="pcard-specs">
          <span><b>{p.beds}</b> bd</span>
          <span><b>{p.baths}</b> ba</span>
          <span><b>{Number(p.sqft).toLocaleString()}</b> sqft</span>
        </div>
        <div className="muted" style={{ fontSize: '.92rem' }}>{p.address}, {p.city}, {p.state}</div>
      </Link>
    </TiltCard>
  );
}
