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
    // "Install anyway": the visitor overrode an already-installed verdict (a false
    // positive, or they want it on this browser too) → resolve the real install path.
    if (this._forceInstall && e.method === 'installed') {
      e = this._env = Object.assign({}, e, { standalone: false });
      e.method = resolveMethod(e);
    }
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
      sheet.appendChild(ce('div', { class: 'note' }, [
        ce('span', { html: icon('check_circle') }),
        ce('div', { class: 'nt', text: copy.body })
      ]));
      // discreet escape hatch — install on this browser anyway
      var anyway = ce('button', { class: 'ik-link', type: 'button', text: t('install_anyway') });
      anyway.addEventListener('click', function () { self._forceInstall = true; self._reopen(); });
      sheet.appendChild(anyway);
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

  // Rebuild the sheet in place (no exit animation) — used by "Install anyway".
  _reopen() {
    if (this._scrim) {
      var s = this._scrim; this._scrim = null;
      if (this._esc) document.removeEventListener('keydown', this._esc);
      if (s.parentNode) s.parentNode.removeChild(s);
    }
    this.open();
  }

  close() {
    if (!this._scrim) return;
    this._forceInstall = false; // a fresh open starts from the real (installed) verdict
    var s = this._scrim; this._scrim = null;
    s.classList.remove('show');
    if (this._esc) document.removeEventListener('keydown', this._esc);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
    emit('close');
  }
}
