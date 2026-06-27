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
