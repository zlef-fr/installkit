// Optional anonymous funnel store — counts only, no PII. Used by the SDK's
// opt-in beacon and surfaced as per-site aggregates.
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';

mkdirSync('/app/data', { recursive: true });
const db = new Database('/app/data/install.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    day      TEXT NOT NULL,
    site     TEXT NOT NULL,
    action   TEXT NOT NULL,
    os       TEXT,
    browser  TEXT,
    ff       TEXT,
    n        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, site, action, os, browser, ff)
  );
`);

const ACTIONS = new Set(['prompt', 'accepted', 'dismissed', 'snooze', 'installed']);

const bump = db.prepare(`
  INSERT INTO events (day, site, action, os, browser, ff, n) VALUES (@day,@site,@action,@os,@browser,@ff,1)
  ON CONFLICT(day,site,action,os,browser,ff) DO UPDATE SET n = n + 1
`);

export function record(e) {
  if (!e || !ACTIONS.has(e.a)) return;
  const day = new Date().toISOString().slice(0, 10);
  const clip = (s, n) => (s == null ? '' : String(s).slice(0, n));
  bump.run({
    day, site: clip(e.site, 80) || 'unknown', action: e.a,
    os: clip(e.os, 16), browser: clip(e.browser, 24), ff: clip(e.ff, 12)
  });
}

const qStats = db.prepare(`
  SELECT action, os, browser, ff, SUM(n) AS n FROM events
  WHERE site = ? AND day >= ? GROUP BY action, os, browser, ff
`);

export function stats(site, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = qStats.all(site, since);
  const totals = {}; const byOs = {}; const byBrowser = {};
  for (const r of rows) {
    totals[r.action] = (totals[r.action] || 0) + r.n;
    if (r.action === 'prompt') {
      byOs[r.os || 'unknown'] = (byOs[r.os || 'unknown'] || 0) + r.n;
      byBrowser[r.browser || 'unknown'] = (byBrowser[r.browser || 'unknown'] || 0) + r.n;
    }
  }
  const prompts = totals.prompt || 0;
  const installs = (totals.accepted || 0) + (totals.installed || 0);
  return {
    site, days, totals,
    rate: prompts ? Math.round((installs / prompts) * 100) : 0,
    byOs, byBrowser
  };
}
