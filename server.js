import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkSite } from './lib/check.js';
import { record, stats } from './lib/store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 10073;

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

// --- naive per-IP rate limit for the public checker ---
const hits = new Map();
function limit(max, windowMs) {
  return (req, res, next) => {
    const ip = (req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip || '').trim();
    const k = ip + ':' + req.path;
    const now = Date.now();
    const e = hits.get(k) || { n: 0, t: now };
    if (now - e.t > windowMs) { e.n = 0; e.t = now; }
    e.n++; hits.set(k, e);
    if (e.n > max) return res.status(429).json({ error: 'Too many requests, slow down a moment.' });
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, e] of hits) if (now - e.t > 3600000) hits.delete(k); }, 600000).unref();

// --- SDK bundle: cross-origin embeddable, cacheable ---
app.get(['/v1/install-kit.js', '/sdk.js'], (req, res) => {
  res.sendFile(join(__dirname, 'public', 'v1', 'install-kit.js'), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400'
    }
  });
});

// --- anonymous opt-in funnel beacon (CORS open; counts only) ---
app.options('/api/event', cors);
app.post('/api/event', cors, limit(600, 60000), (req, res) => {
  try { record(req.body || {}); } catch {}
  res.status(204).end();
});
app.get('/api/stats', limit(120, 60000), (req, res) => {
  const site = String(req.query.site || '').slice(0, 80);
  if (!site) return res.status(400).json({ error: 'site required' });
  res.json(stats(site, Math.min(parseInt(req.query.days) || 30, 90)));
});
function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'content-type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}

// --- installability checker (powers the landing tool) ---
app.get('/api/check', limit(20, 60000), async (req, res) => {
  const url = String(req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url required' });
  try { res.json(await checkSite(url)); }
  catch (e) { res.status(400).json({ error: e.message || 'Check failed' }); }
});

app.get('/healthz', (_, res) => res.json({ ok: true }));

// --- static landing (dogfoods the widget + is itself installable) ---
app.use(express.static(join(__dirname, 'public'), {
  setHeaders(res, p) {
    if (p.endsWith('.webmanifest')) res.set('Content-Type', 'application/manifest+json');
    if (p.endsWith('sw.js')) res.set('Cache-Control', 'no-cache');
  }
}));

app.listen(PORT, '0.0.0.0', () => console.log(`InstallKit on http://0.0.0.0:${PORT}`));
