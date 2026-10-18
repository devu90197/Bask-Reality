// Real interactive Google map for an address or area (no API key needed for the basic embed).
export default function MapEmbed({ query, height = 300, zoom = 15 }) {
  if (!query) return null;
  return (
    <iframe
      title={`Map of ${query}`}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`}
      style={{ width: '100%', height, border: 0, borderRadius: 'var(--radius)', display: 'block' }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
