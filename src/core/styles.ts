// Shadow-root styles. Every length is written at the 520px design and scaled with the element
// through container query units, so the plate looks the same at any width, before any script runs.

const u = (n: number | string) => `calc(${n} * var(--u))`
/** Light that follows the switch: alpha `a` at full brightness, nothing when off. */
const L = (a: number) => `rgba(var(--g), calc(${a} * var(--on)))`
/** Every shade of the base comes from one colour, so any finish still reads as lit metal. */
const shade = (pct: number) =>
  pct >= 0 ? `color-mix(in srgb, var(--base), #fff ${pct}%)` : `color-mix(in srgb, var(--base), #000 ${-pct}%)`

export const PIXEL_FAMILY = `JBIAcrylicPixel, "Geist Pixel", "Geist Mono", ui-monospace, monospace`

export const STYLES = `
:host { display: block; min-width: 0; }
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }

.root {
  --u: calc(100cqw / 520);
  --base: var(--an-base, #2B2B29);
  --fit: 1;
  position: relative;
  width: 100%;
  container-type: inline-size;
  -webkit-tap-highlight-color: transparent;
}
.stage { position: relative; perspective: ${u(1200)}; }

/* light thrown on the wall behind and the desk in front. Zero-height lines with wide soft
   shadows: shadows never count as overflow, so the glow can't widen the page on a phone. */
.wall, .pool { position: absolute; height: 0; pointer-events: none; }
.wall { left: 30%; right: 30%; bottom: ${u(150)}; box-shadow: 0 0 ${u(280)} ${u(150)} ${L(0.08)}; }
.pool { left: 22%; right: 22%; bottom: ${u(4)}; box-shadow: 0 0 ${u(40)} ${u(18)} ${L(0.14)}, 0 0 ${u(120)} ${u(50)} ${L(0.05)}; }

.plate { position: relative; transform-style: preserve-3d; transition: transform 600ms cubic-bezier(.22,1,.36,1); }

/* the acrylic: clear, narrower than the base, polished edges; only the edges and the engraving carry light */
.acrylic {
  position: relative; z-index: 1; height: ${u(252)}; margin: 0 ${u(56)} ${u(-6)};
  border-radius: ${u(18)} ${u(18)} ${u(3)} ${u(3)}; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008) 55%, ${L(0.06)});
  box-shadow: inset 1px 0 0 rgba(255,255,255,0.14), inset -1px 0 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.06), 0 0 0 0.5px rgba(255,255,255,0.06);
}
.inner-glow {
  position: absolute; left: 6%; right: 6%; bottom: 0; height: 70%; pointer-events: none; filter: blur(6px);
  background: radial-gradient(60% 100% at 50% 100%, ${L(0.2)}, rgba(var(--g), 0) 100%);
}
/* the top edge face of 5mm acrylic: brightest at the polished rim */
.edge {
  position: absolute; left: 1px; right: 1px; top: 0; height: ${u(6)};
  border-radius: ${u(17)} ${u(17)} 0 0; border-bottom: 1px solid rgba(0,0,0,0.55);
  background: linear-gradient(180deg, rgba(var(--g), calc(0.25 + 0.75 * var(--on))), rgba(var(--g), calc(0.1 + 0.45 * var(--on))));
  box-shadow: 0 0 6px ${L(0.9)}, 0 0 22px ${L(0.5)};
}
/* centred like a real nameplate: print, name, role on one axis; a little more room below,
   so the block sits just above centre. Edge light falls off as it travels up the acrylic. */
.content {
  position: absolute; inset: 0; padding: ${u(18)} ${u(24)} ${u(30)};
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  -webkit-mask-image: linear-gradient(0deg, #000 35%, rgba(0,0,0,0.42) 100%);
  mask-image: linear-gradient(0deg, #000 35%, rgba(0,0,0,0.42) 100%);
}
.print {
  position: relative; flex: 0 0 auto; width: ${u(56)}; height: ${u(56)}; margin-bottom: ${u(18)};
  border-radius: ${u(4)}; overflow: hidden; background: ${shade(-10)};
  box-shadow: 0 0 0 ${u(3)} rgba(240,236,228,0.9), 0 ${u(6)} ${u(14)} rgba(0,0,0,0.5);
}
.print[hidden] { display: none; }
.print img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: grayscale(1) contrast(1.05) brightness(calc(0.55 + 0.4 * var(--on)));
}
.print::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(0deg, ${L(0.18)}, rgba(255,255,255,0) 60%), linear-gradient(115deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%);
}
.name {
  flex: 0 0 auto; white-space: nowrap; user-select: none; -webkit-user-select: none;
  font-family: var(--an-name-font, ${PIXEL_FAMILY});
  font-weight: var(--an-name-weight, 400);
  letter-spacing: var(--an-name-tracking, -0.045em);
  line-height: 0.86;
  font-size: calc(var(--an-name-size, 78) * var(--fit) * var(--u));
  color: rgba(var(--g), calc(0.16 + 0.84 * var(--on)));
  /* engraved lines glow hottest at the core, then a tight halo and a soft bloom;
     the last one is the engraving reflected off the back face */
  text-shadow: 0 0 1px rgba(255,255,255, calc(0.9 * var(--on))), 0 0 6px ${L(0.75)}, 0 0 22px ${L(0.45)}, 0 0 60px ${L(0.25)}, ${u(3)} ${u(-4)} 4px ${L(0.1)};
}
.root.pixel .name { font-family: ${PIXEL_FAMILY}; }
.role {
  margin-top: ${u(20)}; max-width: 100%; user-select: none; -webkit-user-select: none;
  font-family: var(--an-role-font, "Geist", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif);
  font-size: calc(var(--an-role-size, 14) * var(--u));
  letter-spacing: 0.06em; line-height: 1.2;
  color: rgba(var(--g), calc(0.3 + 0.55 * var(--on)));
  text-shadow: 0 0 6px ${L(0.5)};
  text-wrap: balance; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.role[hidden] { display: none; }

/* the machined base: a lit top surface with the slot, a chamfer, a brushed front face */
.base {
  position: relative; height: ${u(66)}; border-radius: ${u(14)};
  box-shadow: 0 0 0 1px rgba(0,0,0,0.85), 0 2px 2px rgba(0,0,0,0.35), 0 4px 4px rgba(0,0,0,0.3), 0 8px 8px rgba(0,0,0,0.28), 0 16px 16px rgba(0,0,0,0.26), 0 32px 32px rgba(0,0,0,0.22);
}
.top {
  position: absolute; left: 0; right: 0; top: 0; height: ${u(16)}; border-radius: ${u(14)} ${u(14)} 0 0;
  background: radial-gradient(55% 140% at 50% 30%, ${L(0.3)}, rgba(var(--g), 0)), linear-gradient(180deg, ${shade(15)}, ${shade(7)});
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
}
.slot {
  position: absolute; left: ${u(50)}; right: ${u(50)}; top: ${u(5)}; height: ${u(5)}; border-radius: ${u(3)};
  background: ${shade(-82)}; box-shadow: inset 0 1px 1px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12);
}
.led {
  position: absolute; left: ${u(58)}; right: ${u(58)}; top: ${u(7)}; height: 1px; border-radius: 1px;
  background: ${L(0.95)}; box-shadow: 0 0 6px ${L(0.9)}, 0 -4px 14px ${L(0.6)};
}
.chamfer {
  position: absolute; left: ${u(2)}; right: ${u(2)}; top: ${u(16)}; height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.04));
}
.face {
  position: absolute; left: 0; right: 0; top: ${u(17)}; bottom: 0; border-radius: 0 0 ${u(14)} ${u(14)};
  padding: 0 ${u(22)}; display: flex; align-items: center; justify-content: space-between;
  background: repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px), linear-gradient(180deg, var(--base), ${shade(-40)} 70%, ${shade(-53)});
  box-shadow: inset 0 -2px 3px rgba(0,0,0,0.55);
}
/* maker's mark, etched */
.mark {
  white-space: nowrap; user-select: none; -webkit-user-select: none;
  font-family: var(--an-mark-font, ${PIXEL_FAMILY});
  font-size: calc(var(--an-mark-size, 12) * var(--u)); letter-spacing: -0.02em; line-height: 1;
  color: rgba(255,255,255,0.16); text-shadow: 0 -1px 0 rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05);
}
.root.pixel .mark { font-family: ${PIXEL_FAMILY}; }
.controls { display: flex; align-items: center; gap: ${u(12)}; }
/* the indicator: glows with the light */
.dot {
  width: ${u(5)}; height: ${u(5)}; border-radius: 50%;
  background: rgba(var(--g), calc(0.12 + 0.88 * var(--on)));
  box-shadow: 0 0 ${u(6)} ${L(0.9)}, inset 0 0 0 0.5px rgba(0,0,0,0.4);
}

/* the rocker switch: the halves snap, only the light eases */
.switch {
  appearance: none; -webkit-appearance: none; border: 0; margin: 0; cursor: pointer;
  width: ${u(34)}; height: ${u(20)}; border-radius: ${u(5)}; padding: ${u(2)};
  background: ${shade(-75)}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08);
  touch-action: manipulation;
}
.switch:focus { outline: none; }
.switch:focus-visible { outline: 2px solid rgba(var(--g), 0.8); outline-offset: 3px; }
.halves { display: flex; width: 100%; height: 100%; border-radius: ${u(4)}; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.7); }
.half {
  flex: 1 1 50%;
  background: linear-gradient(180deg, rgba(255,255,255, calc(0.2 - 0.14 * var(--p))), rgba(255,255,255,0) 70%), linear-gradient(180deg, ${shade(6)}, ${shade(-20)});
  box-shadow: inset 0 calc(${u(2)} * var(--p)) calc(${u(3)} * var(--p)) rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255, calc(0.22 - 0.2 * var(--p)));
  filter: brightness(calc(1.12 - 0.3 * var(--p)));
  transition: box-shadow 110ms cubic-bezier(.2,0,0,1), filter 110ms cubic-bezier(.2,0,0,1), background 110ms cubic-bezier(.2,0,0,1);
}
/* side "on" is pressed when --sw is 1, so it sinks and the other half rises */
.half.off { --p: calc(1 - var(--sw)); }
.half.on { --p: var(--sw); border-left: 1px solid rgba(0,0,0,0.6); }
.switch:active .half { filter: brightness(0.9); }

/* the links: small keys in one recessed housing, backlit by the same light as the plate */
.keys {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; gap: ${u(3)}; padding: ${u(3)}; border-radius: ${u(7)};
  background: ${shade(-75)}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08);
}
.keys[hidden] { display: none; }
.key {
  display: block; border-radius: 4px; appearance: none; -webkit-appearance: none; border: 0; padding: 0; margin: 0;
  background: none; cursor: pointer; color: inherit; text-decoration: none;
}
.key.email { cursor: copy; }
.cap {
  display: grid; place-items: center; width: ${u(30)}; height: ${u(22)}; border-radius: ${u(5)};
  background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%), linear-gradient(180deg, ${shade(6)}, ${shade(-20)});
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.7);
  transition: transform .08s ease, box-shadow .08s ease, filter .2s ease;
}
.icon {
  display: block; width: ${u(15)}; height: ${u(15)};
  color: rgba(var(--g), calc(0.22 + 0.78 * var(--on)));
  filter: drop-shadow(0 0 calc(3px * var(--on)) rgba(var(--g), calc(0.75 * var(--on))));
}
.key:hover .cap { filter: brightness(1.14); }
.key:active .cap { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 rgba(0,0,0,0); filter: brightness(0.9); }
.key:focus { outline: none; }
.key:focus-visible { outline: 2px solid rgba(var(--g), 0.8); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .plate, .half, .cap { transition: none; }
}
`
