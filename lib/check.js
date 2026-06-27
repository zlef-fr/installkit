// Installability checker — fetch a page, find + validate its web app manifest,
// and report whether it meets the baseline PWA-install criteria. Server-side
// best-effort (a service worker can't be fully verified remotely, but HTTPS +
// a valid manifest + icons is what every engine requires first).
import { assertPublicUrl } from './ssrf.js';

const UA = 'InstallKit-Checker/1.0 (+https://install.zlef.fr)';

async function fetchText(url, timeout = 8000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' });
    const body = await r.text();
    return { ok: r.ok, status: r.status, body, finalUrl: r.url, type: r.headers.get('content-type') || '' };
  } finally { clearTimeout(to); }
}

function findManifestHref(html) {
  const m = html.match(/<link[^>]+rel=["']?manifest["']?[^>]*>/i);
  if (!m) return null;
  const href = m[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

export async function checkSite(rawUrl) {
  const url = await assertPublicUrl(rawUrl);
  const out = { url, https: url.startsWith('https://'), checks: [], manifest: null, installable: false, score: 0 };
  const add = (id, ok, label, detail) => out.checks.push({ id, ok, label, detail: detail || '' });

  add('https', out.https, 'Served over HTTPS', out.https ? '' : 'PWAs must be served over HTTPS (or localhost).');

  let page;
  try { page = await fetchText(url); }
  catch (e) { add('reach', false, 'Page reachable', e.message); out.error = e.message; return out; }
  add('reach', page.ok, 'Page reachable', page.ok ? '' : `HTTP ${page.status}`);

  const href = findManifestHref(page.body);
  add('manifest-link', !!href, 'Manifest <link> present', href ? '' : 'Add <link rel="manifest" href="…"> in the <head>.');
  if (!href) { out.installable = false; out.score = score(out); return out; }

  let manUrl;
  try { manUrl = new URL(href, page.finalUrl || url).toString(); await assertPublicUrl(manUrl); }
  catch (e) { add('manifest-fetch', false, 'Manifest fetched', e.message); return out; }

  let man;
  try {
    const mr = await fetchText(manUrl);
    add('manifest-fetch', mr.ok, 'Manifest fetched', mr.ok ? '' : `HTTP ${mr.status}`);
    man = JSON.parse(mr.body);
    out.manifest = { url: manUrl };
  } catch (e) {
    add('manifest-fetch', false, 'Manifest valid JSON', 'Could not parse manifest JSON.');
    return out;
  }

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

  // service worker hint — look for a registration call in the HTML (best-effort)
  const swHint = /serviceworker|navigator\.serviceworker|workbox|sw\.js/i.test(page.body);
  add('sw', swHint, 'Service worker referenced', swHint ? 'Detected a registration hint (verify it controls the page).' : 'No registration found in HTML — offline support needs a service worker.');

  out.installable = out.https && !!name && okDisplay && has192 && has512 && !!man.start_url;
  out.score = score(out);
  return out;
}

function score(out) {
  const passed = out.checks.filter(c => c.ok).length;
  return Math.round((passed / out.checks.length) * 100);
}
