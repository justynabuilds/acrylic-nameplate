# Acrylic Nameplate

Your name engraved in a clear acrylic plate that stands in a machined metal base. An LED in the base lights the plate from its bottom edge, so the engraving glows and the light fades as it travels up. A photo sits behind the acrylic as a small black and white print. The rocker switch on the base turns the light off and on: the switch snaps, the light eases, and it comes on slightly cool before it settles warm, like a real LED. Small backlit keys on the base can hold your links, and the email key copies your address.

It ships as a plain web component that works on any site (Webflow embed, WordPress, Squarespace, Shopify, plain HTML) and as a React component. Both run on the same framework-free core and render inside a shadow root, so the host site's CSS can't break them. The Framer version lives in [`framer/AcrylicNameplate.tsx`](framer/AcrylicNameplate.tsx).

**[Live demo](https://acrylic-nameplate.vercel.app)** · **[Playground](https://acrylic-nameplate.vercel.app/playground)** (every option in a panel, with copyable HTML and React code)

## Quick start

Any site, including a Framer or Webflow embed. The script is served from the live demo, so this works as pasted. The plate is made for a dark background and fills the width you give it; 520px looks best.

```html
<script src="https://acrylic-nameplate.vercel.app/acrylic-nameplate.iife.js"></script>

<acrylic-nameplate
  style="width: 100%; max-width: 520px"
  name="nadia"
  job-title="product designer"
  email="hi@yoursite.com"
  linkedin="https://www.linkedin.com/in/you"
></acrylic-nameplate>
```

React:

```tsx
import { AcrylicNameplate } from "@justbuilt/acrylic-nameplate/react"

<AcrylicNameplate
  name="nadia"
  jobTitle="product designer"
  links={{ email: "hi@yoursite.com", linkedin: "https://www.linkedin.com/in/you" }}
  style={{ maxWidth: 520 }}
  onTurnOff={() => console.log("lights out")}
/>
```

The Geist Pixel font for the name is inlined in the script, so there is nothing else to host. To host the script yourself, build it with `npm run build` (see [Development](#development)) and point the `src` at your copy; `acrylic-nameplate.js` is the ES module version.

## Attributes

| Attribute | Default | |
| --- | --- | --- |
| `name` | empty | Engraved in the acrylic. A long name shrinks to fit. |
| `job-title` | empty | Small line under the name, up to two lines. Leave out for none. |
| `photo` | empty | Image URL, shown as a black and white print above the name. Leave out for none. |
| `photo-alt` | the name | Alt text for the photo. |
| `mark` | empty | Etched into the front of the base, on the left. |
| `email` | empty | A plain address or a `mailto:` link. Its key copies the address. |
| `x`, `linkedin`, `instagram`, `framer` | empty | Links. Each one opens in a new tab. |
| `light` | `#FFF4E4` | Colour of the light inside the acrylic, the LED and the keys. |
| `base` | `#2B2B29` | Colour of the metal base. Its highlights and shade are mixed from it. |
| `start` | `on` | `off` starts with the light off. Changing it later sets the light without easing. |
| `tilt` | `off` | `on` turns the plate a little toward the mouse. |
| `sound` | `on` | `off` silences the switch click. |
| `haptics` | `on` | `off` stops the short buzz on phones that support it. |
| `pixel-face` | `on` | `off` drops the built-in Geist Pixel, so the name and mark use `--an-name-font` and `--an-mark-font` (or your site's font). |

Keys appear on the base only for the links you set, in the order email, X, LinkedIn, Instagram, Framer. With no links there are no keys.

The element also has an `on` property (get and set, eases like the switch) and a `toggle(force?)` method. React props use camelCase (`jobTitle`, `photoAlt`, `startOn`, `pixelFace`), links go in one `links` object, and on/off attributes are booleans.

## Events

| Event | `detail` | |
| --- | --- | --- |
| `turnon` | none | The switch turned the light on. |
| `turnoff` | none | The switch turned the light off. |
| `emailcopy` | `{ address }` | The email key copied the address. (Not `copy`, so it never mixes with the browser's own clipboard event.) |

In React: `onTurnOn`, `onTurnOff` and `onCopy`.

## Styling

Set these on the element or any parent.

| Property | Default |
| --- | --- |
| `--an-light` | `#FFF4E4` (read when the element connects or an attribute changes; the `light` attribute wins) |
| `--an-base` | `#2B2B29` (the `base` attribute sets it too) |
| `--an-name-size` | `78` (unitless, px at a 520px plate; scales with the plate) |
| `--an-name-font` | Geist Pixel (used when `pixel-face="off"`) |
| `--an-name-weight` | `400` |
| `--an-name-tracking` | `-0.045em` |
| `--an-role-font` | `inherit` |
| `--an-role-size` | `14` (unitless, px at a 520px plate) |
| `--an-mark-font` | Geist Pixel (used when `pixel-face="off"`) |
| `--an-mark-size` | `12` (unitless, px at a 520px plate) |

For deeper styling use the parts `::part(plate)`, `::part(acrylic)`, `::part(print)`, `::part(name)`, `::part(role)`, `::part(base)`, `::part(mark)`, `::part(keys)`, `::part(key)` (each also has `key-email`, `key-x` and so on) and `::part(switch)`.

## Behaviour and accessibility

- Every size is set from a 520px design in container query units, so the plate keeps its proportions at any width and paints at the right size before the script measures anything.
- The glow on the wall and the desk is drawn as shadows of zero-height lines. Shadows never count as overflow, so the plate can't make a phone page scroll sideways.
- The switch is a real `button` with `role="switch"` and `aria-checked`: Space and Enter flip it, and a focus ring shows for the keyboard only. The rocker snaps at once; the light eases over 640 ms.
- Link keys are real links with labels that say where they go and that they open in a new tab. The email key is a button labelled "Copy …", and its icon turns into a tick for a moment after copying.
- Tilt follows a mouse only. Touch and pen never tilt it.
- `prefers-reduced-motion`: the light switches without easing and the plate never tilts.
- The click sound is synthesized (filtered noise, no audio file). The audio context is made on pointer down, before the click, so starting it never stalls the light.

## How the code is organised

```
src/core/engine.ts                        colour parsing, name fitting, light easing; no DOM, unit-tested
src/core/styles.ts                        shadow-root styles and the --an-* hooks
src/element/acrylic-nameplate-element.ts  the <acrylic-nameplate> custom element
src/element/index.ts                      registers the element; the library entry point
src/react/AcrylicNameplate.tsx            React adapter
framer/AcrylicNameplate.tsx               the Framer code component (same look, Framer property controls)
fonts/                                    Geist Pixel and its SIL Open Font License
index.html, demo/                         demo page, props playground, in-browser self-test
test/engine.test.ts                       unit tests (node --test)
vite.config.ts                            library build (dist/)
vite.site.config.ts, vercel.json          demo site build and hosting
```

The core knows nothing about the page: it turns colours into numbers, guesses and measures how far a long name must shrink, and says how bright and how warm the light is at each moment. The element reads attributes, renders the plate into its shadow root and drives the light frame by frame with the core. The React adapter only maps props and events onto the element. The Framer file is a separate React component with the same drawing, kept here so both versions live together.

## Development

Requires Node 22.18 or newer (see `.nvmrc`) and npm.

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Demo at http://localhost:4176, playground at `/demo/playground.html`, self-test at `/demo/selftest.html`. |
| `npm test` | Core unit tests. |
| `npm run typecheck` | TypeScript check. |
| `npm run build` | `dist/acrylic-nameplate.js` (ESM), `dist/acrylic-nameplate.iife.js` (script tag) and `dist/types`. |
| `npm run build:site` | The demo site Vercel serves (`site-dist`): `/`, `/playground`, `/demo/selftest.html`, plus `/acrylic-nameplate.iife.js` and `/acrylic-nameplate.js` for embeds. |

Typecheck, tests and build also run on GitHub for every push. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to make a change and [CHANGELOG.md](CHANGELOG.md) for what changed.

## License

Free for personal and other non-commercial use under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). Commercial use (client work, products, sites that make money) needs a paid license: open an issue to ask. The bundled Geist Pixel font is under the [SIL Open Font License 1.1](fonts/OFL.txt). The example portrait in the demo (`public/example-portrait.jpg`) is from [Unsplash](https://unsplash.com/license).
