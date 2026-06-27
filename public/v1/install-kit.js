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


/* ---- 11-i18n-extra-a.js ---- */
/* InstallKit i18n — extra locales (part A): es, de, it, pt, nl.
   Same keys as the `en` block in 10-i18n.js; missing keys fall back to en.
   Quoted button labels use each platform's real localized wording where known. */

I18N.es = {
  install_app: 'Instalar {app}',
  install_this: 'Instalar esta app',
  add_to_home: 'Añadir a la pantalla de inicio',
  subtitle_native: 'Instala la app para un acceso más rápido, uso sin conexión y pantalla completa.',
  subtitle_manual: 'Unos toques añaden {app} a tu dispositivo, sin pasar por una tienda.',
  install_now: 'Instalar',
  installing: 'Instalando…',
  maybe_later: 'Quizás luego',
  got_it: 'Entendido',
  close: 'Cerrar',
  already_installed_title: 'Todo listo',
  already_installed_body: '{app} ya está instalada en este dispositivo. Ábrela desde tu pantalla de inicio.',
  open_app: 'Abrir la app',
  unsupported_title: 'La instalación no es compatible aquí',
  unsupported_body: 'Este navegador no puede instalar apps web. Abre {app} en otro navegador para añadirla.',
  inapp_title: 'Ábrelo primero en tu navegador',
  inapp_body: 'Estás viendo esto dentro de {inapp}. Para instalar, abre esta página en tu navegador habitual y vuelve a intentarlo.',
  step_label: 'Paso {n}',
  detected: 'Detectado: {browser} en {os}',
  copy_link: 'Copiar enlace',
  link_copied: 'Enlace copiado',
  powered_by: 'App web instalable',
  fb_tap_menu: 'Abre el menú del navegador',
  fb_find_install: 'Elige «Instalar» o «Añadir a la pantalla de inicio»',
  fb_confirm: 'Confirma para terminar',
  ios_share: 'Toca el botón Compartir',
  ios_share_hint: 'Es el cuadrado con una flecha hacia arriba, abajo (iPhone) o arriba (iPad) en Safari.',
  ios_scroll_add: 'Desplázate y toca «Añadir a inicio»',
  ios_add_confirm: 'Toca «Añadir» arriba a la derecha',
  ios_done: '{app} ya está en tu pantalla de inicio.',
  iosalt_share: 'Toca el botón Compartir en {browser}',
  iosalt_add: 'Toca «Añadir a inicio»',
  iosalt_confirm: 'Toca «Añadir» para confirmar',
  iosfx_open_safari: 'Abre esta página en Safari',
  iosfx_open_safari_hint: '{browser} en iPhone/iPad no puede añadir apps a la pantalla de inicio. Safari sí.',
  iosfx_then: 'Luego toca Compartir → «Añadir a inicio»',
  and_menu: 'Toca el menú (⋮) arriba a la derecha',
  and_install: 'Toca «Instalar aplicación» (o «Añadir a la pantalla de inicio»)',
  and_confirm: 'Toca «Instalar» para confirmar',
  sam_menu: 'Toca el menú (≡) abajo a la derecha',
  sam_add: 'Toca «Añadir página a» → «Pantalla de inicio»',
  sam_confirm: 'Toca «Añadir» para confirmar',
  ffand_menu: 'Toca el menú (⋮) a la derecha de la barra de direcciones',
  ffand_install: 'Toca «Añadir a la pantalla de inicio» (o «Instalar»)',
  ffand_confirm: 'Confirma para añadir la app',
  deskchr_icon: 'Haz clic en el icono de instalar en la barra de direcciones',
  deskchr_icon_hint: 'Un pequeño icono de monitor con flecha al final de la barra de direcciones.',
  deskchr_menu: 'O abre el menú ⋮ → «Instalar {app}…»',
  deskchr_confirm: 'Haz clic en «Instalar» en el diálogo',
  macsf_share: 'Abre el menú Compartir en la barra de Safari',
  macsf_add_dock: 'Elige «Añadir al Dock»',
  macsf_confirm: 'Haz clic en «Añadir»: la app se abre en su propia ventana',
  deskedge_menu: 'Abre el menú … → «Aplicaciones»',
  deskedge_install: 'Haz clic en «Instalar este sitio como una aplicación»',
  deskedge_confirm: 'Haz clic en «Instalar» para confirmar'
};

