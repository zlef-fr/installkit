/* InstallKit landing — i18n, live detection readout, feature/matrix render,
   copy buttons, installability checker, scroll reveals, SW registration. */

const I18N = {
  en: {
    nav_how: 'How it works', nav_matrix: 'Coverage', nav_docs: 'Docs', nav_check: 'Check my site',
    hero_pill: 'One script tag · zero dependencies',
    hero_lede: 'InstallKit detects the real device and browser, then shows the precise steps to add your web app to the home screen — a native one-tap prompt where it’s supported, accurate manual instructions everywhere else.',
    hero_try: 'Show me my instructions', hero_docs: 'Get the snippet', copy: 'Copy', copied: 'Copied ✓',
    det_device: 'Device', det_browser: 'Browser', det_method: 'Install path', det_loading: 'Detecting your device…',
    verdict_native: 'Your browser supports a <b>native one-tap install</b>. The widget shows an Install button.',
    verdict_manual: 'Your browser needs <b>manual steps</b> — InstallKit shows the exact taps for {browser}.',
    verdict_redir: 'You’re in an in-app browser. InstallKit tells visitors to <b>open in their real browser</b> first.',
    verdict_unsup: 'This browser <b>can’t install web apps</b>. InstallKit says so honestly and suggests an alternative.',
    verdict_installed: 'This site is <b>already installed</b> on your device. InstallKit stays hidden.',
    how_eye: 'Why InstallKit', how_h2: 'Most install prompts are wrong half the time',
    how_p: 'Generic “Add to Home Screen” banners show iPhone steps to Android users and vice-versa. InstallKit gets the details right — including the cases other widgets ignore.',
    mx_eye: 'Coverage', mx_h2: 'The exact path, per platform',
    mx_p: 'A native prompt when the browser supports it; the real, current manual steps when it doesn’t; and an honest redirect when installing simply isn’t possible.',
    dc_eye: 'Integration', dc_h2: 'Drop in, then tune it', dc_p: 'Works as-is with one tag. Configure it with data-attributes or the JS API.',
    dc_recommended: 'recommended — capture the prompt early', dc_attrs: 'data-* attributes', dc_default: 'Default', dc_what: 'What it does', dc_api: 'JavaScript API',
    a_app: "Your app's name, used throughout the copy.", a_icon: 'URL of a square icon shown in the sheet header.',
    a_pos: 'Launcher position: bottom-right / -left / -center / inline.', a_accent: 'Accent colour (any CSS colour) to match your brand.',
    a_theme: 'auto / dark / light.', a_mode: 'auto shows a launcher; manual = you call InstallKit.open().',
    a_delay: 'ms before the launcher appears.', a_remind: 'Days to stay hidden after a visitor dismisses it.', a_an: 'Opt-in anonymous funnel (counts only, no PII).',
    api_open: 'Open the install sheet on demand (e.g. from your own button).', api_can: 'true unless already installed or unsupported.',
    api_env: 'The full detection object (os, browser, method…).', api_on: 'Events: ready, open, close, choice, installed, dismiss.', api_cfg: 'Override config at runtime.',
    ck_eye: 'Free tool', ck_h2: 'Is your site installable?', ck_p: 'We fetch your page and manifest and check it against the baseline every browser requires before it will offer an install.',
    ck_btn: 'Check', ck_checking: 'Checking…', ck_installable: 'Installable', ck_almost: 'Almost there', ck_not: 'Not installable yet',
    ck_err: 'Could not check that site.', ft_free: 'Free & open source',
    m_native: 'One-tap install', m_manual: 'Guided steps', m_redir: 'Open in browser', m_unsup: 'Not supported', m_installed: 'Already installed',
    f1t: 'Real device detection', f1b: 'iPhone vs iPad (even when iPad pretends to be a Mac), Android, desktop, ChromeOS — resolved from UA-Client-Hints first, then a careful UA fallback.',
    f2t: 'In-app browsers handled', f2b: 'Opened from Instagram, Facebook, TikTok or LINE? Those webviews can’t install. InstallKit detects them and tells people to open in their real browser.',
    f3t: 'Native prompt when possible', f3b: 'On Chromium it captures beforeinstallprompt and offers a true one-tap install — falling back to precise manual steps the moment the prompt isn’t available.',
    f4t: 'Honest about Firefox & Safari', f4b: 'Desktop Firefox can’t install PWAs; macOS Safari uses “Add to Dock”. InstallKit shows the right thing instead of a button that does nothing.',
    f5t: 'Themeable & tiny', f5b: 'One accent attribute, dark/light, shadow-DOM isolated so it never clashes with your CSS. ~13 kB gzipped, no dependencies.',
    f6t: 'i18n built in', f6b: 'English and French out of the box, auto-detected, with a keyed string system ready for more languages.'
  },
  fr: {
    nav_how: 'Fonctionnement', nav_matrix: 'Compatibilité', nav_docs: 'Docs', nav_check: 'Tester mon site',
    hero_pill: 'Un seul script · zéro dépendance',
    hero_lede: 'InstallKit détecte le vrai appareil et navigateur, puis affiche les étapes précises pour ajouter votre app à l’écran d’accueil — une invite native en un geste là où c’est possible, des instructions manuelles exactes partout ailleurs.',
    hero_try: 'Afficher mes instructions', hero_docs: 'Obtenir le snippet', copy: 'Copier', copied: 'Copié ✓',
    det_device: 'Appareil', det_browser: 'Navigateur', det_method: 'Méthode', det_loading: 'Détection de votre appareil…',
    verdict_native: 'Votre navigateur permet une <b>installation native en un geste</b>. Le widget affiche un bouton Installer.',
    verdict_manual: 'Votre navigateur nécessite des <b>étapes manuelles</b> — InstallKit montre les gestes exacts pour {browser}.',
    verdict_redir: 'Vous êtes dans un navigateur intégré. InstallKit invite à <b>ouvrir dans le vrai navigateur</b> d’abord.',
    verdict_unsup: 'Ce navigateur <b>ne peut pas installer d’app web</b>. InstallKit le dit honnêtement et propose une alternative.',
    verdict_installed: 'Ce site est <b>déjà installé</b> sur votre appareil. InstallKit reste masqué.',
    how_eye: 'Pourquoi InstallKit', how_h2: 'La plupart des invites d’installation se trompent une fois sur deux',
    how_p: 'Les bannières génériques « Ajouter à l’écran d’accueil » montrent les étapes iPhone aux utilisateurs Android et inversement. InstallKit voit juste — y compris les cas que les autres ignorent.',
    mx_eye: 'Compatibilité', mx_h2: 'Le bon chemin, pour chaque plateforme',
    mx_p: 'Une invite native quand le navigateur la supporte ; les vraies étapes manuelles sinon ; et une redirection honnête quand l’installation est tout simplement impossible.',
    dc_eye: 'Intégration', dc_h2: 'Posez-le, puis ajustez', dc_p: 'Fonctionne tel quel avec une seule balise. Configurable via data-attributes ou l’API JS.',
    dc_recommended: 'recommandé — capter l’invite tôt', dc_attrs: 'attributs data-*', dc_default: 'Défaut', dc_what: 'Effet', dc_api: 'API JavaScript',
    a_app: "Le nom de votre app, utilisé dans tous les textes.", a_icon: 'URL d’une icône carrée affichée dans l’en-tête.',
    a_pos: 'Position : bottom-right / -left / -center / inline.', a_accent: 'Couleur d’accent (toute couleur CSS) à vos couleurs.',
    a_theme: 'auto / dark / light.', a_mode: 'auto affiche un lanceur ; manual = vous appelez InstallKit.open().',
    a_delay: 'ms avant l’apparition du lanceur.', a_remind: 'Jours de masquage après un rejet.', a_an: 'Statistiques anonymes optionnelles (comptes seulement, sans PII).',
    api_open: 'Ouvrir la feuille d’installation à la demande (depuis votre bouton).', api_can: 'true sauf si déjà installé ou non supporté.',
    api_env: 'L’objet de détection complet (os, browser, method…).', api_on: 'Évènements : ready, open, close, choice, installed, dismiss.', api_cfg: 'Modifier la config à l’exécution.',
    ck_eye: 'Outil gratuit', ck_h2: 'Votre site est-il installable ?', ck_p: 'Nous récupérons votre page et son manifeste et vérifions les critères que chaque navigateur exige avant de proposer une installation.',
    ck_btn: 'Tester', ck_checking: 'Analyse…', ck_installable: 'Installable', ck_almost: 'Presque', ck_not: 'Pas encore installable',
    ck_err: 'Impossible d’analyser ce site.', ft_free: 'Gratuit & open source',
    m_native: 'Installation en un geste', m_manual: 'Étapes guidées', m_redir: 'Ouvrir dans le navigateur', m_unsup: 'Non supporté', m_installed: 'Déjà installé',
    f1t: 'Détection réelle de l’appareil', f1b: 'iPhone vs iPad (même quand l’iPad se fait passer pour un Mac), Android, desktop, ChromeOS — via UA-Client-Hints d’abord, puis un repli UA soigné.',
    f2t: 'Navigateurs intégrés gérés', f2b: 'Ouvert depuis Instagram, Facebook, TikTok ou LINE ? Ces webviews ne peuvent pas installer. InstallKit les détecte et invite à ouvrir dans le vrai navigateur.',
    f3t: 'Invite native si possible', f3b: 'Sur Chromium, il capte beforeinstallprompt et propose une vraie installation en un geste — avec repli sur des étapes manuelles précises dès que l’invite est indisponible.',
    f4t: 'Honnête sur Firefox & Safari', f4b: 'Firefox desktop ne peut pas installer de PWA ; Safari macOS utilise « Ajouter au Dock ». InstallKit affiche le bon message plutôt qu’un bouton inerte.',
    f5t: 'Personnalisable & léger', f5b: 'Un attribut d’accent, dark/light, isolé en shadow-DOM pour ne jamais entrer en conflit avec votre CSS. ~13 ko gzip, sans dépendance.',
    f6t: 'i18n intégré', f6b: 'Anglais et français d’origine, auto-détectés, avec un système de chaînes prêt pour plus de langues.'
  }
};

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
  if (k.endsWith('_html')) return; // keep markup variants from HTML
  if (T[k.replace('_html', '')] || I18N.en[k]) el.textContent = t(k);
});

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
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
