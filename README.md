# InstallKit

**Accurate, per-device PWA install instructions — as a drop-in SDK widget.**

Drop one `<script>` tag onto any site and every visitor sees the *exact, correct*
way to install it as an app on **their** real device: a native one-tap prompt
where the browser supports it, precise manual steps everywhere else, and an
honest message when installing simply isn't possible.

Live: **<https://install.zlef.fr>** · ~13 kB gzipped · zero dependencies · MIT.

## Quick start

```html
<!-- add before </body> -->
<script src="https://install.zlef.fr/v1/install-kit.js" data-app-name="Your App"></script>
```

Recommended (captures Chrome's install event before our script loads):

```html
<script>window.__ik=window.__ik||{};addEventListener('beforeinstallprompt',e=>{e.preventDefault();__ik.deferred=e},{once:true});</script>
<script src="https://install.zlef.fr/v1/install-kit.js"
        data-app-name="Your App" data-position="bottom-right" data-accent="#9dae50"></script>
```

### Configuration (`data-*`)

| Attribute | Default | What it does |
|---|---|---|
| `data-app-name` | — | Your app's name, used throughout the copy |
| `data-icon` | — | URL of a square icon shown in the sheet header |
| `data-position` | `bottom-right` | `bottom-right` / `-left` / `-center` / `inline` |
| `data-accent` | olive | Accent colour (any CSS colour) |
| `data-theme` | `auto` | `auto` / `dark` / `light` |
| `data-mode` | `auto` | `auto` shows a launcher; `manual` = you call `InstallKit.open()` |
| `data-delay` | `1200` | ms before the launcher appears |
| `data-remind-after` | `3` | days to stay hidden after a dismiss |
| `data-analytics` | `false` | opt-in anonymous funnel (counts only, no PII) |

### JS API

```js
InstallKit.open()            // open the sheet on demand
InstallKit.canInstall()      // false if already installed / unsupported
InstallKit.env()             // the full detection object (os, browser, method…)
InstallKit.on(evt, fn)       // ready | open | close | choice | installed | dismiss
InstallKit.config({ … })     // override config at runtime
```

## What makes it accurate

InstallKit resolves the visitor's real environment (UA-Client-Hints first, then a
careful UA fallback) and picks **one** install path:

| `method` | When | What the widget shows |
|---|---|---|
| `native` | Chromium captured `beforeinstallprompt` | One-tap **Install** button |
| `manual` | No prompt available | The exact taps for that device/browser |
| `open-in-browser` | In-app webview (Instagram, Facebook, TikTok, LINE…) | "Open in your real browser first" |
| `unsupported` | Desktop Firefox, iOS Firefox, non-Safari macOS | An honest message + alternative |
| `installed` | Already running as an app | Stays hidden |

It handles the cases generic banners get wrong — **iPadOS that reports itself as a
Mac**, in-app browsers, macOS Safari's "Add to Dock", Firefox honesty.

## Project layout

```
sdk/src/        SDK source (concatenated into one IIFE by sdk/build.mjs)
  20-detect.js        device/browser detection + method resolution
  30-instructions.js  method+platform → ordered step list
  10-i18n.js          all UI + step copy (EN + FR)
  40-icons.js         inline step icons
  50-styles.js        shadow-DOM CSS
  60-widget.js        the <install-kit> custom element
  90-boot.js          prompt capture, config, public API
public/         landing page, docs, the built SDK (public/v1/) and a checker
lib/            tiny Express helpers (installability checker, opt-in stats)
server.js       serves the SDK (CORS) + landing + /api/check
```

Build the SDK bundle:

```bash
node sdk/build.mjs        # → public/v1/install-kit.js
```

Run locally:

```bash
npm install && npm start  # http://localhost:10073
# or: docker compose up -d --build
```

## Contributing

The per-platform install instructions are **community-maintained** — browsers
change their menus and we want the steps to stay correct. See
**[CONTRIBUTING.md](CONTRIBUTING.md)** for exactly how to add or fix the steps for
a platform. Corrections from people on real devices are the most valuable
contribution you can make.

## License

MIT.