I18N.de = {
  install_app: '{app} installieren',
  install_this: 'Diese App installieren',
  add_to_home: 'Zum Home-Bildschirm hinzufügen',
  subtitle_native: 'Installiere die App für schnelleren Zugriff, Offline-Nutzung und Vollbild.',
  subtitle_manual: 'Mit wenigen Tippern fügst du {app} zu deinem Gerät hinzu — ohne App Store.',
  install_now: 'Installieren',
  installing: 'Wird installiert…',
  maybe_later: 'Später',
  got_it: 'Verstanden',
  close: 'Schließen',
  already_installed_title: 'Alles bereit',
  already_installed_body: '{app} ist auf diesem Gerät bereits installiert. Öffne sie über deinen Home-Bildschirm.',
  open_app: 'App öffnen',
  unsupported_title: 'Installation hier nicht möglich',
  unsupported_body: 'Dieser Browser kann keine Web-Apps installieren. Öffne {app} in einem anderen Browser, um sie hinzuzufügen.',
  inapp_title: 'Zuerst im Browser öffnen',
  inapp_body: 'Du siehst dies in {inapp}. Zum Installieren öffne diese Seite in deinem normalen Browser und versuche es erneut.',
  step_label: 'Schritt {n}',
  detected: 'Erkannt: {browser} auf {os}',
  copy_link: 'Link kopieren',
  link_copied: 'Link kopiert',
  powered_by: 'Installierbare Web-App',
  fb_tap_menu: 'Öffne das Browser-Menü',
  fb_find_install: 'Wähle „Installieren“ oder „Zum Startbildschirm“',
  fb_confirm: 'Bestätige zum Abschließen',
  ios_share: 'Tippe auf „Teilen“',
  ios_share_hint: 'Das Quadrat mit dem Pfeil nach oben, unten (iPhone) oder oben (iPad) in Safari.',
  ios_scroll_add: 'Scrolle nach unten und tippe auf „Zum Home-Bildschirm“',
  ios_add_confirm: 'Tippe oben rechts auf „Hinzufügen“',
  ios_done: '{app} ist jetzt auf deinem Home-Bildschirm.',
  iosalt_share: 'Tippe in {browser} auf „Teilen“',
  iosalt_add: 'Tippe auf „Zum Home-Bildschirm“',
  iosalt_confirm: 'Tippe zum Bestätigen auf „Hinzufügen“',
  iosfx_open_safari: 'Öffne diese Seite in Safari',
  iosfx_open_safari_hint: '{browser} auf iPhone/iPad kann keine Apps zum Home-Bildschirm hinzufügen. Safari schon.',
  iosfx_then: 'Tippe dann auf Teilen → „Zum Home-Bildschirm“',
  and_menu: 'Tippe oben rechts auf das Menü (⋮)',
  and_install: 'Tippe auf „App installieren“ (oder „Zum Startbildschirm zufügen“)',
  and_confirm: 'Tippe zum Bestätigen auf „Installieren“',
  sam_menu: 'Tippe unten rechts auf das Menü (≡)',
  sam_add: 'Tippe auf „Seite hinzufügen zu“ → „Startbildschirm“',
  sam_confirm: 'Tippe zum Bestätigen auf „Hinzufügen“',
  ffand_menu: 'Tippe auf das Menü (⋮) rechts neben der Adressleiste',
  ffand_install: 'Tippe auf „Zum Startbildschirm“ (oder „Installieren“)',
  ffand_confirm: 'Bestätige, um die App hinzuzufügen',
  deskchr_icon: 'Klicke auf das Installations-Symbol in der Adressleiste',
  deskchr_icon_hint: 'Ein kleines Monitor-mit-Pfeil-Symbol am rechten Ende der Adressleiste.',
  deskchr_menu: 'Oder öffne das Menü ⋮ → „{app} installieren…“',
  deskchr_confirm: 'Klicke im Dialog auf „Installieren“',
  macsf_share: 'Öffne das Teilen-Menü in der Safari-Symbolleiste',
  macsf_add_dock: 'Wähle „Zum Dock hinzufügen“',
  macsf_confirm: 'Klicke auf „Hinzufügen“ — die App öffnet sich in einem eigenen Fenster',
  deskedge_menu: 'Öffne das Menü … → „Apps“',
  deskedge_install: 'Klicke auf „Diese Website als App installieren“',
  deskedge_confirm: 'Klicke zum Bestätigen auf „Installieren“'
};

