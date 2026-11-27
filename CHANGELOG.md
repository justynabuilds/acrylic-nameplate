# Changelog

All notable changes to this project are listed here. Versions follow [semantic versioning](https://semver.org).

## Unreleased

- Pearl finish with a neon orange light; the dark finish is gone. New defaults: `light` is `#FF5A28` and `base` is `#F3F2EF`. Use the plate on a light background.
- The light strikes pale and reaches its full colour in about 620 ms, like a neon tube, instead of going from cool to warm. In the core, `warmAt`, `WARM_MS` and `COOL` are replaced by `strikeAt`, `STRIKE_MS` and `PALE`.
- With the light off the name is a frosted engraving; the lit name, top edge, LED strip, key icons and indicator fade in over it.
- Key icons redrawn to one size: all five fill the same 16px box, and LinkedIn is a rounded square like Instagram.
- The demo, playground and self-test are on a light page, and the demo has a new example portrait.
- The job title uses Geist (or the system sans) instead of the page font, so it never falls back to a serif on a bare page.
- Tilt is now off by default; set `tilt="on"` to turn it back on.
- The demo and playground start with an example photo and example links.

## 0.1.0

First version.

- `<acrylic-nameplate>` web component and a React adapter on one framework-free core, plus the Framer code component in `framer/`.
- Edge-lit acrylic plate with the name, an optional job title and photo print, on a machined base with an etched mark.
- Rocker switch: the rocker snaps, the light eases over 640 ms and warms from cool to the chosen colour. Synthesized click and a short haptic buzz.
- Backlit link keys for email, X, LinkedIn, Instagram and Framer; the email key copies the address.
- Long names shrink to fit; every size scales from a 520px design; the glow never causes sideways scroll.
- Built-in Geist Pixel face, inlined in the script.
- `turnon`, `turnoff` and `emailcopy` events, `on` property and `toggle()` method, reduced-motion support.
- Demo, props playground and an in-browser self-test.
