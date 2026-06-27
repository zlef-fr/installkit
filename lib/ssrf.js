// Minimal SSRF guard for the public installability checker: only http(s),
// public hostnames, no IP-literals to private ranges.
import { lookup } from 'node:dns/promises';

export function isPrivateIp(ip) {
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
  if (/^fe[89ab]/.test(ip)) return true;                           // fe80::/10 link-local
  if (/^f[cd]/.test(ip)) return true;                              // fc00::/7 unique-local
  return false;
}

export async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
  const host = u.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase(); // strip IPv6 brackets + trailing dot
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) throw new Error('Host not allowed');
  // IP literals (v4 or v6) are checked directly, never via DNS
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) {
    if (isPrivateIp(host)) throw new Error('Private address not allowed');
    return u.toString();
  }
  try {
    const recs = await lookup(host, { all: true });
    if (!recs.length) throw new Error('Host does not resolve');
    for (const r of recs) if (isPrivateIp(r.address)) throw new Error('Resolves to a private address');
  } catch (e) {
    if (/private|resolve/.test(e.message)) throw e; // re-throw our own; ignore transient DNS hiccups
  }
  return u.toString();
}