I18N.it = {
  install_app: 'Installa {app}',
  install_this: 'Installa questa app',
  add_to_home: 'Aggiungi alla schermata Home',
  subtitle_native: 'Installa l’app per un accesso più rapido, uso offline ed esperienza a tutto schermo.',
  subtitle_manual: 'Pochi tocchi aggiungono {app} al tuo dispositivo, senza alcuno store.',
  install_now: 'Installa',
  installing: 'Installazione…',
  maybe_later: 'Più tardi',
  got_it: 'Ho capito',
  close: 'Chiudi',
  already_installed_title: 'Tutto pronto',
  already_installed_body: '{app} è già installata su questo dispositivo. Aprila dalla schermata Home.',
  open_app: 'Apri l’app',
  unsupported_title: 'Installazione non supportata qui',
  unsupported_body: 'Questo browser non può installare web app. Apri {app} in un altro browser per aggiungerla.',
  inapp_title: 'Apri prima nel tuo browser',
  inapp_body: 'Stai visualizzando questa pagina dentro {inapp}. Per installare, aprila nel tuo browser abituale e riprova.',
  step_label: 'Passo {n}',
  detected: 'Rilevato: {browser} su {os}',
  copy_link: 'Copia link',
  link_copied: 'Link copiato',
  powered_by: 'Web app installabile',
  fb_tap_menu: 'Apri il menu del browser',
  fb_find_install: 'Scegli «Installa» o «Aggiungi alla schermata Home»',
  fb_confirm: 'Conferma per completare',
  ios_share: 'Tocca il pulsante Condividi',
  ios_share_hint: 'È il quadrato con la freccia verso l’alto, in basso (iPhone) o in alto (iPad) in Safari.',
  ios_scroll_add: 'Scorri e tocca «Aggiungi a Home»',
  ios_add_confirm: 'Tocca «Aggiungi» in alto a destra',
  ios_done: '{app} è ora nella schermata Home.',
  iosalt_share: 'Tocca il pulsante Condividi in {browser}',
  iosalt_add: 'Tocca «Aggiungi a Home»',
  iosalt_confirm: 'Tocca «Aggiungi» per confermare',
  iosfx_open_safari: 'Apri questa pagina in Safari',
  iosfx_open_safari_hint: '{browser} su iPhone/iPad non può aggiungere app alla schermata Home. Safari sì.',
  iosfx_then: 'Poi tocca Condividi → «Aggiungi a Home»',
  and_menu: 'Tocca il menu (⋮) in alto a destra',
  and_install: 'Tocca «Installa app» (o «Aggiungi a schermata Home»)',
  and_confirm: 'Tocca «Installa» per confermare',
  sam_menu: 'Tocca il menu (≡) in basso a destra',
  sam_add: 'Tocca «Aggiungi pagina a» → «Schermata Home»',
  sam_confirm: 'Tocca «Aggiungi» per confermare',
  ffand_menu: 'Tocca il menu (⋮) a destra della barra degli indirizzi',
  ffand_install: 'Tocca «Aggiungi a schermata Home» (o «Installa»)',
  ffand_confirm: 'Conferma per aggiungere l’app',
  deskchr_icon: 'Fai clic sull’icona di installazione nella barra degli indirizzi',
  deskchr_icon_hint: 'Una piccola icona monitor-con-freccia all’estremità destra della barra degli indirizzi.',
  deskchr_menu: 'Oppure apri il menu ⋮ → «Installa {app}…»',
  deskchr_confirm: 'Fai clic su «Installa» nella finestra di dialogo',
  macsf_share: 'Apri il menu Condividi nella barra di Safari',
  macsf_add_dock: 'Scegli «Aggiungi al Dock»',
  macsf_confirm: 'Fai clic su «Aggiungi»: l’app si apre in una propria finestra',
  deskedge_menu: 'Apri il menu … → «App»',
  deskedge_install: 'Fai clic su «Installa questo sito come app»',
  deskedge_confirm: 'Fai clic su «Installa» per confermare'
};

I18N.pt = {
  install_app: 'Instalar {app}',
  install_this: 'Instalar este app',
  add_to_home: 'Adicionar à Tela de Início',
  subtitle_native: 'Instale o app para acesso mais rápido, uso offline e tela cheia.',
  subtitle_manual: 'Alguns toques adicionam {app} ao seu dispositivo, sem precisar de loja.',
  install_now: 'Instalar',
  installing: 'Instalando…',
  maybe_later: 'Mais tarde',
  got_it: 'Entendi',
  close: 'Fechar',
  already_installed_title: 'Tudo pronto',
  already_installed_body: '{app} já está instalado neste dispositivo. Abra-o pela tela de início.',
  open_app: 'Abrir o app',
  unsupported_title: 'Instalação não suportada aqui',
  unsupported_body: 'Este navegador não consegue instalar web apps. Abra {app} em outro navegador para adicioná-lo.',
  inapp_title: 'Abra primeiro no seu navegador',
  inapp_body: 'Você está vendo isto dentro do {inapp}. Para instalar, abra esta página no seu navegador comum e tente de novo.',
  step_label: 'Passo {n}',
  detected: 'Detectado: {browser} no {os}',
  copy_link: 'Copiar link',
  link_copied: 'Link copiado',
  powered_by: 'Web app instalável',
  fb_tap_menu: 'Abra o menu do navegador',
  fb_find_install: 'Escolha “Instalar” ou “Adicionar à tela de início”',
  fb_confirm: 'Confirme para concluir',
  ios_share: 'Toque no botão Compartilhar',
  ios_share_hint: 'É o quadrado com uma seta para cima, embaixo (iPhone) ou no topo (iPad) do Safari.',
  ios_scroll_add: 'Role para baixo e toque em “Adicionar à Tela de Início”',
  ios_add_confirm: 'Toque em “Adicionar” no canto superior direito',
  ios_done: '{app} agora está na sua tela de início.',
  iosalt_share: 'Toque no botão Compartilhar no {browser}',
  iosalt_add: 'Toque em “Adicionar à Tela de Início”',
  iosalt_confirm: 'Toque em “Adicionar” para confirmar',
  iosfx_open_safari: 'Abra esta página no Safari',
  iosfx_open_safari_hint: '{browser} no iPhone/iPad não pode adicionar apps à tela de início. O Safari pode.',
  iosfx_then: 'Depois toque em Compartilhar → “Adicionar à Tela de Início”',
  and_menu: 'Toque no menu (⋮) no canto superior direito',
  and_install: 'Toque em “Instalar app” (ou “Adicionar à tela inicial”)',
  and_confirm: 'Toque em “Instalar” para confirmar',
  sam_menu: 'Toque no menu (≡) no canto inferior direito',
  sam_add: 'Toque em “Adicionar página a” → “Tela inicial”',
  sam_confirm: 'Toque em “Adicionar” para confirmar',
  ffand_menu: 'Toque no menu (⋮) à direita da barra de endereço',
  ffand_install: 'Toque em “Adicionar à tela inicial” (ou “Instalar”)',
  ffand_confirm: 'Confirme para adicionar o app',
  deskchr_icon: 'Clique no ícone de instalar na barra de endereço',
  deskchr_icon_hint: 'Um pequeno ícone de monitor com seta no canto direito da barra de endereço.',
  deskchr_menu: 'Ou abra o menu ⋮ → “Instalar {app}…”',
  deskchr_confirm: 'Clique em “Instalar” na caixa de diálogo',
  macsf_share: 'Abra o menu Compartilhar na barra do Safari',
  macsf_add_dock: 'Escolha “Adicionar ao Dock”',
  macsf_confirm: 'Clique em “Adicionar” — o app abre na própria janela',
  deskedge_menu: 'Abra o menu … → “Aplicativos”',
  deskedge_install: 'Clique em “Instalar este site como app”',
  deskedge_confirm: 'Clique em “Instalar” para confirmar'
};

