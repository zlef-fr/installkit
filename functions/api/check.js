// Cloudflare Pages Function — GET /api/check?url=…
// Workers-compatible port of lib/check.js (no node: APIs). Lets the whole
// InstallKit demo, including the installability checker, run free & serverless
// on Cloudflare Pages. Deploy: connect the repo, build output dir = `public`.
const UA = 'InstallKit-Checker/1.0 (+https://install.zlef.fr)';
const CORS = { 'access-control-allow-origin': '*' };

function blockedHost(host) {
  host = (host || '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (/^(127|10|0)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  }
  return false;
}

async function fetchText(url, timeout = 8000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', cf: { cacheTtl: 0 } });
    return { ok: r.ok, status: r.status, body: await r.text(), finalUrl: r.url };
  } finally { clearTimeout(to); }
}

function findManifestHref(html) {
  const m = html.match(/<link[^>]+rel=["']?manifest["']?[^>]*>/i);
  if (!m) return null;
  const href = m[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

async function checkSite(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
  if (blockedHost(u.hostname)) throw new Error('Host not allowed');
  const url = u.toString();

  const out = { url, https: url.startsWith('https://'), checks: [], manifest: null, installable: false, score: 0 };
  const add = (id, ok, label, detail) => out.checks.push({ id, ok, label, detail: detail || '' });
  add('https', out.https, 'Served over HTTPS', out.https ? '' : 'PWAs must be served over HTTPS (or localhost).');

  let page;
  try { page = await fetchText(url); }
  catch (e) { add('reach', false, 'Page reachable', e.message); out.error = e.message; out.score = score(out); return out; }
  add('reach', page.ok, 'Page reachable', page.ok ? '' : `HTTP ${page.status}`);

  const href = findManifestHref(page.body);
  add('manifest-link', !!href, 'Manifest <link> present', href ? '' : 'Add <link rel="manifest" href="…"> in the <head>.');
  if (!href) { out.score = score(out); return out; }

  let manUrl;
  try { manUrl = new URL(href, page.finalUrl || url); if (blockedHost(manUrl.hostname)) throw new Error('Manifest host not allowed'); manUrl = manUrl.toString(); }
  catch (e) { add('manifest-fetch', false, 'Manifest fetched', e.message); out.score = score(out); return out; }

  let man;
  try {
    const mr = await fetchText(manUrl);
    add('manifest-fetch', mr.ok, 'Manifest fetched', mr.ok ? '' : `HTTP ${mr.status}`);
    man = JSON.parse(mr.body);
    out.manifest = { url: manUrl };
  } catch { add('manifest-fetch', false, 'Manifest valid JSON', 'Could not parse manifest JSON.'); out.score = score(out); return out; }

  const name = man.name || man.short_name;
  add('name', !!name, 'Has a name', name ? `“${name}”` : 'Set "name" or "short_name".');
  out.manifest.name = name || null;

  const display = man.display || 'browser';
  const okDisplay = ['standalone', 'fullscreen', 'minimal-ui'].includes(display) ||
    (Array.isArray(man.display_override) && man.display_override.some(d => ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].includes(d)));
  add('display', okDisplay, 'App-like display mode', okDisplay ? `“${display}”` : `display is “${display}” — use standalone/fullscreen/minimal-ui.`);

  const icons = Array.isArray(man.icons) ? man.icons : [];
  const sizes = icons.flatMap(i => String(i.sizes || '').split(/\s+/));
  const has192 = sizes.some(s => parseInt(s) >= 192);
  const has512 = sizes.some(s => parseInt(s) >= 512);
  add('icon-192', has192, 'Has a 192px+ icon', has192 ? '' : 'Add an icon ≥192×192.');
  add('icon-512', has512, 'Has a 512px+ icon', has512 ? '' : 'Add an icon ≥512×512 (used for splash).');
  out.manifest.icons = icons.length;

  add('start', !!man.start_url, 'Has a start_url', man.start_url ? man.start_url : 'Set "start_url".');

  const swHint = /serviceworker|navigator\.serviceworker|workbox|sw\.js/i.test(page.body);
  add('sw', swHint, 'Service worker referenced', swHint ? 'Detected a registration hint (verify it controls the page).' : 'No registration found in HTML — offline support needs a service worker.');

  out.installable = out.https && !!name && okDisplay && has192 && has512 && !!man.start_url;
  out.score = score(out);
  return out;
}

function score(out) {
  const passed = out.checks.filter(c => c.ok).length;
  return out.checks.length ? Math.round((passed / out.checks.length) * 100) : 0;
}

export async function onRequestGet({ request }) {
  const url = String(new URL(request.url).searchParams.get('url') || '').trim();
  if (!url) return Response.json({ error: 'url required' }, { status: 400, headers: CORS });
  try { return Response.json(await checkSite(url), { headers: CORS }); }
  catch (e) { return Response.json({ error: e.message || 'Check failed' }, { status: 400, headers: CORS }); }
}
