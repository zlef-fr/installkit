/* InstallKit landing — i18n, live detection readout, feature/matrix render,
   copy buttons, installability checker, language picker, scroll reveals, SW. */
import { I18N, LANGS } from './i18n.js?v=4';

const lang = (() => {
  const ck = (document.cookie.match(/(?:^|;\s*)zl-lang=([^;]+)/) || [])[1];
  if (ck && I18N[ck]) return ck;
  const n = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return I18N[n] ? n : 'en';
})();
const T = I18N[lang];
const t = (k) => (T[k] != null ? T[k] : (I18N.en[k] || k));

document.documentElement.lang = lang;
document.querySelectorAll('[data-i18n]').forEach((el) => {
  const k = el.getAttribute('data-i18n');
  if (k.endsWith('_html')) {                       // hero <h1> carries safe markup
    const key = k.replace('_html', '');
    if (T[key] || I18N.en[key]) el.innerHTML = t(key);
    return;
  }
  if (T[k] || I18N.en[k]) el.textContent = t(k);
});

/* language picker — DA: 3+ locales → one global flag + native-name dropdown */
(function buildLangPick() {
  const host = document.getElementById('langpick');
  if (!host) return;
  const sel = document.createElement('select');
  sel.className = 'zl-langpick';
  sel.setAttribute('aria-label', 'Language');
  LANGS.forEach(([code, flag, native]) => {
    const o = document.createElement('option');
    o.value = code; o.textContent = flag + '  ' + native;
    if (code === lang) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    document.cookie = 'zl-lang=' + sel.value + ';path=/;domain=.zlef.fr;max-age=31536000;samesite=lax';
    location.reload();
  });
  host.appendChild(sel);
})();


/* features */
const FEAT = [
  ['device', 'f1t', 'f1b'], ['inapp', 'f2t', 'f2b'], ['native', 'f3t', 'f3b'],
  ['honest', 'f4t', 'f4b'], ['theme', 'f5t', 'f5b'], ['i18n', 'f6t', 'f6b']
];
const FIC = {
  device: '<path d="M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M11 19h2"/>',
  inapp: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  native: '<path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 20h14"/>',
  honest: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  i18n: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'
};
const cardsEl = document.getElementById('cards');
FEAT.forEach(([ic, tk, bk]) => {
  const d = document.createElement('div'); d.className = 'fcard reveal';
  d.innerHTML = `<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${FIC[ic]}</svg></div>
    <h3></h3><p></p>`;
  d.querySelector('h3').textContent = t(tk);
  d.querySelector('p').textContent = t(bk);
  cardsEl.appendChild(d);
});

/* matrix */
const MATRIX = [
  ['🍏', 'iPhone · Safari', 'Share → Add to Home Screen', 'manual'],
  ['🍏', 'iPad · Safari', 'Share (toolbar) → Add to Home Screen', 'manual'],
  ['🍏', 'iPhone · Chrome / Edge', 'Share → Add to Home Screen', 'manual'],
  ['🦊', 'iOS · Firefox', 'Redirects to Safari (no A2HS)', 'redir'],
  ['🤖', 'Android · Chrome / Brave', 'One-tap prompt · menu fallback', 'native'],
  ['🤖', 'Android · Samsung Internet', 'Menu → Add page to → Home screen', 'manual'],
  ['🦊', 'Android · Firefox', 'Menu → Add to Home screen', 'manual'],
  ['🖥️', 'Desktop · Chrome / Edge', 'Install icon · one-tap prompt', 'native'],
  ['🍎', 'macOS · Safari', 'Share → Add to Dock', 'manual'],
  ['🦊', 'Desktop · Firefox', 'Not supported — told honestly', 'unsup'],
  ['📱', 'In-app browsers', 'Open in real browser first', 'redir'],
  ['✅', 'Already installed', 'Widget stays hidden', 'installed']
];
const TAGCLS = { native: 'tag-native', manual: 'tag-manual', redir: 'tag-redir', unsup: 'tag-redir', installed: 'tag-native' };
const TAGTXT = { native: 'm_native', manual: 'm_manual', redir: 'm_redir', unsup: 'm_unsup', installed: 'm_installed' };
const mg = document.getElementById('matrix-grid');
MATRIX.forEach(([em, plat, path, tag]) => {
  const d = document.createElement('div'); d.className = 'mrow reveal';
  d.innerHTML = `<div class="plat"><span class="em">${em}</span><span></span></div><div class="path"></div><span class="tag ${TAGCLS[tag]}"></span>`;
  d.querySelector('.plat span:last-child').textContent = plat;
  d.querySelector('.path').textContent = path;
  d.querySelector('.tag').textContent = t(TAGTXT[tag]);
  mg.appendChild(d);
});

