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

  .sheet{ width:100%; max-width:460px; background:var(--ik-bg); color:var(--ik-text);
    border:1px solid var(--ik-line); border-bottom:none; border-radius:18px 18px 0 0;
    box-shadow:0 -10px 50px rgba(0,0,0,.5); padding:22px 22px 26px;
    transform:translateY(100%); transition:transform .3s cubic-bezier(.22,.61,.36,1);
    max-height:92vh; overflow:auto; }
  @media(min-width:721px){ .sheet{ border-radius:18px; border-bottom:1px solid var(--ik-line);
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
