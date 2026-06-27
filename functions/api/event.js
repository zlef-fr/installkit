// Cloudflare Pages Function — POST /api/event  (optional anonymous funnel beacon)
// No PII; counts only. Persists to a KV namespace if one is bound as `IK_STATS`,
// otherwise it's a no-op 204 (the widget never depends on this).
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS'
};
const ACTIONS = new Set(['prompt', 'accepted', 'dismissed', 'snooze', 'installed']);

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const e = await request.json();
    if (env.IK_STATS && e && ACTIONS.has(e.a)) {
      const day = new Date().toISOString().slice(0, 10);
      const clip = (s, n) => (s == null ? '' : String(s).slice(0, n));
      const key = ['ik', day, clip(e.site, 80) || 'unknown', e.a, clip(e.os, 16), clip(e.browser, 24), clip(e.ff, 12)].join('|');
      const cur = parseInt((await env.IK_STATS.get(key)) || '0', 10);
      await env.IK_STATS.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 24 * 120 });
    }
  } catch { /* ignore */ }
  return new Response(null, { status: 204, headers: CORS });
}