I18N.nl = {
  install_app: '{app} installeren',
  install_this: 'Deze app installeren',
  add_to_home: 'Op beginscherm zetten',
  subtitle_native: 'Installeer de app voor snellere toegang, offline gebruik en volledig scherm.',
  subtitle_manual: 'Met een paar tikken zet je {app} op je apparaat — geen appstore nodig.',
  install_now: 'Installeren',
  installing: 'Bezig met installeren…',
  maybe_later: 'Later',
  got_it: 'Begrepen',
  close: 'Sluiten',
  already_installed_title: 'Helemaal klaar',
  already_installed_body: '{app} is al op dit apparaat geïnstalleerd. Open het vanaf je beginscherm.',
  open_app: 'App openen',
  unsupported_title: 'Installeren wordt hier niet ondersteund',
  unsupported_body: 'Deze browser kan geen web-apps installeren. Open {app} in een andere browser om het toe te voegen.',
  inapp_title: 'Open eerst in je browser',
  inapp_body: 'Je bekijkt dit in {inapp}. Open deze pagina in je gewone browser en probeer het opnieuw om te installeren.',
  step_label: 'Stap {n}',
  detected: 'Herkend: {browser} op {os}',
  copy_link: 'Link kopiëren',
  link_copied: 'Link gekopieerd',
  powered_by: 'Installeerbare web-app',
  fb_tap_menu: 'Open het browsermenu',
  fb_find_install: 'Kies ‘Installeren’ of ‘Op beginscherm zetten’',
  fb_confirm: 'Bevestig om te voltooien',
  ios_share: 'Tik op de Deel-knop',
  ios_share_hint: 'Het vierkant met een pijl omhoog, onderaan (iPhone) of bovenaan (iPad) in Safari.',
  ios_scroll_add: 'Scrol omlaag en tik op ‘Zet op beginscherm’',
  ios_add_confirm: 'Tik rechtsboven op ‘Voeg toe’',
  ios_done: '{app} staat nu op je beginscherm.',
  iosalt_share: 'Tik op de Deel-knop in {browser}',
  iosalt_add: 'Tik op ‘Zet op beginscherm’',
  iosalt_confirm: 'Tik op ‘Voeg toe’ om te bevestigen',
  iosfx_open_safari: 'Open deze pagina in Safari',
  iosfx_open_safari_hint: '{browser} op iPhone/iPad kan geen apps op het beginscherm zetten. Safari wel.',
  iosfx_then: 'Tik dan op Delen → ‘Zet op beginscherm’',
  and_menu: 'Tik rechtsboven op het menu (⋮)',
  and_install: 'Tik op ‘App installeren’ (of ‘Toevoegen aan startscherm’)',
  and_confirm: 'Tik op ‘Installeren’ om te bevestigen',
  sam_menu: 'Tik rechtsonder op het menu (≡)',
  sam_add: 'Tik op ‘Pagina toevoegen aan’ → ‘Startscherm’',
  sam_confirm: 'Tik op ‘Toevoegen’ om te bevestigen',
  ffand_menu: 'Tik op het menu (⋮) rechts van de adresbalk',
  ffand_install: 'Tik op ‘Toevoegen aan startscherm’ (of ‘Installeren’)',
  ffand_confirm: 'Bevestig om de app toe te voegen',
  deskchr_icon: 'Klik op het installatiepictogram in de adresbalk',
  deskchr_icon_hint: 'Een klein beeldscherm-met-pijl pictogram aan de rechterkant van de adresbalk.',
  deskchr_menu: 'Of open het menu ⋮ → ‘{app} installeren…’',
  deskchr_confirm: 'Klik in het dialoogvenster op ‘Installeren’',
  macsf_share: 'Open het Deel-menu in de Safari-werkbalk',
  macsf_add_dock: 'Kies ‘Voeg toe aan Dock’',
  macsf_confirm: 'Klik op ‘Voeg toe’ — de app opent in een eigen venster',
  deskedge_menu: 'Open het menu … → ‘Apps’',
  deskedge_install: 'Klik op ‘Deze site als app installeren’',
  deskedge_confirm: 'Klik op ‘Installeren’ om te bevestigen'
};


