import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import PropertyCard from '../components/ui/PropertyCard';
import PageHero from '../components/ui/PageHero';
import MapEmbed from '../components/ui/MapEmbed';
import Select from '../components/ui/Select';
import { getCurrency } from '../utils/format';

const TYPES = ['House', 'Condo', 'Apartment', 'Villa', 'Townhouse', 'Multi-family', 'Land'];

const COPY = {
  sale: { eyebrow: 'Homes for sale', title: 'Find your dream home', noun: 'homes' },
  rent: { eyebrow: 'Rentals', title: 'Find your next rental', noun: 'rentals' },
  lease: { eyebrow: 'Leases', title: 'Find a property to lease', noun: 'lease listings' },
};

const NO_FILTERS = { min: '', max: '', beds: 0, baths: 0, types: [] };

const SORTERS = {
  newest: (a, b) => b.createdAt - a.createdAt,
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
  sqft: (a, b) => (Number(b.sqft) || 0) - (Number(a.sqft) || 0),
};

export default function Search({ status }) {
  const { properties, ready, track } = useStore();
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState(NO_FILTERS);

  const q = params.get('q') || '';
  const { code, rate } = getCurrency();
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const toggleType = (t) => set('types', filters.types.includes(t) ? filters.types.filter((x) => x !== t) : [...filters.types, t]);

  const activeCount = [filters.min, filters.max].filter(Boolean).length
    + (filters.beds ? 1 : 0) + (filters.baths ? 1 : 0) + filters.types.length;

  // Lock page scroll while the mobile filter drawer is open.
  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // Min/max are typed in the display currency; listings are stored in INR.
    const local = (p) => Number(p.price) * rate;
    return properties
      .filter((p) =>
        p.status === status &&
        (!needle || `${p.address} ${p.city} ${p.state} ${p.zip} ${p.title}`.toLowerCase().includes(needle)) &&
        (!filters.min || local(p) >= Number(filters.min)) &&
        (!filters.max || local(p) <= Number(filters.max)) &&
        (Number(p.beds) || 0) >= filters.beds &&
        (Number(p.baths) || 0) >= filters.baths &&
        (!filters.types.length || filters.types.includes(p.type)))
      .sort(SORTERS[sort]);
  }, [properties, status, q, filters, sort, rate]);

  // A search a signed-in client settles on (no changes for 1.5s) goes into their history.
  useEffect(() => {
    const parts = [
      filters.min && `from ${code} ${Number(filters.min).toLocaleString()}`,
      filters.max && `up to ${code} ${Number(filters.max).toLocaleString()}`,
      filters.beds && `${filters.beds}+ beds`,
      filters.baths && `${filters.baths}+ baths`,
      filters.types.length && filters.types.join(', '),
    ].filter(Boolean);
    if (!q.trim() && !parts.length) return undefined;
    const t = setTimeout(() => track('search', { status, q: q.trim(), filters: parts.join(', ') }), 1500);
    return () => clearTimeout(t);
  }, [q, filters, status, code, track]);

  const copy = COPY[status];
  const anyListed = properties.some((p) => p.status === status);

  const segment = (key, options) => (
    <div className={`fp-seg ${options.length === 4 ? 'four' : ''}`} role="group">
      {options.map((n) => (
        <button key={n} type="button" className={filters[key] === n ? 'active' : ''} aria-pressed={filters[key] === n} onClick={() => set(key, n)}>
          {n ? `${n}+` : 'Any'}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHero
        eyebrow={<><span className="live-dot" />Live · {copy.eyebrow}</>}
        title={copy.title}
        text={ready ? `${results.length} ${copy.noun} available${q ? ` for “${q}”` : ''}, updated in real time.` : 'Loading live listings…'}
      >
        <form className="search-box" onSubmit={(e) => e.preventDefault()}>
          <input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} placeholder="City, address or ZIP" aria-label="Search" />
          <button className="btn btn-primary">Search</button>
        </form>
      </PageHero>

      <div className="container">
        <div className="results-bar">
          <div className="results-count">
            <b>{results.length}</b> {copy.noun}{q && <> in “{q}”</>}
          </div>
          <div className="results-actions">
            <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setPanelOpen(true)}>
              ☰ Filters{activeCount > 0 && ` (${activeCount})`}
            </button>
            <div className="view-toggle" role="group" aria-label="View">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Grid</button>
              <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map</button>
            </div>
            <Select ariaLabel="Sort by" size="sm" value={sort} onChange={setSort} options={[
              { value: 'newest', label: 'Sort: Newest' },
              { value: 'low', label: 'Price: Low to high' },
              { value: 'high', label: 'Price: High to low' },
              { value: 'sqft', label: 'Size: Largest' },
            ]} />
          </div>
        </div>
      </div>

      <div className="container search-layout">
        {panelOpen && <div className="filter-backdrop" onClick={() => setPanelOpen(false)} />}
        <aside className={`filter-panel ${panelOpen ? 'open' : ''}`} aria-label="Filters">
          <div className="fp-head">
            <h3>Filters {activeCount > 0 && <span className="count">{activeCount}</span>}</h3>
            <div>
              <button className="fp-link" disabled={!activeCount} onClick={() => setFilters(NO_FILTERS)}>Clear all</button>
              <button className="fp-link filters-toggle" aria-label="Close filters" onClick={() => setPanelOpen(false)}>✕</button>
            </div>
          </div>

          <div className="fp-body">
            <div className="fp-section">
              <div className="fp-title">Price ({code}{status !== 'sale' ? ' / month' : ''})</div>
              <div className="fp-range">
                <input className="input" type="number" min="0" inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={filters.min} onChange={(e) => set('min', e.target.value)} />
                <span>–</span>
                <input className="input" type="number" min="0" inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={filters.max} onChange={(e) => set('max', e.target.value)} />
              </div>
            </div>

            <div className="fp-section">
              <div className="fp-title">Bedrooms</div>
              {segment('beds', [0, 1, 2, 3, 4])}
            </div>

            <div className="fp-section">
              <div className="fp-title">Bathrooms</div>
              {segment('baths', [0, 1, 2, 3])}
            </div>

            <div className="fp-section">
              <div className="fp-title">Property type</div>
              <div className="fp-checks">
                {TYPES.map((t) => (
                  <label key={t} className="fp-check">
                    <input type="checkbox" checked={filters.types.includes(t)} onChange={() => toggleType(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="fp-foot">
            <button className="btn btn-primary btn-block" onClick={() => setPanelOpen(false)}>Show {results.length} results</button>
          </div>
        </aside>

        <section aria-label="Results">
          {view === 'map' && (
            <div style={{ marginBottom: 24 }}>
              <MapEmbed query={q || (results[0] && `${results[0].city}, ${results[0].state}`) || 'India'} height={380} zoom={q || results[0] ? 12 : 4} />
            </div>
          )}

          {results.length ? (
            <motion.div layout className="grid grid-auto">
              <AnimatePresence>
                {results.map((p) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.94, rotateX: -12 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.94 }}>
                    <PropertyCard property={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="card empty">
              <h3>{!ready ? 'Loading…' : anyListed ? 'No listings match these filters' : `No ${copy.noun} listed yet`}</h3>
              <p style={{ margin: 0 }}>{anyListed ? 'Try widening the price range or clearing some filters.' : 'New listings appear here instantly as soon as they are published.'}</p>
              {anyListed && activeCount > 0 && <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setFilters(NO_FILTERS)}>Clear all filters</button>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
