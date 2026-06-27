# Contributing to InstallKit

Thank you for helping! The single most valuable contribution is **keeping the
per-platform install instructions accurate**. Browsers rename menus, move
buttons, and change behaviour between versions — if you're on a real device and a
step is wrong, fixing it is a five-minute, high-impact PR.

This guide is mostly about **the install instructions** (the rest of the codebase
is small and documented in the [README](README.md)).

---

## Golden rules for instruction copy

1. **Describe the real, current UI.** Use the exact label the browser shows
   ("Add to Home Screen", "Install app", "Add to Dock"). Don't paraphrase.
2. **Be honest.** If a browser genuinely can't install a web app (desktop
   Firefox, Firefox on iOS, non-Safari macOS), say so and offer an alternative —
   never show steps that lead nowhere.
3. **Per device, not per OS.** iPhone Safari and iPad Safari differ (Share button
   is at the bottom vs. the top toolbar). Keep that nuance.
4. **Keep it to 2–4 steps.** One action per step. People skim.
5. **Always provide English _and_ French.** English is the fallback for any
   missing key. Add other languages by extending the `I18N` map the same way.
6. **Cite your source.** In the PR description, say which device + browser +
   version you verified on (ideally with a screenshot). "Tested on a real Pixel 8,
   Chrome 124" is exactly what we need.

---

## The three files an instruction touches

A set of steps for a platform lives across three SDK source files in `sdk/src/`.
They're plain ES (no framework) and get concatenated into one bundle by
`sdk/build.mjs`.

### 1. `20-detect.js` — make sure the device is recognised

`detectEnv()` returns `{ os, browser, formFactor, standalone, inApp, method, … }`.
Two functions matter:

- **`detectBrowser(ua, low, uaData)`** — add/adjust the browser id + label. UA
  Client Hints brands are checked first (most reliable on Chromium); the UA-string
  fallback order matters (more specific tokens first — e.g. `fxios`/`crios` before
  generic `safari`).
- **`resolveMethod(e)`** — decides the single path (`native` / `manual` /
  `open-in-browser` / `unsupported` / `installed`). If a browser should show
  manual steps, make sure it lands on `'manual'` here.

To flag a new **in-app webview** (so users are told to open their real browser),
add a token to the `map` in `detectInApp(ua)`:

```js
[/yourapp_token/, 'YourApp'],
```

> ⚠️ Be specific. A past bug: `\bx11\b` (meant for Twitter/X) matched the Linux
> "X11" UA token, so every Linux desktop visitor was wrongly treated as an in-app
> browser. Prefer a unique vendor token and test against real UA strings.

### 2. i18n files — write the step copy

The widget ships **12 languages**: `en` + `fr` live in `sdk/src/10-i18n.js`; the
other ten (`es de it pt nl ru pl ja ko zh`) are in `sdk/src/11-i18n-extra-a.js`
and `sdk/src/12-i18n-extra-b.js` (each assigns `I18N.<code> = { … }`). Add your
key to **every** language you can — `en` is the fallback for anything missing, so
a partial PR is fine and we'll fill the rest. `{app}` and `{browser}` are
interpolated, and **quoted button labels should match what the browser actually
shows in that language** (e.g. iOS Safari is "Add to Home Screen" / "Sur l'écran
d'accueil" / "Zum Home-Bildschirm" / "ホーム画面に追加"). Example:

```js
// en
yourplat_menu: 'Tap the ⋮ menu, top-right',
yourplat_add:  'Choose “Install app”',
yourplat_done: '{app} now lives on your home screen.',
// fr
yourplat_menu: 'Touchez le menu ⋮, en haut à droite',
yourplat_add:  'Choisissez « Installer l’application »',
yourplat_done: '{app} apparaît sur votre écran d’accueil.',
```

### 3. `30-instructions.js` — wire the steps in order

`buildSteps(e)` returns `{ steps: [...], done? }`. Add (or fix) a branch using the
`add(icon, key, vars?, hintKey?)` helper. Steps render in the order you push them.

```js
if (e.os === 'android' && e.browser === 'yourbrowser') {
  add('menu',  'yourplat_menu');   // icon keys live in 40-icons.js
  add('plus',  'yourplat_add');
  add('check', 'yourplat_confirm');
  return { steps: S, done: t('yourplat_done', { app: app }) };
}
```

**Icons** come from `40-icons.js`. Reuse an existing key where it fits:
`share` · `plus` (add-to-home) · `menu` (⋮) · `check` · `addressbar` (desktop
install icon) · `safari`. Only add a new 24px `currentColor` SVG if none fits.

### Don't forget the landing matrix

The coverage table on the landing is a separate, plain data array — update it so
docs match reality: `public/js/landing.js` → the `MATRIX` constant
(`[emoji, 'Platform · Browser', 'short path', tag]`, where `tag` is
`native|manual|redir|unsup|installed`).

### Adding a whole new language

1. **Widget:** add a new `I18N.<code> = { … }` block (copy the `en` keys) in a
   `sdk/src/1*-i18n-*.js` file.
2. **Landing:** add the same `<code>` to `public/js/i18n.js` — a row in `LANGS`
   (`['<code>','🏳️','Native name']`) and a matching object in `I18N`.
3. The widget auto-detects via the `zl-lang` cookie → `navigator.language` → `en`;
   the landing's flag dropdown is generated from `LANGS`, so no other wiring is
   needed.

---

## Build & test your change

```bash
node sdk/build.mjs          # rebuild public/v1/install-kit.js
npm start                   # serve at http://localhost:10073
```

Verify detection for a spoofed device with Playwright (no real phone needed for a
first pass — but please confirm copy on a real device before claiming it works):

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:10073');
  console.log(await p.evaluate(() => InstallKit.env()));   // check os/browser/method
  await p.evaluate(() => InstallKit.open());               // eyeball the steps
  await b.close();
})();
```

Checklist before opening a PR:

- [ ] `node sdk/build.mjs` runs clean and the bundle is rebuilt.
- [ ] `InstallKit.env()` reports the right `os` / `browser` / `method` for the target.
- [ ] The steps read correctly in **EN and FR**, in order, with sensible icons.
- [ ] The landing `MATRIX` row is added/updated.
- [ ] PR description names the **device + browser + version** you verified on
      (a screenshot is gold).

---

## Reporting a wrong step (no code)

Not a coder? Still help: open an issue with your **device, browser + version, and
what the menu actually says now** (a screenshot of the share/menu sheet is
perfect). That's enough for someone to land the fix.

## Scope

InstallKit stays a small, dependency-free, accuracy-first widget. Detection +
instruction PRs are always welcome. For larger features (new config options,
analytics, frameworks) open an issue to discuss first.

By contributing you agree your work is licensed under the project's MIT license.