/* ---- 12-i18n-extra-b.js ---- */
/* InstallKit i18n — extra locales (part B): ru, pl, ja, ko, zh.
   Same keys as the `en` block in 10-i18n.js; missing keys fall back to en. */

I18N.ru = {
  install_app: 'Установить {app}',
  install_this: 'Установить это приложение',
  add_to_home: 'Добавить на главный экран',
  subtitle_native: 'Установите приложение для быстрого доступа, работы офлайн и полноэкранного режима.',
  subtitle_manual: 'Несколько касаний — и {app} на вашем устройстве, без магазина приложений.',
  install_now: 'Установить',
  installing: 'Установка…',
  maybe_later: 'Позже',
  got_it: 'Понятно',
  close: 'Закрыть',
  already_installed_title: 'Всё готово',
  already_installed_body: '{app} уже установлено на этом устройстве. Откройте его с главного экрана.',
  open_app: 'Открыть приложение',
  unsupported_title: 'Установка здесь недоступна',
  unsupported_body: 'Этот браузер не может устанавливать веб-приложения. Откройте {app} в другом браузере, чтобы добавить его.',
  inapp_title: 'Сначала откройте в браузере',
  inapp_body: 'Вы просматриваете это внутри {inapp}. Чтобы установить, откройте страницу в обычном браузере и повторите попытку.',
  step_label: 'Шаг {n}',
  detected: 'Определено: {browser} на {os}',
  copy_link: 'Скопировать ссылку',
  link_copied: 'Ссылка скопирована',
  powered_by: 'Устанавливаемое веб-приложение',
  fb_tap_menu: 'Откройте меню браузера',
  fb_find_install: 'Выберите «Установить» или «На главный экран»',
  fb_confirm: 'Подтвердите, чтобы завершить',
  ios_share: 'Нажмите кнопку «Поделиться»',
  ios_share_hint: 'Это квадрат со стрелкой вверх — внизу (iPhone) или вверху (iPad) в Safari.',
  ios_scroll_add: 'Прокрутите вниз и нажмите «На экран „Домой“»',
  ios_add_confirm: 'Нажмите «Добавить» в правом верхнем углу',
  ios_done: '{app} теперь на вашем главном экране.',
  iosalt_share: 'Нажмите кнопку «Поделиться» в {browser}',
  iosalt_add: 'Нажмите «На экран „Домой“»',
  iosalt_confirm: 'Нажмите «Добавить» для подтверждения',
  iosfx_open_safari: 'Откройте эту страницу в Safari',
  iosfx_open_safari_hint: '{browser} на iPhone/iPad не может добавлять приложения на главный экран. Safari может.',
  iosfx_then: 'Затем нажмите «Поделиться» → «На экран „Домой“»',
  and_menu: 'Нажмите меню (⋮) в правом верхнем углу',
  and_install: 'Нажмите «Установить приложение» (или «Добавить на главный экран»)',
  and_confirm: 'Нажмите «Установить» для подтверждения',
  sam_menu: 'Нажмите меню (≡) в правом нижнем углу',
  sam_add: 'Нажмите «Добавить страницу на» → «Главный экран»',
  sam_confirm: 'Нажмите «Добавить» для подтверждения',
  ffand_menu: 'Нажмите меню (⋮) справа от адресной строки',
  ffand_install: 'Нажмите «Добавить на главный экран» (или «Установить»)',
  ffand_confirm: 'Подтвердите добавление приложения',
  deskchr_icon: 'Нажмите значок установки в адресной строке',
  deskchr_icon_hint: 'Маленький значок монитора со стрелкой в правом конце адресной строки.',
  deskchr_menu: 'Или откройте меню ⋮ → «Установить {app}…»',
  deskchr_confirm: 'Нажмите «Установить» в диалоговом окне',
  macsf_share: 'Откройте меню «Поделиться» на панели Safari',
  macsf_add_dock: 'Выберите «Добавить в Dock»',
  macsf_confirm: 'Нажмите «Добавить» — приложение откроется в отдельном окне',
  deskedge_menu: 'Откройте меню … → «Приложения»',
  deskedge_install: 'Нажмите «Установить этот сайт как приложение»',
  deskedge_confirm: 'Нажмите «Установить» для подтверждения'
};

