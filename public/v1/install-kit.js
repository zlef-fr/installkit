/*! InstallKit SDK — accurate PWA install instructions. install.zlef.fr | MIT */
;(function(){
"use strict";
/* ---- 00-core.js ---- */
/* InstallKit SDK — core namespace, config + small helpers.
   All src files are concatenated (filename order) into one IIFE by build.mjs,
   so every `var`/function declared here is visible to later files. */

var IK_VERSION = '1.0.0';

// Resolved configuration (filled by boot from <script data-*> + window.InstallKitConfig).
var CFG = {
  appName: '',          // shown in copy ("Install <appName>")
  icon: '',             // url to a square icon for the sheet header
  accent: '',           // override accent color (hex)
  position: 'bottom-right', // bottom-right | bottom-left | bottom-center | inline
  mode: 'auto',         // auto = show a launcher; manual = host calls InstallKit.open()
  theme: 'auto',        // auto | dark | light
  lang: '',             // force a language; else auto
  delay: 1200,          // ms before the launcher appears
  remindAfter: 3,       // days to stay hidden after a dismiss
  showWhenInstalled: false,
  analytics: false,     // opt-in anonymous funnel beacon
  site: '',             // your site id for analytics grouping
  endpoint: ''          // analytics endpoint (defaults to SDK origin)
};

// Capture the loading <script> NOW (parse time) — document.currentScript is
// null once we defer config reading to DOMContentLoaded.
var SDK_SCRIPT = document.currentScript || null;
var SDK_ORIGIN = (function () {
  try {
    if (SDK_SCRIPT && SDK_SCRIPT.src) return new URL(SDK_SCRIPT.src).origin;
  } catch (e) {}
  return 'https://install.zlef.fr';
})();

function ce(tag, props, kids) {
  var el = document.createElement(tag);
  if (props) for (var k in props) {
    if (k === 'class') el.className = props[k];
    else if (k === 'html') el.innerHTML = props[k];
    else if (k === 'text') el.textContent = props[k];
    else if (k.slice(0, 2) === 'on' && typeof props[k] === 'function') el.addEventListener(k.slice(2), props[k]);
    else el.setAttribute(k, props[k]);
  }
  (kids || []).forEach(function (c) { if (c) el.appendChild(c); });
  return el;
}

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var EVT = {}; // tiny event bus
function on(name, fn) { (EVT[name] = EVT[name] || []).push(fn); }
function emit(name, data) { (EVT[name] || []).forEach(function (fn) { try { fn(data); } catch (e) {} }); }


/* ---- 10-i18n.js ---- */
/* InstallKit i18n — EN (default) + FR. Strings are keyed; {app} is interpolated.
   Step strings live here too so the whole instruction set is translatable. */

var I18N = {
  en: {
    install_app: 'Install {app}',
    install_this: 'Install this app',
    add_to_home: 'Add to Home Screen',
    subtitle_native: 'Get the app for faster access, offline use and a full-screen experience.',
    subtitle_manual: 'A few quick taps adds {app} to your device — no app store needed.',
    install_now: 'Install',
    installing: 'Installing…',
    maybe_later: 'Maybe later',
    got_it: 'Got it',
    close: 'Close',
    already_installed_title: 'You’re all set',
    already_installed_body: '{app} is already installed on this device. Launch it from your home screen.',
    open_app: 'Open the app',
    unsupported_title: 'Installing isn’t supported here',
    unsupported_body: 'This browser can’t install web apps. Open {app} in another browser to add it to your device.',
    inapp_title: 'Open in your browser first',
    inapp_body: 'You’re viewing this inside {inapp}. To install, open this page in your regular browser, then try again.',
    step_label: 'Step {n}',
    detected: 'Detected: {browser} on {os}',
    copy_link: 'Copy link',
    link_copied: 'Link copied',
    powered_by: 'Installable web app',
    // generic fallbacks
    fb_tap_menu: 'Tap the browser menu',
    fb_find_install: 'Choose “Install” or “Add to Home Screen”',
    fb_confirm: 'Confirm to finish',
    // iOS Safari
    ios_share: 'Tap the Share button',
    ios_share_hint: 'It’s the square with an upward arrow, at the bottom (iPhone) or top (iPad) of Safari.',
    ios_scroll_add: 'Scroll down and tap “Add to Home Screen”',
    ios_add_confirm: 'Tap “Add” in the top-right corner',
    ios_done: '{app} now lives on your home screen.',
    // iOS non-Safari (Chrome/Edge support A2HS via their own share menu)
    iosalt_share: 'Tap the Share button in {browser}',
    iosalt_add: 'Tap “Add to Home Screen”',
    iosalt_confirm: 'Tap “Add” to confirm',
    // iOS Firefox / unsupported in-browser → open Safari
    iosfx_open_safari: 'Open this page in Safari',
    iosfx_open_safari_hint: '{browser} on iPhone/iPad can’t add apps to the home screen. Safari can.',
    iosfx_then: 'Then tap Share → “Add to Home Screen”',
    // Android Chrome / Chromium menu fallback
    and_menu: 'Tap the menu button (⋮) in the top-right',
    and_install: 'Tap “Install app” (or “Add to Home screen”)',
    and_confirm: 'Tap “Install” to confirm',
    // Samsung Internet
    sam_menu: 'Tap the menu (≡) at the bottom-right',
    sam_add: 'Tap “Add page to” → “Home screen”',
    sam_confirm: 'Tap “Add” to confirm',
    // Firefox Android
    ffand_menu: 'Tap the menu (⋮) to the right of the address bar',
    ffand_install: 'Tap “Add to Home screen” (or “Install”)',
    ffand_confirm: 'Confirm to add the app',
    // Desktop Chromium (manual fallback, when no prompt fired yet)
    deskchr_icon: 'Click the install icon in the address bar',
    deskchr_icon_hint: 'A small monitor-with-arrow icon at the right end of the address bar.',
    deskchr_menu: 'Or open the ⋮ menu → “Install {app}…”',
    deskchr_confirm: 'Click “Install” in the dialog',
    // macOS Safari (Sonoma 14+)
    macsf_share: 'Open the Share menu in the Safari toolbar',
    macsf_add_dock: 'Choose “Add to Dock”',
    macsf_confirm: 'Click “Add” — the app opens in its own window',
    // Edge desktop
    deskedge_menu: 'Open the … menu → “Apps”',
    deskedge_install: 'Click “Install this site as an app”',
    deskedge_confirm: 'Click “Install” to confirm'
  },
  fr: {
    install_app: 'Installer {app}',
    install_this: 'Installer cette application',
    add_to_home: 'À l’écran d’accueil',
    subtitle_native: 'Installez l’app pour un accès plus rapide, un usage hors-ligne et le plein écran.',
    subtitle_manual: 'Quelques touches suffisent pour ajouter {app} à votre appareil — sans passer par un store.',
    install_now: 'Installer',
    installing: 'Installation…',
    maybe_later: 'Plus tard',
    got_it: 'Compris',
    close: 'Fermer',
    already_installed_title: 'Tout est prêt',
    already_installed_body: '{app} est déjà installée sur cet appareil. Lancez-la depuis votre écran d’accueil.',
    open_app: 'Ouvrir l’app',
    unsupported_title: 'Installation non prise en charge ici',
    unsupported_body: 'Ce navigateur ne peut pas installer d’app web. Ouvrez {app} dans un autre navigateur pour l’ajouter.',
    inapp_title: 'Ouvrez d’abord dans votre navigateur',
    inapp_body: 'Vous êtes dans {inapp}. Pour installer, ouvrez cette page dans votre navigateur habituel, puis réessayez.',
    step_label: 'Étape {n}',
    detected: 'Détecté : {browser} sur {os}',
    copy_link: 'Copier le lien',
    link_copied: 'Lien copié',
    powered_by: 'Application web installable',
    fb_tap_menu: 'Ouvrez le menu du navigateur',
    fb_find_install: 'Choisissez « Installer » ou « À l’écran d’accueil »',
    fb_confirm: 'Confirmez pour terminer',
    ios_share: 'Touchez le bouton Partager',
    ios_share_hint: 'C’est le carré avec une flèche vers le haut, en bas (iPhone) ou en haut (iPad) de Safari.',
    ios_scroll_add: 'Faites défiler puis touchez « Sur l’écran d’accueil »',
    ios_add_confirm: 'Touchez « Ajouter » en haut à droite',
    ios_done: '{app} apparaît maintenant sur votre écran d’accueil.',
    iosalt_share: 'Touchez le bouton Partager dans {browser}',
    iosalt_add: 'Touchez « Sur l’écran d’accueil »',
    iosalt_confirm: 'Touchez « Ajouter » pour confirmer',
    iosfx_open_safari: 'Ouvrez cette page dans Safari',
    iosfx_open_safari_hint: '{browser} sur iPhone/iPad ne peut pas ajouter d’app à l’écran d’accueil. Safari, oui.',
    iosfx_then: 'Puis touchez Partager → « Sur l’écran d’accueil »',
    and_menu: 'Touchez le menu (⋮) en haut à droite',
    and_install: 'Touchez « Installer l’application » (ou « À l’écran d’accueil »)',
    and_confirm: 'Touchez « Installer » pour confirmer',
    sam_menu: 'Touchez le menu (≡) en bas à droite',
    sam_add: 'Touchez « Ajouter la page à » → « Écran d’accueil »',
    sam_confirm: 'Touchez « Ajouter » pour confirmer',
    ffand_menu: 'Touchez le menu (⋮) à droite de la barre d’adresse',
    ffand_install: 'Touchez « Ajouter à l’écran d’accueil » (ou « Installer »)',
    ffand_confirm: 'Confirmez pour ajouter l’app',
    deskchr_icon: 'Cliquez sur l’icône d’installation dans la barre d’adresse',
    deskchr_icon_hint: 'Une petite icône écran-avec-flèche à droite de la barre d’adresse.',
    deskchr_menu: 'Ou ouvrez le menu ⋮ → « Installer {app}… »',
    deskchr_confirm: 'Cliquez sur « Installer » dans la boîte de dialogue',
    macsf_share: 'Ouvrez le menu Partager dans la barre d’outils Safari',
    macsf_add_dock: 'Choisissez « Ajouter au Dock »',
    macsf_confirm: 'Cliquez sur « Ajouter » — l’app s’ouvre dans sa fenêtre',
    deskedge_menu: 'Ouvrez le menu … → « Applications »',
    deskedge_install: 'Cliquez sur « Installer ce site en tant qu’application »',
    deskedge_confirm: 'Cliquez sur « Installer » pour confirmer'
  }
};

var LANG = 'en';
function pickLang() {
  if (CFG.lang && I18N[CFG.lang]) return CFG.lang;
  var ck = (document.cookie.match(/(?:^|;\s*)zl-lang=([^;]+)/) || [])[1];
  if (ck && I18N[ck]) return ck;
  var n = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return I18N[n] ? n : 'en';
}
function t(key, vars) {
  var s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  if (vars) for (var k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
  return s;
}


/* ---- 20-detect.js ---- */
/* InstallKit detection — figure out, as accurately as possible, what device +
   browser the visitor uses and *how* they can install this site as an app.

   Output: {
     os, osLabel, browser, browserLabel, engine, formFactor,
     standalone,            // already installed / running as app
     inApp,                 // null | {id,label}  (Instagram/FB/TikTok webview…)
     supportsBeforeInstall, // Chromium prompt path available
     method,                // 'native' | 'manual' | 'open-in-browser' | 'unsupported' | 'installed'
     iosVersion, brave
   }
*/

function detectInApp(ua) {
  var map = [
    [/fban|fbav|fb_iab|fbios/, 'Facebook'],
    [/instagram/, 'Instagram'],
    [/musical_ly|bytedance|tiktok|trill/, 'TikTok'],
    [/line\//, 'LINE'],
    [/snapchat/, 'Snapchat'],
    [/twitter|twitterandroid/, 'X'],
    [/pinterest/, 'Pinterest'],
    [/linkedinapp/, 'LinkedIn'],
    [/whatsapp/, 'WhatsApp'],
    [/gsa\//, 'Google App'],
    [/micromessenger/, 'WeChat']
  ];
  for (var i = 0; i < map.length; i++) if (map[i][0].test(ua)) return { id: map[i][1].toLowerCase(), label: map[i][1] };
  // generic Android WebView (apps embedding a browser) — the canonical "; wv)" token
  if (/;\s*wv[;)]/.test(ua)) return { id: 'webview', label: 'an app' };
  return null;
}

function detectBrowser(ua, low, uaData) {
  // UA-CH brand list is the most reliable on Chromium
  var brand = '';
  if (uaData && uaData.brands) {
    uaData.brands.forEach(function (b) {
      var n = b.brand.toLowerCase();
      if (/edge/.test(n)) brand = 'edge';
      else if (/opera/.test(n)) brand = 'opera';
      else if (/samsung/.test(n)) brand = 'samsung';
      else if (/brave/.test(n)) brand = 'brave';
      else if (/google chrome/.test(n) && !brand) brand = 'chrome';
    });
  }
  if (brand) {
    var labels = { edge: 'Edge', opera: 'Opera', samsung: 'Samsung Internet', brave: 'Brave', chrome: 'Chrome' };
    return { id: brand, label: labels[brand] };
  }
  // UA-string fallback (order matters)
  if (/fxios/.test(low)) return { id: 'firefox-ios', label: 'Firefox' };
  if (/crios/.test(low)) return { id: 'chrome-ios', label: 'Chrome' };
  if (/edgios/.test(low)) return { id: 'edge-ios', label: 'Edge' };
  if (/opios|opt\//.test(low)) return { id: 'opera-ios', label: 'Opera' };
  if (/edg\//.test(low)) return { id: 'edge', label: 'Edge' };
  if (/samsungbrowser/.test(low)) return { id: 'samsung', label: 'Samsung Internet' };
  if (/opr\/|opera/.test(low)) return { id: 'opera', label: 'Opera' };
  if (/vivaldi/.test(low)) return { id: 'vivaldi', label: 'Vivaldi' };
  if (/yabrowser/.test(low)) return { id: 'yandex', label: 'Yandex' };
  if (/ucbrowser/.test(low)) return { id: 'uc', label: 'UC Browser' };
  if (/duckduckgo/.test(low)) return { id: 'duckduckgo', label: 'DuckDuckGo' };
  if (/firefox/.test(low)) return { id: 'firefox', label: 'Firefox' };
  if (/chrome/.test(low)) return { id: 'chrome', label: 'Chrome' };
  if (/safari/.test(low)) return { id: 'safari', label: 'Safari' };
  return { id: 'unknown', label: 'your browser' };
}

function detectEnv() {
  var ua = navigator.userAgent || '';
  var low = ua.toLowerCase();
  var uaData = navigator.userAgentData || null;
  var maxTouch = navigator.maxTouchPoints || 0;

  var standalone = false;
  try {
    standalone = (window.matchMedia && (
      matchMedia('(display-mode: standalone)').matches ||
      matchMedia('(display-mode: fullscreen)').matches ||
      matchMedia('(display-mode: minimal-ui)').matches ||
      matchMedia('(display-mode: window-controls-overlay)').matches)) ||
      navigator.standalone === true ||
      document.referrer.indexOf('android-app://') === 0;
  } catch (e) {}

  // OS
  var os = 'unknown';
  var isIPadOS = (/macintosh/.test(low) && maxTouch > 1) || /ipad/.test(low);
  if (/iphone|ipod/.test(low)) os = 'ios';
  else if (isIPadOS) os = 'ipados';
  else if (/android/.test(low)) os = 'android';
  else if (/windows/.test(low)) os = 'windows';
  else if (/cros/.test(low)) os = 'chromeos';
  else if (/mac os x|macintosh/.test(low)) os = 'macos';
  else if (/linux/.test(low)) os = 'linux';

  if (uaData && uaData.platform) {
    var p = uaData.platform.toLowerCase();
    if (p === 'android') os = 'android';
    else if (p === 'windows') os = 'windows';
    else if (p === 'chrome os') os = 'chromeos';
    else if (p === 'linux') os = 'linux';
    else if (p === 'macos' && os !== 'ipados') os = 'macos';
  }

  var iosVersion = 0;
  var m = low.match(/os (\d+)[_.](\d+)/);
  if ((os === 'ios' || os === 'ipados') && m) iosVersion = parseFloat(m[1] + '.' + m[2]);

  var formFactor = 'desktop';
  if (os === 'ios') formFactor = 'phone';
  else if (os === 'ipados') formFactor = 'tablet';
  else if (os === 'android') formFactor = /mobile/.test(low) ? 'phone' : 'tablet';

  var browser = detectBrowser(ua, low, uaData);
  var inApp = detectInApp(low);
  var supportsBeforeInstall = ('onbeforeinstallprompt' in window);

  // Brave exposes navigator.brave (async true detector); presence is a strong hint
  var brave = !!(navigator.brave && typeof navigator.brave.isBrave === 'function');
  if (brave && browser.id === 'chrome') { browser = { id: 'brave', label: 'Brave' }; }

  var osLabels = { ios: 'iPhone', ipados: 'iPad', android: 'Android', windows: 'Windows', macos: 'macOS', chromeos: 'ChromeOS', linux: 'Linux', unknown: 'your device' };

  var env = {
    os: os, osLabel: osLabels[os], browser: browser.id, browserLabel: browser.label,
    formFactor: formFactor, standalone: standalone, inApp: inApp,
    supportsBeforeInstall: supportsBeforeInstall, iosVersion: iosVersion, brave: brave,
    ua: ua
  };
  env.method = resolveMethod(env);
  return env;
}

// Decide the single best installation path for this environment.
function resolveMethod(e) {
  if (e.standalone) return 'installed';
  if (e.inApp) return 'open-in-browser';

  // Apple platforms — always manual (no beforeinstallprompt on WebKit)
  if (e.os === 'ios' || e.os === 'ipados') {
    if (e.browser === 'firefox-ios') return 'unsupported-ios'; // Firefox iOS has no A2HS
    return 'manual';
  }

  // Desktop / mobile Chromium with a captured prompt → native one-tap
  if (BIP.deferred) return 'native';

  // Android: manual menu instructions per browser
  if (e.os === 'android') {
    if (e.browser === 'firefox' && !e.supportsBeforeInstall) return 'manual';
    return e.supportsBeforeInstall ? 'native-or-manual' : 'manual';
  }

  // Desktop
  if (e.os === 'windows' || e.os === 'macos' || e.os === 'linux' || e.os === 'chromeos') {
    if (e.browser === 'firefox') return 'unsupported'; // Firefox desktop dropped PWA install
    if (e.os === 'macos' && e.browser === 'safari') return 'manual'; // Add to Dock (Sonoma+)
    if (e.browser === 'safari') return 'unsupported';
    return e.supportsBeforeInstall ? 'native-or-manual' : 'manual';
  }
  return 'manual';
}


/* ---- 30-instructions.js ---- */
/* InstallKit instructions — turn a detected env into an ordered, accurate
   step list. Each step = { icon: <key>, text, hint? }. Icons keys map to
   inline SVGs in 40-icons.js. Copy is keyed through t(). */

function buildSteps(e) {
  var app = CFG.appName || t('install_this');
  var S = [];
  var add = function (icon, key, vars, hintKey) {
    var step = { icon: icon, text: t(key, vars) };
    if (hintKey) step.hint = t(hintKey, vars);
    S.push(step);
  };

  // ---- Apple: iPhone / iPad ----
  if (e.os === 'ios' || e.os === 'ipados') {
    if (e.browser === 'safari') {
      add('share', 'ios_share', null, 'ios_share_hint');
      add('plus', 'ios_scroll_add');
      add('check', 'ios_add_confirm');
      return { steps: S, done: t('ios_done', { app: app }) };
    }
    if (e.browser === 'firefox-ios') {
      add('safari', 'iosfx_open_safari', null, 'iosfx_open_safari_hint');
      add('share', 'iosfx_then', { browser: e.browserLabel });
      return { steps: S, done: t('ios_done', { app: app }) };
    }
    // Chrome / Edge / others on iOS — own share sheet supports A2HS (iOS 16.4+)
    add('share', 'iosalt_share', { browser: e.browserLabel });
    add('plus', 'iosalt_add');
    add('check', 'iosalt_confirm');
    return { steps: S, done: t('ios_done', { app: app }) };
  }

  // ---- Android ----
  if (e.os === 'android') {
    if (e.browser === 'samsung') {
      add('menu', 'sam_menu');
      add('plus', 'sam_add');
      add('check', 'sam_confirm');
    } else if (e.browser === 'firefox') {
      add('menu', 'ffand_menu');
      add('plus', 'ffand_install');
      add('check', 'ffand_confirm');
    } else { // chrome / edge / brave / opera / generic chromium
      add('menu', 'and_menu');
      add('plus', 'and_install');
      add('check', 'and_confirm');
    }
    return { steps: S };
  }

  // ---- macOS Safari (Sonoma 14+ → Add to Dock) ----
  if (e.os === 'macos' && e.browser === 'safari') {
    add('share', 'macsf_share');
    add('plus', 'macsf_add_dock');
    add('check', 'macsf_confirm');
    return { steps: S };
  }

  // ---- Desktop Edge ----
  if (e.browser === 'edge') {
    add('menu', 'deskedge_menu');
    add('plus', 'deskedge_install');
    add('check', 'deskedge_confirm');
    return { steps: S };
  }

  // ---- Desktop Chromium (Chrome/Brave/Opera/Vivaldi/ChromeOS) ----
  add('addressbar', 'deskchr_icon', { app: app }, 'deskchr_icon_hint');
  add('menu', 'deskchr_menu', { app: app });
  add('check', 'deskchr_confirm');
  return { steps: S };
}

// Headline + subtitle for the sheet, by method.
function sheetCopy(e) {
  var app = CFG.appName || t('install_this');
  if (e.method === 'installed') return { title: t('already_installed_title'), body: t('already_installed_body', { app: app }) };
  if (e.method === 'open-in-browser') return { title: t('inapp_title'), body: t('inapp_body', { app: app, inapp: e.inApp ? e.inApp.label : 'an app' }) };
  if (e.method === 'unsupported') return { title: t('unsupported_title'), body: t('unsupported_body', { app: app }) };
  if (e.method === 'native') return { title: CFG.appName ? t('install_app', { app: app }) : t('install_this'), body: t('subtitle_native') };
  return { title: CFG.appName ? t('install_app', { app: app }) : t('add_to_home'), body: t('subtitle_manual', { app: app }) };
}


/* ---- 40-icons.js ---- */
/* InstallKit icons — inline SVG strings (24px, currentColor). Keys referenced
   by step.icon. These are static, app-controlled markup only. */

var ICONS = {
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  addressbar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="13" rx="2.5"/><path d="M12 9v5M9.5 11.5 12 14l2.5-2.5"/></svg>',
  safari: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 20h14"/></svg>',
  check_circle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.2 2.2L15.5 9.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>'
};
function icon(key) { return ICONS[key] || ICONS.plus; }


/* ---- 50-styles.js ---- */
/* InstallKit styles — injected into the widget's shadow root. Self-contained
   (no host CSS leaks in). Host can theme via data-accent / --ik-accent. */

function widgetCSS() {
  return `
  :host{ all: initial; }
  *,*::before,*::after{ box-sizing: border-box; }
  .ik{
    --ik-bg:#0e0e13; --ik-bg2:#15151c; --ik-line:rgba(255,255,255,.09);
    --ik-text:#e9eae2; --ik-soft:#b6b7ad; --ik-muted:#7d7e76;
    --ik-accent:#9dae50; --ik-accent-ink:#11140a;
    --ik-radius:14px; --ik-font: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    font-family:var(--ik-font); color:var(--ik-text); line-height:1.5;
  }
  .ik.light{ --ik-bg:#ffffff; --ik-bg2:#f4f4f2; --ik-line:rgba(0,0,0,.10);
    --ik-text:#16171a; --ik-soft:#444; --ik-muted:#777; --ik-accent-ink:#11140a; }

  /* launcher */
  .launcher{ position:fixed; z-index:2147483000; display:inline-flex; align-items:center; gap:9px;
    padding:12px 16px; min-height:48px; border:none; border-radius:999px; cursor:pointer;
    background:var(--ik-accent); color:var(--ik-accent-ink); font:600 15px/1 var(--ik-font);
    box-shadow:0 8px 26px rgba(0,0,0,.34); transition:transform .16s cubic-bezier(.22,.61,.36,1),box-shadow .16s,opacity .25s;
    opacity:0; transform:translateY(10px) scale(.96); }
  .launcher.show{ opacity:1; transform:none; }
  .launcher:hover{ transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,0,0,.42); }
  .launcher:active{ transform:translateY(0); }
  .launcher svg{ width:20px; height:20px; }
  .launcher.bottom-right{ right:18px; bottom:18px; }
  .launcher.bottom-left{ left:18px; bottom:18px; }
  .launcher.bottom-center{ left:50%; transform:translateX(-50%) translateY(10px); bottom:18px; }
  .launcher.bottom-center.show{ transform:translateX(-50%); }
  .launcher.inline{ position:static; box-shadow:none; opacity:1; transform:none; }

  /* overlay + sheet */
  .scrim{ position:fixed; inset:0; z-index:2147483600; background:rgba(4,4,8,.62);
    backdrop-filter:blur(3px); opacity:0; transition:opacity .22s; display:flex; align-items:flex-end; justify-content:center; }
  .scrim.show{ opacity:1; }
  @media(min-width:721px){ .scrim{ align-items:center; } }

  .sheet{ width:100%; max-width:none; background:var(--ik-bg); color:var(--ik-text);
    border:1px solid var(--ik-line); border-bottom:none; border-radius:18px 18px 0 0;
    box-shadow:0 -10px 50px rgba(0,0,0,.5); padding:22px 22px max(26px,env(safe-area-inset-bottom));
    transform:translateY(100%); transition:transform .3s cubic-bezier(.22,.61,.36,1);
    max-height:88dvh; overflow:auto; }
  @media(min-width:721px){ .sheet{ max-width:460px; border-radius:18px; border-bottom:1px solid var(--ik-line);
    transform:translateY(16px); opacity:0; transition:transform .26s,opacity .26s; box-shadow:0 24px 70px rgba(0,0,0,.6); } }
  .scrim.show .sheet{ transform:none; opacity:1; }

  .grip{ width:38px; height:4px; border-radius:99px; background:var(--ik-line); margin:0 auto 14px; }
  @media(min-width:721px){ .grip{ display:none; } }

  .head{ display:flex; align-items:flex-start; gap:13px; margin-bottom:6px; }
  .appicon{ width:46px; height:46px; border-radius:11px; object-fit:cover; background:var(--ik-bg2);
    border:1px solid var(--ik-line); flex:0 0 auto; display:flex; align-items:center; justify-content:center; }
  .appicon svg{ width:24px; height:24px; color:var(--ik-accent); }
  .htext{ flex:1; min-width:0; }
  .title{ font-size:19px; font-weight:700; letter-spacing:-.01em; margin:1px 0 0; }
  .sub{ font-size:14.5px; color:var(--ik-soft); margin:5px 0 0; }
  .x{ flex:0 0 auto; width:34px; height:34px; border:none; border-radius:9px; background:var(--ik-bg2);
    color:var(--ik-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .x:hover{ color:var(--ik-text); }
  .x svg{ width:18px; height:18px; }

  .cta{ display:flex; align-items:center; justify-content:center; gap:9px; width:100%;
    margin-top:18px; padding:14px; min-height:52px; border:none; border-radius:12px; cursor:pointer;
    background:var(--ik-accent); color:var(--ik-accent-ink); font:700 16px/1 var(--ik-font);
    transition:filter .15s,transform .1s; }
  .cta:hover{ filter:brightness(1.06); }
  .cta:active{ transform:translateY(1px); }
  .cta svg{ width:20px; height:20px; }
  .cta[disabled]{ opacity:.6; cursor:default; }

  .steps{ list-style:none; margin:18px 0 0; padding:0; display:flex; flex-direction:column; gap:12px; }
  .step{ display:flex; align-items:flex-start; gap:13px; opacity:0; transform:translateY(6px);
    animation:ikin .34s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes ikin{ to{ opacity:1; transform:none; } }
  .num{ flex:0 0 auto; width:30px; height:30px; border-radius:9px; background:var(--ik-bg2);
    border:1px solid var(--ik-line); display:flex; align-items:center; justify-content:center;
    color:var(--ik-accent); }
  .num svg{ width:17px; height:17px; }
  .stext{ flex:1; padding-top:3px; }
  .stxt{ font-size:15.5px; font-weight:550; }
  .shint{ font-size:13px; color:var(--ik-muted); margin-top:3px; }

  .note{ margin-top:18px; padding:14px; border-radius:12px; background:var(--ik-bg2);
    border:1px solid var(--ik-line); display:flex; gap:11px; align-items:flex-start; }
  .note svg{ width:20px; height:20px; flex:0 0 auto; color:var(--ik-accent); margin-top:1px; }
  .note .nt{ font-size:14.5px; color:var(--ik-soft); }

  .foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:18px; }
  .ghost{ border:1px solid var(--ik-line); background:transparent; color:var(--ik-soft);
    padding:9px 14px; border-radius:10px; font:550 14px/1 var(--ik-font); cursor:pointer; min-height:40px; }
  .ghost:hover{ color:var(--ik-text); border-color:rgba(255,255,255,.22); }
  .det{ font-size:12px; color:var(--ik-muted); }
  .badge{ display:inline-flex; align-items:center; gap:6px; font-size:11.5px; color:var(--ik-muted); margin-top:14px; }
  .badge b{ color:var(--ik-soft); font-weight:600; }
  @media(prefers-reduced-motion:reduce){ *{ animation:none!important; transition:none!important; } }
  `;
}


/* ---- 60-widget.js ---- */
/* InstallKit widget — the custom element <install-kit>. Renders a launcher
   button and an install sheet inside a shadow root. Drives the native prompt
   when available, else shows the accurate manual steps for this device. */

var MOUNTED = null;

function applyAccent(root) {
  var ik = root.querySelector('.ik');
  if (CFG.accent) ik.style.setProperty('--ik-accent', CFG.accent);
  var theme = CFG.theme;
  if (theme === 'auto') {
    try { theme = (matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; }
    catch (e) { theme = 'dark'; }
  }
  ik.classList.toggle('light', theme === 'light');
}

class InstallKitEl extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.attachShadow({ mode: 'open' });
    var style = document.createElement('style'); style.textContent = widgetCSS();
    this.shadowRoot.appendChild(style);
    this._wrap = ce('div', { class: 'ik' });
    this.shadowRoot.appendChild(this._wrap);
    applyAccent(this.shadowRoot);
    this._env = detectEnv();
    this._renderLauncher();
    MOUNTED = this;
  }

  _dismissedRecently() {
    var until = parseInt(lsGet('ik-dismiss-until') || '0', 10);
    return until && Date.now() < until;
  }

  _renderLauncher() {
    if (CFG.mode === 'manual') return;
    if (this._env.method === 'installed' && !CFG.showWhenInstalled) return;
    if (this._dismissedRecently()) return;

    var label = this._env.method === 'open-in-browser' ? t('install_this')
      : (CFG.appName ? t('install_app', { app: CFG.appName }) : t('add_to_home'));
    var self = this;
    var btn = ce('button', { class: 'launcher ' + CFG.position, type: 'button',
      'aria-label': label, html: icon('install') + '<span></span>' });
    btn.querySelector('span').textContent = label;
    btn.addEventListener('click', function () { self.open(); });
    this._wrap.appendChild(btn);
    this._launcher = btn;
    var delay = CFG.position === 'inline' ? 0 : (parseInt(CFG.delay, 10) || 0);
    setTimeout(function () { btn.classList.add('show'); }, delay);
    emit('ready', this._env);
  }

  open() {
    if (this._scrim) return;
    var e = this._env = detectEnv(); // re-detect (prompt may have arrived since)
    var copy = sheetCopy(e);
    var self = this;

    var scrim = ce('div', { class: 'scrim', role: 'dialog', 'aria-modal': 'true' });
    var sheet = ce('div', { class: 'sheet' });
    scrim.appendChild(sheet);

    sheet.appendChild(ce('div', { class: 'grip' }));

    // header
    var appicon = CFG.icon
      ? ce('img', { class: 'appicon', src: CFG.icon, alt: '' })
      : ce('div', { class: 'appicon', html: icon('install') });
    var htext = ce('div', { class: 'htext' }, [
      ce('div', { class: 'title', text: copy.title }),
      ce('div', { class: 'sub', text: copy.body })
    ]);
    var x = ce('button', { class: 'x', 'aria-label': t('close'), html: icon('close') });
    x.addEventListener('click', function () { self.close(); });
    sheet.appendChild(ce('div', { class: 'head' }, [appicon, htext, x]));

    if (e.method === 'native') {
      var cta = ce('button', { class: 'cta', html: icon('install') + '<span></span>' });
      cta.querySelector('span').textContent = t('install_now');
      cta.addEventListener('click', function () { self._fireNative(cta); });
      sheet.appendChild(cta);
      beacon('prompt', e);
    } else if (e.method === 'installed') {
      var note = ce('div', { class: 'note' }, [
        ce('span', { html: icon('check_circle') }),
        ce('div', { class: 'nt', text: copy.body })
      ]);
      sheet.appendChild(note);
    } else if (e.method === 'open-in-browser' || e.method === 'unsupported') {
      sheet.appendChild(ce('div', { class: 'note' }, [
        ce('span', { html: icon(e.method === 'unsupported' ? 'warn' : 'external') }),
        ce('div', { class: 'nt', text: copy.body })
      ]));
      if (e.method === 'unsupported' && (e.os === 'macos' || e.os === 'windows')) {
        this._appendSteps(sheet, e); // unreachable for unsupported, kept defensive
      }
    } else {
      this._appendSteps(sheet, e);
      beacon('prompt', e);
    }

    // footer
    var foot = ce('div', { class: 'foot' });
    var later = ce('button', { class: 'ghost', text: e.method === 'installed' ? t('got_it') : t('maybe_later') });
    later.addEventListener('click', function () { self._dismiss(); });
    foot.appendChild(later);
    foot.appendChild(ce('div', { class: 'det', text: t('detected', { browser: e.browserLabel, os: e.osLabel }) }));
    sheet.appendChild(foot);

    sheet.appendChild(ce('div', { class: 'badge', html: '<b>InstallKit</b> · ' + t('powered_by') }));

    scrim.addEventListener('click', function (ev) { if (ev.target === scrim) self.close(); });
    document.addEventListener('keydown', this._esc = function (ev) { if (ev.key === 'Escape') self.close(); });
    this._wrap.appendChild(scrim);
    this._scrim = scrim;
    requestAnimationFrame(function () { scrim.classList.add('show'); });
    emit('open', e);
  }

  _appendSteps(sheet, e) {
    var built = buildSteps(e);
    var ol = ce('ol', { class: 'steps' });
    built.steps.forEach(function (s, i) {
      var li = ce('li', { class: 'step' });
      li.style.animationDelay = (i * 70) + 'ms';
      li.appendChild(ce('div', { class: 'num', html: icon(s.icon) }));
      var box = ce('div', { class: 'stext' }, [ce('div', { class: 'stxt', text: s.text })]);
      if (s.hint) box.appendChild(ce('div', { class: 'shint', text: s.hint }));
      li.appendChild(box);
      ol.appendChild(li);
    });
    sheet.appendChild(ol);
    if (built.done) sheet.appendChild(ce('div', { class: 'note' }, [
      ce('span', { html: icon('check_circle') }),
      ce('div', { class: 'nt', text: built.done })
    ]));
  }

  _fireNative(cta) {
    var self = this, d = BIP.deferred;
    if (!d) { this._env.method = 'manual'; this.close(); this.open(); return; }
    cta.setAttribute('disabled', '');
    cta.querySelector('span').textContent = t('installing');
    d.prompt();
    d.userChoice.then(function (res) {
      beacon(res && res.outcome === 'accepted' ? 'accepted' : 'dismissed', self._env);
      emit('choice', res);
      BIP.deferred = null;
      self.close();
    }).catch(function () { self.close(); });
  }

  _dismiss() {
    var days = parseInt(CFG.remindAfter, 10); if (isNaN(days)) days = 3;
    lsSet('ik-dismiss-until', String(Date.now() + days * 86400000));
    beacon('snooze', this._env);
    if (this._launcher) this._launcher.classList.remove('show');
    this.close();
    emit('dismiss', this._env);
  }

  close() {
    if (!this._scrim) return;
    var s = this._scrim; this._scrim = null;
    s.classList.remove('show');
    if (this._esc) document.removeEventListener('keydown', this._esc);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
    emit('close');
  }
}


/* ---- 90-boot.js ---- */
/* InstallKit boot — capture the install prompt early, read config, register
   the element, auto-mount, and expose the public API. */

var BIP = { deferred: null };

// Pull in anything an inline early-capture snippet stashed before us.
(function () {
  try {
    var pre = window.__ik;
    if (pre && pre.deferred) BIP.deferred = pre.deferred;
  } catch (e) {}
})();

window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  BIP.deferred = e;
  emit('available', e);
});
window.addEventListener('appinstalled', function () {
  BIP.deferred = null;
  beacon('installed', MOUNTED ? MOUNTED._env : detectEnv());
  if (MOUNTED) { MOUNTED.close(); if (MOUNTED._launcher) MOUNTED._launcher.classList.remove('show'); }
  emit('installed');
});

function readConfig() {
  var s = SDK_SCRIPT;
  if (!s) {
    var all = document.querySelectorAll('script[src*="install-kit"]');
    s = all[all.length - 1];
  }
  var map = {
    appName: 'app-name', icon: 'icon', accent: 'accent', position: 'position',
    mode: 'mode', theme: 'theme', lang: 'lang', delay: 'delay',
    remindAfter: 'remind-after', site: 'site', endpoint: 'endpoint'
  };
  if (s && s.dataset) {
    for (var key in map) if (s.dataset[camel(map[key])] != null) CFG[key] = s.dataset[camel(map[key])];
    if (s.dataset.showWhenInstalled != null) CFG.showWhenInstalled = s.dataset.showWhenInstalled !== 'false';
    if (s.dataset.analytics != null) CFG.analytics = s.dataset.analytics !== 'false';
  }
  if (window.InstallKitConfig) for (var k in window.InstallKitConfig) CFG[k] = window.InstallKitConfig[k];
  if (!CFG.endpoint) CFG.endpoint = SDK_ORIGIN + '/api/event';
}
function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

// Anonymous, opt-in funnel beacon. No PII — platform + action + your site id.
function beacon(action, env) {
  if (!CFG.analytics) return;
  try {
    var body = JSON.stringify({ a: action, site: CFG.site || location.hostname,
      os: env && env.os, browser: env && env.browser, ff: env && env.formFactor, v: IK_VERSION });
    if (navigator.sendBeacon) navigator.sendBeacon(CFG.endpoint, new Blob([body], { type: 'application/json' }));
    else fetch(CFG.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
  } catch (e) {}
}

function boot() {
  readConfig();
  LANG = pickLang();
  if (!customElements.get('install-kit')) customElements.define('install-kit', InstallKitEl);

  // Auto-mount one instance unless the page already placed an <install-kit>.
  if (CFG.position !== 'inline' && !document.querySelector('install-kit')) {
    var el = document.createElement('install-kit');
    document.body.appendChild(el);
  }
}

// Public API
window.InstallKit = {
  version: IK_VERSION,
  open: function () { if (MOUNTED) MOUNTED.open(); },
  close: function () { if (MOUNTED) MOUNTED.close(); },
  env: function () { return detectEnv(); },
  canInstall: function () { var e = detectEnv(); return e.method !== 'installed' && e.method !== 'unsupported'; },
  config: function (o) { for (var k in o) CFG[k] = o[k]; },
  on: on
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
