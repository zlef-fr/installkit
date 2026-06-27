// Cloudflare Pages Function — GET /api/check?url=…
// Workers-compatible port of lib/check.js (no node: APIs). Lets the whole
// InstallKit demo, including the installability checker, run free & serverless
// on Cloudflare Pages. Deploy: connect the repo, build output dir = `public`.
//
// SSRF-hardened: every URL (and every redirect hop, and the manifest URL) is
// resolved via DNS-over-HTTPS and rejected if any A/AAAA address is loopback,
// private, link-local, ULA, IPv4-mapped-private, or cloud metadata. Redirects
// are followed manually so each Location is re-validated.
const UA = 'InstallKit-Checker/1.0 (+https://install.zlef.fr)';
const CORS = { 'access-control-allow-origin': '*' };
const MAX_HOPS = 5;

function isPrivateIp(ip) {
  ip = String(ip).toLowerCase().trim();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    if (/^(0|10|127)\./.test(ip) || /^192\.168\./.test(ip) || /^169\.254\./.test(ip)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
    if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return true; // CGNAT 100.64/10
    return false;
  }
  // Any "::"-prefixed address is special/reserved (loopback ::1, unspecified ::,
  // IPv4-mapped ::ffff:*, IPv4-compatible ::x) — global IPv6 is 2000::/3. Block all.
  if (ip.startsWith('::')) return true;
  if (/^fe[89ab]/.test(ip)) return true;              // fe80::/10 link-local
  if (/^f[cd]/.test(ip)) return true;                 // fc00::/7 unique-local
  return false;
}

function isIpLiteral(h) { return /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':'); }

// Resolve via Cloudflare DoH and reject if ANY address is non-public. DNS failures
// are treated as unsafe (fail closed) — these are public sites that must resolve.
async function assertPublicHost(host) {
  host = String(host).replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase(); // strip IPv6 brackets + trailing dot
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) throw new Error('Host not allowed');
  if (isIpLiteral(host)) { if (isPrivateIp(host)) throw new Error('Private address not allowed'); return; }
  let resolved = 0;
  for (const type of ['A', 'AAAA']) {
    let j;
    try {
      const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
      j = await r.json();
    } catch { throw new Error('Could not resolve host'); }
    for (const ans of (j.Answer || [])) {
      if (ans.type === 1 || ans.type === 28) { resolved++; if (isPrivateIp(ans.data)) throw new Error('Resolves to a private address'); }
    }
  }
  if (!resolved) throw new Error('Host does not resolve');
}

// Fetch with manual redirects; validate scheme + host on the initial URL and on
// every hop. Returns the final response body.
async function safeFetch(rawUrl, timeout = 8000) {
  let url = new URL(rawUrl);
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
    await assertPublicHost(url.hostname);
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    let r;
    try {
      r = await fetch(url.toString(), { signal: ctrl.signal, redirect: 'manual', headers: { 'user-agent': UA, accept: '*/*' }, cf: { cacheTtl: 0 } });
    } finally { clearTimeout(to); }
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      if (hop === MAX_HOPS) throw new Error('Too many redirects');
      url = new URL(r.headers.get('location'), url);
      continue;
    }
    return { ok: r.ok, status: r.status, body: await r.text(), finalUrl: url.toString() };
  }
  throw new Error('Too many redirects');
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
  const url = u.toString();

  const out = { url, https: url.startsWith('https://'), checks: [], manifest: null, installable: false, score: 0 };
  const add = (id, ok, label, detail) => out.checks.push({ id, ok, label, detail: detail || '' });
  add('https', out.https, 'Served over HTTPS', out.https ? '' : 'PWAs must be served over HTTPS (or localhost).');

  let page;
  try { page = await safeFetch(url); }
  catch (e) { add('reach', false, 'Page reachable', e.message); out.error = e.message; out.score = score(out); return out; }
  add('reach', page.ok, 'Page reachable', page.ok ? '' : `HTTP ${page.status}`);

  const href = findManifestHref(page.body);
  add('manifest-link', !!href, 'Manifest <link> present', href ? '' : 'Add <link rel="manifest" href="…"> in the <head>.');
  if (!href) { out.score = score(out); return out; }

  let man;
  try {
    const manUrl = new URL(href, page.finalUrl || url).toString();
    const mr = await safeFetch(manUrl);
    add('manifest-fetch', mr.ok, 'Manifest fetched', mr.ok ? '' : `HTTP ${mr.status}`);
    man = JSON.parse(mr.body);
    out.manifest = { url: manUrl };
  } catch (e) { add('manifest-fetch', false, 'Manifest fetched', e.message || 'Could not parse manifest JSON.'); out.score = score(out); return out; }

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
