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