I18N.pl = {
  install_app: 'Zainstaluj {app}',
  install_this: 'Zainstaluj tę aplikację',
  add_to_home: 'Dodaj do ekranu głównego',
  subtitle_native: 'Zainstaluj aplikację, by mieć szybszy dostęp, tryb offline i pełny ekran.',
  subtitle_manual: 'Kilka dotknięć dodaje {app} do urządzenia — bez sklepu z aplikacjami.',
  install_now: 'Zainstaluj',
  installing: 'Instalowanie…',
  maybe_later: 'Może później',
  got_it: 'Rozumiem',
  close: 'Zamknij',
  already_installed_title: 'Wszystko gotowe',
  already_installed_body: '{app} jest już zainstalowana na tym urządzeniu. Otwórz ją z ekranu głównego.',
  open_app: 'Otwórz aplikację',
  unsupported_title: 'Instalacja nie jest tu obsługiwana',
  unsupported_body: 'Ta przeglądarka nie może instalować aplikacji internetowych. Otwórz {app} w innej przeglądarce, aby ją dodać.',
  inapp_title: 'Najpierw otwórz w przeglądarce',
  inapp_body: 'Oglądasz to w {inapp}. Aby zainstalować, otwórz tę stronę w zwykłej przeglądarce i spróbuj ponownie.',
  step_label: 'Krok {n}',
  detected: 'Wykryto: {browser} na {os}',
  copy_link: 'Kopiuj link',
  link_copied: 'Link skopiowany',
  powered_by: 'Instalowalna aplikacja internetowa',
  fb_tap_menu: 'Otwórz menu przeglądarki',
  fb_find_install: 'Wybierz „Zainstaluj” lub „Dodaj do ekranu głównego”',
  fb_confirm: 'Potwierdź, aby zakończyć',
  ios_share: 'Dotknij przycisku Udostępnij',
  ios_share_hint: 'To kwadrat ze strzałką w górę, na dole (iPhone) lub u góry (iPad) w Safari.',
  ios_scroll_add: 'Przewiń w dół i dotknij „Do ekranu początkowego”',
  ios_add_confirm: 'Dotknij „Dodaj” w prawym górnym rogu',
  ios_done: '{app} jest teraz na ekranie głównym.',
  iosalt_share: 'Dotknij przycisku Udostępnij w {browser}',
  iosalt_add: 'Dotknij „Do ekranu początkowego”',
  iosalt_confirm: 'Dotknij „Dodaj”, aby potwierdzić',
  iosfx_open_safari: 'Otwórz tę stronę w Safari',
  iosfx_open_safari_hint: '{browser} na iPhonie/iPadzie nie może dodawać aplikacji do ekranu głównego. Safari może.',
  iosfx_then: 'Następnie dotknij Udostępnij → „Do ekranu początkowego”',
  and_menu: 'Dotknij menu (⋮) w prawym górnym rogu',
  and_install: 'Dotknij „Zainstaluj aplikację” (lub „Dodaj do ekranu głównego”)',
  and_confirm: 'Dotknij „Zainstaluj”, aby potwierdzić',
  sam_menu: 'Dotknij menu (≡) w prawym dolnym rogu',
  sam_add: 'Dotknij „Dodaj stronę do” → „Ekran główny”',
  sam_confirm: 'Dotknij „Dodaj”, aby potwierdzić',
  ffand_menu: 'Dotknij menu (⋮) po prawej od paska adresu',
  ffand_install: 'Dotknij „Dodaj do ekranu głównego” (lub „Zainstaluj”)',
  ffand_confirm: 'Potwierdź, aby dodać aplikację',
  deskchr_icon: 'Kliknij ikonę instalacji na pasku adresu',
  deskchr_icon_hint: 'Mała ikona monitora ze strzałką po prawej stronie paska adresu.',
  deskchr_menu: 'Lub otwórz menu ⋮ → „Zainstaluj {app}…”',
  deskchr_confirm: 'Kliknij „Zainstaluj” w oknie dialogowym',
  macsf_share: 'Otwórz menu Udostępnij na pasku Safari',
  macsf_add_dock: 'Wybierz „Dodaj do Docka”',
  macsf_confirm: 'Kliknij „Dodaj” — aplikacja otworzy się we własnym oknie',
  deskedge_menu: 'Otwórz menu … → „Aplikacje”',
  deskedge_install: 'Kliknij „Zainstaluj tę witrynę jako aplikację”',
  deskedge_confirm: 'Kliknij „Zainstaluj”, aby potwierdzić'
};

