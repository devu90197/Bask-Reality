const META_IMAGE = [
  /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/i,
  /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  /<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp|avif)[^"']*)["']/i,
];

// Turns any pasted link into a direct image URL: image links pass through,
// web pages are scanned for their preview (og:image) photo.
export async function resolveImage(rawUrl) {
  const target = new URL(rawUrl || '');
  if (!/^https?:$/.test(target.protocol)) throw new Error('Only http(s) links are supported');

  const r = await fetch(target, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', Accept: 'text/html,image/*,*/*' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`The site returned ${r.status}`);
  if ((r.headers.get('content-type') || '').startsWith('image/')) return r.url;

  const html = (await r.text()).slice(0, 600000);
  for (const re of META_IMAGE) {
    const m = html.match(re);
    if (m) return new URL(m[1].replace(/&amp;/g, '&'), r.url).href;
  }
  throw new Error('No photo found on that page');
}
