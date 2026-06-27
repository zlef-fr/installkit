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
