// Minimal SSRF guard for the public installability checker: only http(s),
// public hostnames, no IP-literals to private ranges.
import { lookup } from 'node:dns/promises';

function isPrivateIp(ip) {
  if (/^127\./.test(ip) || ip === '0.0.0.0' || /^10\./.test(ip) || /^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;            // link-local
  if (/^::1$|^fe80:|^fc00:|^fd/i.test(ip)) return true; // ipv6 loopback/local
  return false;
}

export async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
  const host = u.hostname;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Host not allowed');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && isPrivateIp(host)) throw new Error('Private address not allowed');
  try {
    const recs = await lookup(host, { all: true });
    for (const r of recs) if (isPrivateIp(r.address)) throw new Error('Resolves to a private address');
  } catch (e) {
    if (/private/.test(e.message)) throw e; // re-throw our own; ignore DNS hiccups
  }
  return u.toString();
}
