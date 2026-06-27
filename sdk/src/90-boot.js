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
