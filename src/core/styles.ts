// Shadow-root styles. Every length is written at the 520px design and scaled with the element
// through container query units, so the plate looks the same at any width, before any script runs.

const u = (n: number | string) => `calc(${n} * var(--u))`
/** Light that follows the switch: alpha `a` at full brightness, nothing when off. */
const L = (a: number) => `rgba(var(--g), calc(${a} * var(--on)))`
/** A cool, slightly blue shadow colour keeps the pearl clean instead of muddy. */
const C = (a: number) => `rgba(30, 40, 64, ${a})`
/** Every shade of the pearl comes from the one base colour. */
const shade = (pct: number) =>
  pct >= 0 ? `color-mix(in srgb, var(--base), #fff ${pct}%)` : `color-mix(in srgb, var(--base), #000 ${-pct}%)`
/** Pearl caps: the key caps and the rocker halves. */
const pearl = `linear-gradient(180deg, ${shade(70)}, ${shade(-3)})`
const pearlRim = `inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 ${C(0.07)}`
/** A recessed housing in the face: the key well and the switch well. */
const well = `inset 0 1px 2px ${C(0.16)}, inset 0 0 0 0.5px ${C(0.08)}, 0 1px 0 rgba(255,255,255,0.95)`

export const PIXEL_FAMILY = `JBIAcrylicPixel, "Geist Pixel", "Geist Mono", ui-monospace, monospace`