I18N.ja = {
  install_app: '{app} をインストール',
  install_this: 'このアプリをインストール',
  add_to_home: 'ホーム画面に追加',
  subtitle_native: '素早いアクセス、オフライン利用、全画面表示のためにアプリをインストールしましょう。',
  subtitle_manual: '数回タップするだけで {app} をデバイスに追加できます（アプリストア不要）。',
  install_now: 'インストール',
  installing: 'インストール中…',
  maybe_later: '後で',
  got_it: 'OK',
  close: '閉じる',
  already_installed_title: '準備完了',
  already_installed_body: '{app} はこのデバイスにすでにインストールされています。ホーム画面から起動してください。',
  open_app: 'アプリを開く',
  unsupported_title: 'ここではインストールできません',
  unsupported_body: 'このブラウザはウェブアプリをインストールできません。別のブラウザで {app} を開いて追加してください。',
  inapp_title: 'まずブラウザで開いてください',
  inapp_body: '{inapp} 内で表示しています。インストールするには、このページを通常のブラウザで開いてからもう一度お試しください。',
  step_label: 'ステップ {n}',
  detected: '検出: {os} の {browser}',
  copy_link: 'リンクをコピー',
  link_copied: 'リンクをコピーしました',
  powered_by: 'インストール可能なウェブアプリ',
  fb_tap_menu: 'ブラウザのメニューを開く',
  fb_find_install: '「インストール」または「ホーム画面に追加」を選択',
  fb_confirm: '確定して完了',
  ios_share: '共有ボタンをタップ',
  ios_share_hint: '上向き矢印付きの四角いアイコンです。Safari の下部（iPhone）または上部（iPad）にあります。',
  ios_scroll_add: '下にスクロールして「ホーム画面に追加」をタップ',
  ios_add_confirm: '右上の「追加」をタップ',
  ios_done: '{app} がホーム画面に追加されました。',
  iosalt_share: '{browser} で共有ボタンをタップ',
  iosalt_add: '「ホーム画面に追加」をタップ',
  iosalt_confirm: '「追加」をタップして確定',
  iosfx_open_safari: 'このページを Safari で開く',
  iosfx_open_safari_hint: 'iPhone/iPad の {browser} ではホーム画面に追加できません。Safari なら可能です。',
  iosfx_then: '次に共有 →「ホーム画面に追加」をタップ',
  and_menu: '右上のメニュー（⋮）をタップ',
  and_install: '「アプリをインストール」（または「ホーム画面に追加」）をタップ',
  and_confirm: '「インストール」をタップして確定',
  sam_menu: '右下のメニュー（≡）をタップ',
  sam_add: '「ページを追加」→「ホーム画面」をタップ',
  sam_confirm: '「追加」をタップして確定',
  ffand_menu: 'アドレスバー右側のメニュー（⋮）をタップ',
  ffand_install: '「ホーム画面に追加」（または「インストール」）をタップ',
  ffand_confirm: '確定してアプリを追加',
  deskchr_icon: 'アドレスバーのインストールアイコンをクリック',
  deskchr_icon_hint: 'アドレスバー右端にある、矢印付きの小さなモニターのアイコンです。',
  deskchr_menu: 'または ⋮ メニュー →「{app} をインストール…」を開く',
  deskchr_confirm: 'ダイアログで「インストール」をクリック',
  macsf_share: 'Safari ツールバーの共有メニューを開く',
  macsf_add_dock: '「Dock に追加」を選択',
  macsf_confirm: '「追加」をクリック — アプリが独立したウインドウで開きます',
  deskedge_menu: '… メニュー →「アプリ」を開く',
  deskedge_install: '「このサイトをアプリとしてインストール」をクリック',
  deskedge_confirm: '「インストール」をクリックして確定'
};

I18N.ko = {
  install_app: '{app} 설치',
  install_this: '이 앱 설치',
  add_to_home: '홈 화면에 추가',
  subtitle_native: '더 빠른 접근, 오프라인 사용, 전체 화면을 위해 앱을 설치하세요.',
  subtitle_manual: '몇 번만 누르면 {app}을(를) 기기에 추가할 수 있어요 — 앱 스토어가 필요 없습니다.',
  install_now: '설치',
  installing: '설치 중…',
  maybe_later: '나중에',
  got_it: '확인',
  close: '닫기',
  already_installed_title: '준비 완료',
  already_installed_body: '{app}이(가) 이미 이 기기에 설치되어 있습니다. 홈 화면에서 실행하세요.',
  open_app: '앱 열기',
  unsupported_title: '여기서는 설치할 수 없습니다',
  unsupported_body: '이 브라우저는 웹 앱을 설치할 수 없습니다. 다른 브라우저에서 {app}을(를) 열어 추가하세요.',
  inapp_title: '먼저 브라우저에서 열기',
  inapp_body: '{inapp} 안에서 보고 있습니다. 설치하려면 이 페이지를 일반 브라우저에서 열고 다시 시도하세요.',
  step_label: '{n}단계',
  detected: '감지됨: {os}의 {browser}',
  copy_link: '링크 복사',
  link_copied: '링크 복사됨',
  powered_by: '설치 가능한 웹 앱',
  fb_tap_menu: '브라우저 메뉴 열기',
  fb_find_install: '“설치” 또는 “홈 화면에 추가” 선택',
  fb_confirm: '확인하여 완료',
  ios_share: '공유 버튼 탭하기',
  ios_share_hint: '위쪽 화살표가 있는 사각형 아이콘으로, Safari 하단(iPhone) 또는 상단(iPad)에 있습니다.',
  ios_scroll_add: '아래로 스크롤하여 “홈 화면에 추가” 탭하기',
  ios_add_confirm: '오른쪽 위 “추가” 탭하기',
  ios_done: '이제 {app}이(가) 홈 화면에 있습니다.',
  iosalt_share: '{browser}에서 공유 버튼 탭하기',
  iosalt_add: '“홈 화면에 추가” 탭하기',
  iosalt_confirm: '“추가”를 탭하여 확인',
  iosfx_open_safari: '이 페이지를 Safari에서 열기',
  iosfx_open_safari_hint: 'iPhone/iPad의 {browser}는 홈 화면에 앱을 추가할 수 없습니다. Safari는 가능합니다.',
  iosfx_then: '그런 다음 공유 → “홈 화면에 추가” 탭하기',
  and_menu: '오른쪽 위 메뉴(⋮) 탭하기',
  and_install: '“앱 설치”(또는 “홈 화면에 추가”) 탭하기',
  and_confirm: '“설치”를 탭하여 확인',
  sam_menu: '오른쪽 아래 메뉴(≡) 탭하기',
  sam_add: '“페이지 추가 위치” → “홈 화면” 탭하기',
  sam_confirm: '“추가”를 탭하여 확인',
  ffand_menu: '주소창 오른쪽 메뉴(⋮) 탭하기',
  ffand_install: '“홈 화면에 추가”(또는 “설치”) 탭하기',
  ffand_confirm: '확인하여 앱 추가',
  deskchr_icon: '주소창의 설치 아이콘 클릭',
  deskchr_icon_hint: '주소창 오른쪽 끝에 있는 화살표가 그려진 작은 모니터 아이콘입니다.',
  deskchr_menu: '또는 ⋮ 메뉴 → “{app} 설치…” 열기',
  deskchr_confirm: '대화상자에서 “설치” 클릭',
  macsf_share: 'Safari 도구 막대에서 공유 메뉴 열기',
  macsf_add_dock: '“Dock에 추가” 선택',
  macsf_confirm: '“추가” 클릭 — 앱이 별도 창에서 열립니다',
  deskedge_menu: '… 메뉴 → “앱” 열기',
  deskedge_install: '“이 사이트를 앱으로 설치” 클릭',
  deskedge_confirm: '“설치”를 클릭하여 확인'
};

