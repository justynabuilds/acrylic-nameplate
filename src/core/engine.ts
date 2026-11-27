// Pure logic for the nameplate: colour parsing, fitting the name, and the light's easing.
// No DOM here, so all of it runs under node --test.

/** The plate is drawn at this width (px) and every size scales with the element's width. */
export const DESIGN = 520
export const DEFAULT_LIGHT = "#FFF4E4"
export const DEFAULT_BASE = "#2B2B29"
export const DEFAULT_NAME_SIZE = 78
/** An LED starts cool and settles warm. */
export const COOL: readonly [number, number, number] = [176, 206, 255]
/** How long the light takes to ease on or off. */
export const LIGHT_MS = 640
/** How long the colour takes to go from cool to the chosen light. */
export const WARM_MS = 620

const FALLBACK_RGB = "255, 244, 228"

/** Any CSS colour a person is likely to type (hex, rgb(), var(--x, fallback)) as "r, g, b". */
export function toRGB(color: string | null | undefined, fallback = FALLBACK_RGB): string {
  const c = String(color ?? "").trim()
  if (!c) return fallback
  const inner = c.match(/var\([^,]+,\s*(.+)\)$/)
  const v = inner ? inner[1].trim() : c
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ")
  }
  if (!/^rgba?\(/i.test(v)) return fallback
  const rgb = v.match(/[\d.]+/g)
  return rgb && rgb.length >= 3 ? rgb.slice(0, 3).map((n) => String(Math.round(Math.min(255, +n)))).join(", ") : fallback
}

/** Room for the name inside the acrylic at the design width: plate inset 56 and padding 24 a side. */
export const NAME_ROOM = DESIGN - 2 * 56 - 2 * 24

/** A first guess at how much a long name must shrink, before the browser can measure it. */
export function guessFit(name: string, size = DEFAULT_NAME_SIZE): number {
  const chars = Math.max(1, Array.from(name || "").length)
  return Math.min(1, NAME_ROOM / (chars * size * 0.6))
}

/** The measured scale for the name: never larger than 1, with a 2% margin so glyph edges stay inside. */
export function fitRatio(room: number, natural: number): number {
  if (!(natural > 0) || !(room > 0)) return 1
  return Math.min(1, (room * 0.98) / natural)
}

const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3)
const easeOutQuad = (k: number) => 1 - Math.pow(1 - k, 2)
const clamp01 = (k: number) => Math.min(1, Math.max(0, k))

/** The light level `elapsed` ms after the switch flipped, easing from `from` to `to`. */
export function lightAt(from: number, to: number, elapsed: number): { value: number; done: boolean } {
  const k = clamp01(elapsed / LIGHT_MS)
  return { value: from + (to - from) * easeOutCubic(k), done: k >= 1 }
}

/** The light's colour while switching on: cool first, the chosen colour by about a third of a second. */
export function warmAt(elapsed: number, warm: string): string {
  const target = warm.split(",").map((n) => parseFloat(n))
  const e = easeOutQuad(clamp01(elapsed / WARM_MS))
  return COOL.map((c, i) => Math.round(c + ((target[i] ?? c) - c) * e)).join(", ")
}

export const LINK_KEYS = ["email", "x", "linkedin", "instagram", "framer"] as const
export type LinkKey = (typeof LINK_KEYS)[number]

/** A link field as an href. A plain address in the email field becomes a mailto: link. */
export function linkHref(key: LinkKey, raw: string | null | undefined): string {
  const v = String(raw ?? "").trim()
  if (key === "email" && v && v.includes("@") && !v.includes(":")) return `mailto:${v}`
  return v
}

/** The address an email key copies. */
export function emailAddress(href: string): string {
  return href.replace(/^mailto:/i, "").split("?")[0]
}

/** On/off attributes: missing keeps the default, "off", "false", "no" and "0" turn it off. */
export function flag(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null) return fallback
  return !/^(off|false|no|0)$/i.test(value.trim())
}
