// Shared visual tokens and CRT glass for Solo, Multiplayer, and High Scores.
// Adjust global appearance here; keep screen-specific layouts in their HTML.
export const designCss = `:root{
 --bricks-font:'Press Start 2P',ui-monospace,monospace;
 --bricks-bg:#030504;
 --bricks-ink:#d7e0dc;
 --bricks-quiet:#84958e;
 --bricks-dim:#62736d;
 --bricks-line:#33423c;
 --bricks-accent:#b8d9c9;
 --bricks-panel:#070b0aec;
 --bricks-panel-border:#52665977;
 --bricks-menu-ink:#c0d0c6;
 --bricks-radius:2px;
 --bricks-crt-radius:4% / 3%;
}

/* Shared CRT glass: text and overlays are part of the same display. */
html,body,body *{font-family:var(--bricks-font)!important}
#crt{
 display:block;position:fixed;inset:0;z-index:60;pointer-events:none;
 border-radius:var(--bricks-crt-radius);opacity:1;
 background:
  repeating-linear-gradient(0deg,rgba(0,0,0,.27) 0 1px,transparent 1px 4px),
  repeating-linear-gradient(90deg,rgba(255,92,82,.016) 0 1px,rgba(86,255,168,.014) 1px 2px,rgba(88,138,255,.016) 2px 3px),
  radial-gradient(ellipse 82% 74% at 50% 46%,transparent 43%,rgba(0,0,0,.14) 70%,rgba(0,0,0,.66) 100%);
 box-shadow:inset 0 0 0 1px #c2f1d20f,inset 0 0 30px #0007,inset 0 0 105px 12px #0008;
 mix-blend-mode:normal;
 animation:crtGlassFlicker 8s steps(16,end) infinite;
}
#crt::before{
 content:'';position:absolute;inset:0;border-radius:inherit;
 background:radial-gradient(ellipse 78% 55% at 50% -10%,#c9fbe010,transparent 88%);
 box-shadow:inset 0 2px 10px #cfffe00b,inset 0 -5px 25px #0005;
}
#crt::after{
 content:'';position:absolute;inset:0;border-radius:inherit;
 background:linear-gradient(to bottom,transparent 42%,#d2f9e30b 50%,transparent 58%);
 background-size:100% 19%;background-repeat:no-repeat;
 transform:skewY(-.18deg);filter:blur(.35px);
 animation:crtGlassRoll 13s linear infinite;
}
@keyframes crtGlassFlicker{0%,19%,22%,100%{opacity:1}20%{opacity:.94}21%{opacity:.98}}
@keyframes crtGlassRoll{from{background-position:0 -25%}to{background-position:0 125%}}
@media(prefers-reduced-motion:reduce){#crt{display:block!important;animation:none!important}#crt::after{animation:none!important}}
`;

export function withDesign(html){
 if(html.includes('id="bricks-design"'))return html;
 return html.replace('</head>','<style id="bricks-design">\\n'+designCss+'\\n</style>\\n</head>');
}