export const STYLES = `
:host { display: block; min-width: 0; }
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }

.root {
  --u: calc(100cqw / 520);
  --base: var(--an-base, #F3F2EF);
  --fit: 1;
  position: relative;
  width: 100%;
  container-type: inline-size;
  -webkit-tap-highlight-color: transparent;
}
.stage { position: relative; perspective: ${u(1200)}; }

/* light thrown on the wall behind, the soft contact shadow and the pool on the desk. Zero-height
   lines with wide soft shadows: shadows never count as overflow, so nothing can widen the page on a phone. */
.wall, .pool { position: absolute; height: 0; pointer-events: none; }
.wall { left: 30%; right: 30%; bottom: ${u(150)}; box-shadow: 0 0 ${u(260)} ${u(130)} ${L(0.07)}; }
.pool { left: 8%; right: 8%; bottom: ${u(2)}; box-shadow: 0 ${u(10)} ${u(28)} ${u(8)} ${C(0.16)}, 0 0 ${u(110)} ${u(40)} ${L(0.06)}; }

.plate { position: relative; transform-style: preserve-3d; transition: transform 600ms cubic-bezier(.22,1,.36,1); }

/* the acrylic: clear, narrower than the base, polished edges; the engraving and the edges carry the light */
.acrylic {
  position: relative; z-index: 1; height: ${u(252)}; margin: 0 ${u(56)} ${u(-6)};
  border-radius: ${u(18)} ${u(18)} ${u(3)} ${u(3)}; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.22)), linear-gradient(0deg, ${L(0.07)}, rgba(var(--g), 0) 50%);
  box-shadow: inset 1px 0 0 rgba(255,255,255,1), inset -1px 0 0 rgba(255,255,255,1), inset 0 0 0 1px ${C(0.08)}, 0 ${u(22)} ${u(36)} ${u(-22)} ${C(0.22)};
}
/* light rising from the LED inside the sheet */
.inner-glow {
  position: absolute; left: 6%; right: 6%; bottom: 0; height: 70%; pointer-events: none; filter: blur(6px);
  background: radial-gradient(60% 90% at 50% 100%, ${L(0.1)}, rgba(var(--g), 0) 100%);
}
/* the top edge face of 5mm acrylic: clear glass when off, the brightest line of light when on */
.edge {
  position: absolute; left: 1px; right: 1px; top: 0; height: ${u(6)};
  border-radius: ${u(17)} ${u(17)} 0 0; border-bottom: 1px solid ${C(0.08)};
  background: linear-gradient(180deg, #ffffff, ${C(0.06)});
}
.edge::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; opacity: var(--on);
  background: linear-gradient(180deg, rgb(var(--g)), rgba(var(--g), 0.55));
  box-shadow: 0 0 6px rgba(var(--g), 0.8), 0 0 20px rgba(var(--g), 0.4);
}
/* centred like a real nameplate: print, name, role on one axis; a little more room below,
   so the block sits just above centre */
.content {
  position: absolute; inset: 0; padding: ${u(18)} ${u(24)} ${u(30)};
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.print {
  position: relative; flex: 0 0 auto; width: ${u(56)}; height: ${u(56)}; margin-bottom: ${u(18)};
  border-radius: ${u(5)}; overflow: hidden; background: #ffffff;
  box-shadow: 0 0 0 ${u(3)} #ffffff, 0 0 0 calc(${u(3)} + 0.5px) ${C(0.12)}, 0 ${u(6)} ${u(14)} ${C(0.18)};
}
.print[hidden] { display: none; }
.print img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: grayscale(1) contrast(1.04) brightness(1.02);
}
.print::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(0deg, ${L(0.12)}, rgba(255,255,255,0) 55%), linear-gradient(115deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 40%);
}
/* the engraving: frosted when off; the lit copy fades in on top, so nothing reflows */
.name {
  position: relative; display: inline-block;
  flex: 0 0 auto; white-space: nowrap; user-select: none; -webkit-user-select: none;
  font-family: var(--an-name-font, ${PIXEL_FAMILY});
  font-weight: var(--an-name-weight, 400);
  letter-spacing: var(--an-name-tracking, -0.045em);
  line-height: 0.86;
  font-size: calc(var(--an-name-size, 78) * var(--fit) * var(--u));
  color: ${C(0.15)};
  text-shadow: 0 1px 0 rgba(255,255,255,0.9);
}
/* the lit lines: a hot core, a tight halo and a soft bloom, plus the engraving reflected off the back face.
   The copy comes from data-text and is left out of the accessible name. */
.name::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute; inset: 0; opacity: var(--on); pointer-events: none;
  color: rgb(var(--g));
  text-shadow: 0 0 1px rgba(var(--g), 0.9), 0 0 5px rgba(var(--g), 0.55), 0 0 18px rgba(var(--g), 0.35), 0 0 48px rgba(var(--g), 0.2), ${u(3)} ${u(-4)} 4px rgba(var(--g), 0.12);
}
.root.pixel .name { font-family: ${PIXEL_FAMILY}; }
.role {
  margin-top: ${u(20)}; max-width: 100%; user-select: none; -webkit-user-select: none;
  font-family: var(--an-role-font, "Geist", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif);
  font-size: calc(var(--an-role-size, 14) * var(--u));
  letter-spacing: 0.06em; line-height: 1.2;
  color: ${C(0.62)};
  text-wrap: balance; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.role[hidden] { display: none; }

/* the pearl base: a lit top surface with the slot, a soft rounded edge, a satin front face */
.base {
  position: relative; height: ${u(66)}; border-radius: ${u(14)}; background: var(--base);
  box-shadow: 0 0 0 0.5px ${C(0.14)}, 0 1px 1px ${C(0.06)}, 0 2px 4px ${C(0.06)}, 0 ${u(8)} ${u(16)} ${u(-4)} ${C(0.1)}, 0 ${u(22)} ${u(40)} ${u(-12)} ${C(0.16)};
}
/* top surface, catching the LED */
.top {
  position: absolute; left: 0; right: 0; top: 0; height: ${u(17)}; border-radius: ${u(14)} ${u(14)} 0 0;
  background: radial-gradient(55% 140% at 50% 30%, ${L(0.22)}, rgba(var(--g), 0)), linear-gradient(180deg, ${shade(80)}, ${shade(10)});
  box-shadow: inset 0 1px 0 #ffffff;
}
/* the slot: a shallow pearl groove the acrylic stands in, its lower lip catching light */
.slot {
  position: absolute; left: ${u(50)}; right: ${u(50)}; top: ${u(5)}; height: ${u(5)}; border-radius: ${u(3)};
  background: linear-gradient(180deg, ${shade(-15)}, ${shade(-5)});
  box-shadow: inset 0 1px 1.5px ${C(0.16)}, inset 0 0 0 0.5px ${C(0.07)}, 0 1px 0 rgba(255,255,255,0.95);
}
/* the LED strip inside the slot: a soft line that fades out towards both ends */
.led {
  position: absolute; left: ${u(62)}; right: ${u(62)}; top: ${u(6.5)}; height: ${u(2)}; border-radius: 99px;
  opacity: var(--on);
  background: linear-gradient(90deg, rgba(var(--g), 0), rgba(var(--g), 0.9) 16%, rgba(var(--g), 0.9) 84%, rgba(var(--g), 0));
  box-shadow: 0 0 ${u(4)} rgba(var(--g), 0.45), 0 ${u(-3)} ${u(12)} rgba(var(--g), 0.25);
}
/* the rounded edge between top and front */
.rim {
  position: absolute; left: ${u(3)}; right: ${u(3)}; top: ${u(17)}; height: ${u(3)};
  background: linear-gradient(180deg, ${C(0.07)}, rgba(255,255,255,0));
}
/* satin front face */
.face {
  position: absolute; left: 0; right: 0; top: ${u(17)}; bottom: 0; border-radius: 0 0 ${u(14)} ${u(14)};
  padding: 0 ${u(22)}; display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(180deg, ${shade(-2)}, var(--base) 45%, ${shade(-6)});
  box-shadow: inset 0 -1px 0 rgba(255,255,255,0.8), inset 0 ${u(-6)} ${u(10)} ${u(-6)} ${C(0.08)};
}
/* maker's mark, etched */
.mark {
  white-space: nowrap; user-select: none; -webkit-user-select: none;
  font-family: var(--an-mark-font, ${PIXEL_FAMILY});
  font-size: calc(var(--an-mark-size, 12) * var(--u)); letter-spacing: -0.02em; line-height: 1;
  color: ${C(0.3)}; text-shadow: 0 1px 0 rgba(255,255,255,0.95);
}
.root.pixel .mark { font-family: ${PIXEL_FAMILY}; }
.controls { display: flex; align-items: center; gap: ${u(12)}; }
/* the indicator: a small lens in the face, lit with the plate */
.dot {
  position: relative; width: ${u(6)}; height: ${u(6)}; border-radius: 50%;
  background: ${shade(-14)};
  box-shadow: inset 0 0.5px 1px ${C(0.3)}, 0 0.5px 0 rgba(255,255,255,0.95);
}
.dot::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; opacity: var(--on);
  background: radial-gradient(circle at 50% 40%, #ffffff 0 18%, rgb(var(--g)) 46%);
  box-shadow: 0 0 ${u(5)} rgba(var(--g), 0.8), 0 0 ${u(12)} rgba(var(--g), 0.35);
}

/* the rocker switch: the halves snap, only the light eases */
.switch {
  appearance: none; -webkit-appearance: none; border: 0; margin: 0; cursor: pointer;
  width: ${u(36)}; height: ${u(22)}; border-radius: ${u(7)}; padding: ${u(3)};
  background: ${shade(-7)}; box-shadow: ${well};
  touch-action: manipulation;
}
.switch:focus { outline: none; }
.switch:focus-visible { outline: 2px solid rgba(var(--g), 0.85); outline-offset: 3px; }
.halves { display: flex; width: 100%; height: 100%; border-radius: ${u(4)}; overflow: hidden; box-shadow: 0 0 0 0.5px ${C(0.14)}, 0 1px 2px ${C(0.16)}; }
.half {
  flex: 1 1 50%;
  background: ${pearl};
  box-shadow: inset 0 calc(${u(2)} * var(--p)) calc(${u(3)} * var(--p)) ${C(0.22)}, inset 0 1px 0 rgba(255,255,255, calc(0.95 - 0.9 * var(--p)));
  filter: brightness(calc(1.02 - 0.07 * var(--p)));
  transition: box-shadow 110ms cubic-bezier(.2,0,0,1), filter 110ms cubic-bezier(.2,0,0,1);
}
/* side "on" is pressed when --sw is 1, so it sinks and the other half rises */
.half.off { --p: calc(1 - var(--sw)); }
.half.on { --p: var(--sw); border-left: 0.5px solid ${C(0.14)}; }

/* the links: small pearl keys in one recessed housing, backlit by the same light as the plate */
.keys {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; gap: ${u(3)}; padding: ${u(3)}; border-radius: ${u(8)};
  background: ${shade(-7)}; box-shadow: ${well};
}
.keys[hidden] { display: none; }
.key {
  display: block; border-radius: 5px; appearance: none; -webkit-appearance: none; border: 0; padding: 0; margin: 0;
  background: none; cursor: pointer; color: inherit; text-decoration: none;
}
.key.email { cursor: copy; }
.cap {
  position: relative; display: grid; place-items: center; width: ${u(30)}; height: ${u(22)}; border-radius: ${u(5)};
  background: ${pearl};
  box-shadow: ${pearlRim}, 0 0 0 0.5px ${C(0.12)}, 0 1px 2px ${C(0.14)};
  transition: transform .12s cubic-bezier(.2,0,0,1), filter .2s ease;
}
/* each icon is drawn twice: a grey line, and the lit line fading in on top */
.icon {
  display: block; width: ${u(15)}; height: ${u(15)}; overflow: visible;
  filter: drop-shadow(0 0 calc(2.5px * var(--on)) rgba(var(--g), calc(0.55 * var(--on))));
}
.icon path { fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.icon .dim { stroke: ${C(0.42)}; }
.icon .lit { stroke: rgb(var(--g)); opacity: var(--on); }
.key:hover .cap { filter: brightness(1.035); }
.key:active .cap { transform: translateY(0.5px); filter: brightness(0.97); }
.key:focus { outline: none; }
.key:focus-visible { outline: 2px solid rgba(var(--g), 0.85); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .plate, .half, .cap { transition: none; }
}
`
