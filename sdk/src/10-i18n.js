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
    install_anyway: 'Install anyway',
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
    add_to_home: 'Ajouter à l’écran d’accueil',
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
    install_anyway: 'Installer quand même',
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