/* live detection */
function methodKey(m) {
  if (m === 'native' || m === 'native-or-manual') return ['m_native', 'verdict_native'];
  if (m === 'open-in-browser') return ['m_redir', 'verdict_redir'];
  if (m === 'unsupported' || m === 'unsupported-ios') return ['m_unsup', 'verdict_unsup'];
  if (m === 'installed') return ['m_installed', 'verdict_installed'];
  return ['m_manual', 'verdict_manual'];
}
function paint(env) {
  document.getElementById('dDevice').textContent = env.osLabel + (env.formFactor === 'tablet' ? '' : '');
  document.getElementById('dBrowser').textContent = env.browserLabel;
  const [mk, vk] = methodKey(env.method);
  document.getElementById('dMethod').textContent = t(mk);
  document.getElementById('dVerdict').innerHTML = t(vk).replace('{browser}', env.browserLabel);
}
function waitForIK(cb, tries = 40) {
  if (window.InstallKit) return cb(window.InstallKit);
  if (tries <= 0) return;
  setTimeout(() => waitForIK(cb, tries - 1), 50);
}
waitForIK((IK) => {
  try { paint(IK.env()); } catch {}
  IK.on('available', () => { try { paint(IK.env()); } catch {} });
  document.getElementById('tryBtn').addEventListener('click', () => IK.open());
});

/* copy buttons */
function wireCopy(btnId, text) {
  const b = document.getElementById(btnId);
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); } catch {}
    const o = b.textContent; b.textContent = t('copied');
    setTimeout(() => { b.textContent = o; }, 1600);
  });
}
wireCopy('copyHero', `<script src="https://install.zlef.fr/v1/install-kit.js" data-app-name="Your App"><\/script>`);
wireCopy('copyFull', `<script>window.__ik=window.__ik||{};addEventListener('beforeinstallprompt',e=>{e.preventDefault();__ik.deferred=e},{once:true});<\/script>\n<script src="https://install.zlef.fr/v1/install-kit.js" data-app-name="Your App" data-position="bottom-right" data-accent="#9dae50"><\/script>`);
wireCopy('copyCdn', `<script src="https://cdn.jsdelivr.net/gh/zlef-fr/installkit@v1.0.1/public/v1/install-kit.js" data-app-name="Your App"><\/script>`);

/* checker */
const ckBtn = document.getElementById('ckBtn');
const ckUrl = document.getElementById('ckUrl');
const ckRes = document.getElementById('ckResult');
function ring(score) {
  const c = 2 * Math.PI * 24;
  const col = score >= 80 ? 'var(--zl-success)' : score >= 50 ? 'var(--zl-warning)' : 'var(--zl-danger)';
  return `<svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="var(--zl-line)" stroke-width="6"/>
    <circle cx="29" cy="29" r="24" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - score / 100)}" transform="rotate(-90 29 29)"/>
    <text x="29" y="33" text-anchor="middle" font-size="15" font-weight="700" fill="var(--zl-text)">${score}</text></svg>`;
}
async function runCheck() {
  const url = ckUrl.value.trim();
  if (!url) return;
  ckRes.innerHTML = `<div class="score"><div class="spinner"></div><div><div class="st">${t('ck_checking')}</div></div></div>`;
  try {
    const r = await fetch('/api/check?url=' + encodeURIComponent(url));
    const d = await r.json();
    if (!r.ok || d.error) { ckRes.innerHTML = `<div class="chk fail"><div class="ci">!</div><div><div class="cl">${t('ck_err')}</div><div class="cd">${d.error || ''}</div></div></div>`; return; }
    const verdict = d.installable ? t('ck_installable') : (d.score >= 60 ? t('ck_almost') : t('ck_not'));
    let html = `<div class="score">${ring(d.score)}<div><div class="st">${verdict}</div><div class="ss">${d.manifest && d.manifest.name ? d.manifest.name : d.url}</div></div></div><div class="checks">`;
    d.checks.forEach((c) => {
      html += `<div class="chk ${c.ok ? 'pass' : 'fail'}"><div class="ci">${c.ok ? '✓' : '✕'}</div><div><div class="cl">${esc(c.label)}</div>${c.detail ? `<div class="cd">${esc(c.detail)}</div>` : ''}</div></div>`;
    });
    html += '</div>';
    ckRes.innerHTML = html;
  } catch (e) {
    ckRes.innerHTML = `<div class="chk fail"><div class="ci">!</div><div class="cl">${t('ck_err')}</div></div>`;
  }
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
ckBtn.addEventListener('click', runCheck);
ckUrl.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCheck(); });

/* scroll reveal */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* SW (dogfood install) */
if ('serviceWorker' in navigator) {
  // If a SW already controls the page, auto-reload once when a new one takes over
  // so a content update is never pinned behind a stale cached shell.
  if (navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return; reloaded = true; location.reload();
    });
  }
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
