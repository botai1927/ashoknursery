import type express from 'express';
import fs from 'fs';
import path from 'path';
import { adminFirestore, withTimeout, WORKSPACE_ROOT } from './firebaseAdmin.ts';

function xmlEscape(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function extractCatalogPlantIds(
  catalogPath = path.join(WORKSPACE_ROOT, 'src', 'data', 'brahmyamanCatalog.ts')
): string[] {
  try {
    const raw = fs.readFileSync(catalogPath, 'utf8');
    const seen = new Set<string>();
    const matches = raw.matchAll(/^\s*id:\s*['"]([a-zA-Z0-9_-]+)['"]/gm);
    for (const m of matches) {
      const id = m[1].trim();
      if (id && !id.startsWith('opt-')) {
        seen.add(id);
      }
    }
    return Array.from(seen);
  } catch {
    return [];
  }
}

export function buildRobotsTxt(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${cleanBase}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSitemapXml(
  baseUrl: string,
  plantIds: string[],
  lastmodIso = new Date().toISOString().slice(0, 10)
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const viewUrls: Array<{ loc: string; priority: string; changefreq: string }> = [
    { loc: `${cleanBase}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${cleanBase}/?view=offers`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${cleanBase}/?view=care`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${cleanBase}/?view=reviews`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${cleanBase}/?view=location`, priority: '0.8', changefreq: 'monthly' },
  ];

  const plantUrls = plantIds.map((id) => ({
    loc: `${cleanBase}/?plant=${encodeURIComponent(id)}`,
    priority: '0.9',
    changefreq: 'weekly',
  }));

  const rows = [...viewUrls, ...plantUrls]
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${xmlEscape(lastmodIso)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>
`;
}

function resolveRequestOrigin(req: express.Request): string {
  const forwardedProto = String(req.header('x-forwarded-proto') || '').split(',')[0].trim();
  const proto = forwardedProto === 'https' || forwardedProto === 'http' ? forwardedProto : req.protocol || 'https';
  const host = String(req.get('host') || 'brahmyaman.store').replace(/[^a-zA-Z0-9.:-]/g, '');
  return `${proto}://${host}`;
}

export function registerSeoRoutes(app: express.Application) {
  const staticSeedIds = extractCatalogPlantIds();
  let cachedPlantIds: string[] = staticSeedIds;
  let lastRefreshMs = 0;

  async function getActivePlantIdsForSitemap(): Promise<string[]> {
    const now = Date.now();
    if (now - lastRefreshMs < 5 * 60_000 && cachedPlantIds.length > 0) {
      return cachedPlantIds;
    }

    const merged = new Set<string>(staticSeedIds);
    try {
      const snap = await withTimeout(
        adminFirestore.collection('plants').select('status').get(),
        2500,
        'Sitemap plant list fetch timeout'
      );
      snap.docs.forEach((d) => {
        const st = d.get('status');
        if (st !== 'trashed' && d.id) {
          merged.add(d.id);
        }
      });
    } catch {
      // Static catalog fallback if Firestore Admin credentials unavailable locally
    }

    cachedPlantIds = Array.from(merged);
    lastRefreshMs = now;
    return cachedPlantIds;
  }

  app.get('/robots.txt', (req, res) => {
    const origin = resolveRequestOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(buildRobotsTxt(origin));
  });

  app.get('/sitemap.xml', async (req, res) => {
    const origin = resolveRequestOrigin(req);
    const ids = await getActivePlantIdsForSitemap();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(buildSitemapXml(origin, ids));
  });
}