I18N.zh = {
  install_app: '安装 {app}',
  install_this: '安装此应用',
  add_to_home: '添加到主屏幕',
  subtitle_native: '安装应用，获得更快访问、离线使用和全屏体验。',
  subtitle_manual: '只需轻点几下即可将 {app} 添加到设备，无需应用商店。',
  install_now: '安装',
  installing: '正在安装…',
  maybe_later: '以后再说',
  got_it: '知道了',
  close: '关闭',
  already_installed_title: '一切就绪',
  already_installed_body: '{app} 已安装在此设备上。请从主屏幕打开它。',
  open_app: '打开应用',
  unsupported_title: '此处不支持安装',
  unsupported_body: '此浏览器无法安装网页应用。请在其他浏览器中打开 {app} 以添加。',
  inapp_title: '请先在浏览器中打开',
  inapp_body: '你正在 {inapp} 内查看。要安装，请在常用浏览器中打开此页面后重试。',
  step_label: '第 {n} 步',
  detected: '已检测到：{os} 上的 {browser}',
  copy_link: '复制链接',
  link_copied: '链接已复制',
  powered_by: '可安装的网页应用',
  fb_tap_menu: '打开浏览器菜单',
  fb_find_install: '选择“安装”或“添加到主屏幕”',
  fb_confirm: '确认以完成',
  ios_share: '点按“分享”按钮',
  ios_share_hint: '就是带有向上箭头的方形图标，位于 Safari 底部（iPhone）或顶部（iPad）。',
  ios_scroll_add: '向下滚动并点按“添加到主屏幕”',
  ios_add_confirm: '点按右上角的“添加”',
  ios_done: '{app} 现已出现在你的主屏幕上。',
  iosalt_share: '在 {browser} 中点按“分享”按钮',
  iosalt_add: '点按“添加到主屏幕”',
  iosalt_confirm: '点按“添加”以确认',
  iosfx_open_safari: '在 Safari 中打开此页面',
  iosfx_open_safari_hint: 'iPhone/iPad 上的 {browser} 无法将应用添加到主屏幕，但 Safari 可以。',
  iosfx_then: '然后点按分享 →“添加到主屏幕”',
  and_menu: '点按右上角的菜单（⋮）',
  and_install: '点按“安装应用”（或“添加到主屏幕”）',
  and_confirm: '点按“安装”以确认',
  sam_menu: '点按右下角的菜单（≡）',
  sam_add: '点按“将页面添加到”→“主屏幕”',
  sam_confirm: '点按“添加”以确认',
  ffand_menu: '点按地址栏右侧的菜单（⋮）',
  ffand_install: '点按“添加到主屏幕”（或“安装”）',
  ffand_confirm: '确认以添加应用',
  deskchr_icon: '点击地址栏中的安装图标',
  deskchr_icon_hint: '地址栏右端一个带箭头的小显示器图标。',
  deskchr_menu: '或打开 ⋮ 菜单 →“安装 {app}…”',
  deskchr_confirm: '在对话框中点击“安装”',
  macsf_share: '在 Safari 工具栏中打开“分享”菜单',
  macsf_add_dock: '选择“添加到程序坞”',
  macsf_confirm: '点击“添加”——应用将在独立窗口中打开',
  deskedge_menu: '打开 … 菜单 →“应用”',
  deskedge_install: '点击“将此网站安装为应用”',
  deskedge_confirm: '点击“安装”以确认'
};


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

  // "Installed and running as an app" — only trust signals that can't be
  // produced by an ordinary browser tab. We deliberately DON'T treat
  // display-mode:fullscreen as installed: a browser in F11 / Fullscreen API
  // matches it, which false-positives a normal tab as "installed". minimal-ui
  // is likewise unreliable across engines. The robust signals are standalone,
  // window-controls-overlay (desktop installed PWA), iOS navigator.standalone,
  // and the android-app:// referrer of a TWA.
  var standalone = false;
  try {
    standalone = (window.matchMedia && (
      matchMedia('(display-mode: standalone)').matches ||
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
