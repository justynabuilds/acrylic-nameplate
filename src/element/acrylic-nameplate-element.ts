import pixelFontUrl from "../../fonts/GeistPixel-Square.woff2?url"
import {
  DEFAULT_LIGHT,
  DEFAULT_NAME_SIZE,
  LINK_KEYS,
  emailAddress,
  fitRatio,
  flag,
  guessFit,
  lightAt,
  linkHref,
  toRGB,
  warmAt,
  type LinkKey,
} from "../core/engine.ts"
import { STYLES } from "../core/styles.ts"

export interface NameplateCopyDetail {
  address: string
}

// Line icons on a 24px grid, one stroke weight, so the set reads as one family
const ICONS: Record<LinkKey, { label: string; path: string }> = {
  email: { label: "Email", path: "M4.5 6.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z M4 7.5l8 5.5 8-5.5" },
  x: { label: "X", path: "M4.5 4.5h4l11 15h-4z M19 4.5l-6.2 7 M5 19.5l6.2-7" },
  linkedin: { label: "LinkedIn", path: "M7.5 10.5v7 M7.5 6.75v.01 M11.5 17.5v-7 M11.5 13.5a3 3 0 0 1 6 0v4" },
  instagram: { label: "Instagram", path: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5z M16.75 7.25v.01" },
  framer: { label: "Framer", path: "M6.5 3.5h11v6h-5.5z M6.5 9.5h5.5l5.5 5.5h-11z M6.5 15h5.5v5.5z" },
}
const TICK = "M5 12.5l4.5 4.5L19 7.5"
const SVG_NS = "http://www.w3.org/2000/svg"

const TEMPLATE = `
<div class="root pixel" part="root">
  <div class="stage">
    <div class="wall" aria-hidden="true"></div>
    <div class="pool" aria-hidden="true"></div>
    <div class="plate" part="plate">
      <div class="acrylic" part="acrylic">
        <div class="inner-glow" aria-hidden="true"></div>
        <div class="edge" aria-hidden="true"></div>
        <div class="content">
          <div class="print" part="print" hidden><img alt="" draggable="false" decoding="async"></div>
          <span class="name" part="name"></span>
          <span class="role" part="role"></span>
        </div>
      </div>
      <div class="base" part="base">
        <div class="top" aria-hidden="true"></div>
        <div class="slot" aria-hidden="true"></div>
        <div class="led" aria-hidden="true"></div>
        <div class="chamfer" aria-hidden="true"></div>
        <div class="face">
          <nav class="keys" part="keys" aria-label="Links" hidden></nav>
          <span class="mark" part="mark"></span>
          <div class="controls">
            <span class="dot" aria-hidden="true"></span>
            <button type="button" class="switch" part="switch" role="switch" aria-label="Light" aria-checked="true">
              <span class="halves" aria-hidden="true"><span class="half off"></span><span class="half on"></span></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`

let fontAdded = false
// @font-face doesn't work inside a shadow root, so the pixel face is declared once on the page
function addPixelFont() {
  if (fontAdded || typeof document === "undefined") return
  fontAdded = true
  const style = document.createElement("style")
  style.dataset.acrylicNameplate = ""
  style.textContent = `@font-face { font-family: JBIAcrylicPixel; src: url("${pixelFontUrl}") format("woff2"); font-display: swap; }`
  document.head.appendChild(style)
}

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * <acrylic-nameplate>: an edge-lit acrylic plate in a machined base. The name glows from inside
 * the acrylic, the photo is a print behind it, and the rocker switch on the base turns the light on and off.
 */
export class AcrylicNameplateElement extends HTMLElement {
  static observedAttributes = [
    "name", "job-title", "photo", "photo-alt", "mark",
    ...LINK_KEYS,
    "light", "base", "start", "tilt", "sound", "haptics", "pixel-face",
  ]

  #root: HTMLElement
  #plate: HTMLElement
  #name: HTMLElement
  #role: HTMLElement
  #print: HTMLElement
  #img: HTMLImageElement
  #mark: HTMLElement
  #keys: HTMLElement
  #switch: HTMLButtonElement
  #on = 1
  #shown = 1
  #raf = 0
  #rgb = toRGB(DEFAULT_LIGHT)
  #ac: AudioContext | null = null
  #ro: ResizeObserver | null = null
  #fitRaf = 0
  #copiedTimer = 0
  #started = false

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`
    const q = <T extends Element = HTMLElement>(s: string) => shadow.querySelector(s) as T
    this.#root = q(".root")
    this.#plate = q(".plate")
    this.#name = q(".name")
    this.#role = q(".role")
    this.#print = q(".print")
    this.#img = q<HTMLImageElement>(".print img")
    this.#mark = q(".mark")
    this.#keys = q(".keys")
    this.#switch = q<HTMLButtonElement>(".switch")

    // the audio context is made on pointer down, so making it never stalls the light easing in
    this.#switch.addEventListener("pointerdown", () => this.#audio())
    this.#switch.addEventListener("click", () => this.toggle())
    this.addEventListener("pointermove", this.#onMove)
    this.addEventListener("pointerleave", this.#onLeave)
    this.#keys.addEventListener("click", (e) => {
      const key = (e.target as Element).closest<HTMLElement>(".key.email")
      if (key?.dataset.address) this.#copy(key.dataset.address)
    })
  }

  connectedCallback() {
    if (flag(this.getAttribute("pixel-face"), true)) addPixelFont()
    if (!this.#started) {
      this.#started = true
      this.#on = this.#shown = flag(this.getAttribute("start"), true) ? 1 : 0
    }
    this.#render()
    this.#paint()
    this.#ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => this.#fitLater()) : null
    this.#ro?.observe(this.#name.parentElement!)
    document.fonts?.addEventListener?.("loadingdone", this.#fitLater)
    document.fonts?.ready?.then(this.#fitLater)
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf)
    cancelAnimationFrame(this.#fitRaf)
    clearTimeout(this.#copiedTimer)
    this.#ro?.disconnect()
    document.fonts?.removeEventListener?.("loadingdone", this.#fitLater)
    this.#ac?.close?.()
    this.#ac = null
  }

  attributeChangedCallback(attr: string, prev: string | null, next: string | null) {
    if (prev === next || !this.#started) return
    if (attr === "start") {
      cancelAnimationFrame(this.#raf)
      this.#on = this.#shown = flag(next, true) ? 1 : 0
    }
    if (attr === "pixel-face" && flag(next, true)) addPixelFont()
    this.#render()
    this.#paint()
  }

  /** Whether the light is on. Setting it eases the light like the switch does. */
  get on() {
    return this.#on === 1
  }
  set on(value: boolean) {
    if (value !== this.on) this.toggle()
  }

  /** Flips the switch. Pass true or false to set it. */
  toggle(force?: boolean) {
    const next = force === undefined ? (this.#on ? 0 : 1) : force ? 1 : 0
    if (next === this.#on) return
    this.#on = next
    this.#switch.setAttribute("aria-checked", String(!!next))
    // the rocker snaps straight away; only the light eases
    this.#root.style.setProperty("--sw", String(next))
    this.#click(!!next)
    if (flag(this.getAttribute("haptics"), true)) {
      try {
        navigator.vibrate?.(10)
      } catch {}
    }
    this.dispatchEvent(new CustomEvent(next ? "turnon" : "turnoff", { bubbles: true, composed: true }))
    cancelAnimationFrame(this.#raf)
    if (reducedMotion()) {
      this.#shown = next
      this.#root.style.setProperty("--g", this.#rgb)
      this.#root.style.setProperty("--on", String(next))
      return
    }
    const from = this.#shown
    const t0 = performance.now()
    const frame = (t: number) => {
      const elapsed = t - t0
      if (next) this.#root.style.setProperty("--g", warmAt(elapsed, this.#rgb))
      const { value, done } = lightAt(from, next, elapsed)
      this.#shown = value
      this.#root.style.setProperty("--on", value.toFixed(3))
      this.#raf = done ? 0 : requestAnimationFrame(frame)
    }
    this.#raf = requestAnimationFrame(frame)
  }

  // ---------- rendering ----------

  #render() {
    const get = (a: string) => this.getAttribute(a) ?? ""
    const name = get("name")
    const role = get("job-title")
    const photo = get("photo").trim()
    const mark = get("mark").trim()

    this.#root.classList.toggle("pixel", flag(this.getAttribute("pixel-face"), true))
    if (this.#name.textContent !== name) this.#name.textContent = name
    this.#role.textContent = role
    this.#role.hidden = !role
    this.#print.hidden = !photo
    if (photo) {
      if (this.#img.getAttribute("src") !== photo) this.#img.src = photo
      this.#img.alt = this.getAttribute("photo-alt") ?? name
    } else this.#img.removeAttribute("src")
    this.#mark.textContent = mark
    if (mark) this.#mark.removeAttribute("aria-hidden")
    else this.#mark.setAttribute("aria-hidden", "true")

    const base = this.getAttribute("base")
    if (base) this.#root.style.setProperty("--an-base", base)
    else this.#root.style.removeProperty("--an-base")

    this.#renderKeys()

    // a first guess for long names, corrected once the browser can measure
    const size = parseFloat(getComputedStyle(this).getPropertyValue("--an-name-size")) || DEFAULT_NAME_SIZE
    this.#root.style.setProperty("--fit", guessFit(name, size).toFixed(4))
    this.#fit()
  }

  #paint() {
    const fromCss = getComputedStyle(this).getPropertyValue("--an-light")
    this.#rgb = toRGB(this.getAttribute("light") || fromCss || DEFAULT_LIGHT)
    if (!this.#raf) {
      this.#root.style.setProperty("--g", this.#rgb)
      this.#root.style.setProperty("--on", String(this.#shown))
    }
    this.#root.style.setProperty("--sw", String(this.#on))
    this.#switch.setAttribute("aria-checked", String(!!this.#on))
  }

  #keysSig = ""
  #renderKeys() {
    const links = LINK_KEYS.map((key) => ({ key, href: linkHref(key, this.getAttribute(key)) })).filter((l) => l.href)
    const sig = JSON.stringify(links)
    if (sig === this.#keysSig) return
    this.#keysSig = sig
    this.#keys.hidden = links.length === 0
    this.#keys.replaceChildren(
      ...links.map(({ key, href }) => {
        const { label, path } = ICONS[key]
        let el: HTMLElement
        if (key === "email") {
          const address = emailAddress(href)
          el = document.createElement("button")
          ;(el as HTMLButtonElement).type = "button"
          el.className = "key email"
          el.dataset.address = address
          el.setAttribute("aria-label", `Copy ${address}`)
          el.title = `Copy ${address}`
        } else {
          const a = document.createElement("a")
          a.className = "key"
          a.href = href
          a.target = "_blank"
          a.rel = "noopener noreferrer"
          a.title = label
          a.setAttribute("aria-label", `${label} (opens in a new tab)`)
          el = a
        }
        el.setAttribute("part", `key key-${key}`)
        const cap = document.createElement("span")
        cap.className = "cap"
        const svg = document.createElementNS(SVG_NS, "svg")
        svg.setAttribute("viewBox", "0 0 24 24")
        svg.setAttribute("aria-hidden", "true")
        svg.setAttribute("class", "icon")
        const p = document.createElementNS(SVG_NS, "path")
        p.setAttribute("d", path)
        p.setAttribute("fill", "none")
        p.setAttribute("stroke", "currentColor")
        p.setAttribute("stroke-width", "1.8")
        p.setAttribute("stroke-linecap", "round")
        p.setAttribute("stroke-linejoin", "round")
        p.dataset.path = path
        svg.appendChild(p)
        cap.appendChild(svg)
        el.appendChild(cap)
        return el
      }),
    )
  }

  // ---------- fitting the name ----------

  // The ratio doesn't depend on the plate's width, so it only changes with the name and font.
  #fit = () => {
    const box = this.#name.parentElement
    if (!box || !this.isConnected) return
    this.#root.style.setProperty("--fit", "1")
    const cs = getComputedStyle(box)
    const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    this.#root.style.setProperty("--fit", fitRatio(room, this.#name.offsetWidth).toFixed(4))
  }
  #fitLater = () => {
    cancelAnimationFrame(this.#fitRaf)
    this.#fitRaf = requestAnimationFrame(this.#fit)
  }

  // ---------- tilt ----------

  // turns toward the mouse; touch and reduced motion keep it still
  #onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !flag(this.getAttribute("tilt"), true) || reducedMotion()) return
    const r = this.getBoundingClientRect()
    if (!r.width || !r.height) return
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    this.#plate.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`
  }
  #onLeave = () => {
    this.#plate.style.transform = "none"
  }

  // ---------- sound ----------

  #audio(): AudioContext | null {
    if (!flag(this.getAttribute("sound"), true)) return null
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      this.#ac ??= new AC()
      if (this.#ac.state === "suspended") void this.#ac.resume()
      return this.#ac
    } catch {
      return null
    }
  }

  // a short synthesized switch click: filtered noise with a fast decay
  #click(on: boolean) {
    const ac = this.#audio()
    if (!ac) return
    try {
      const t = ac.currentTime
      const buf = ac.createBuffer(1, Math.round(ac.sampleRate * 0.03), ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4)
      const src = ac.createBufferSource()
      src.buffer = buf
      const f = ac.createBiquadFilter()
      f.type = "bandpass"
      f.frequency.value = on ? 2400 : 1700
      f.Q.value = 3
      const g = ac.createGain()
      g.gain.setValueAtTime(0.25, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
      src.connect(f).connect(g).connect(ac.destination)
      src.start(t)
    } catch {}
  }

  // ---------- copy ----------

  // the email key copies the address; its icon becomes a tick for a moment
  async #copy(address: string) {
    let ok = false
    try {
      await navigator.clipboard.writeText(address)
      ok = true
    } catch {
      const ta = document.createElement("textarea")
      ta.value = address
      ta.setAttribute("readonly", "")
      ta.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(ta)
      ta.select()
      try {
        ok = document.execCommand("copy")
      } catch {}
      ta.remove()
    }
    if (!ok) return
    const key = this.#keys.querySelector<HTMLElement>(".key.email")
    const path = key?.querySelector("path")
    if (key && path) {
      path.setAttribute("d", TICK)
      key.setAttribute("aria-label", "Email copied")
      key.title = "Copied"
      clearTimeout(this.#copiedTimer)
      this.#copiedTimer = window.setTimeout(() => {
        path.setAttribute("d", path.dataset.path!)
        key.setAttribute("aria-label", `Copy ${address}`)
        key.title = `Copy ${address}`
      }, 1500)
    }
    this.dispatchEvent(new CustomEvent<NameplateCopyDetail>("emailcopy", { detail: { address }, bubbles: true, composed: true }))
  }
}

declare global {
  interface HTMLElementEventMap {
    emailcopy: CustomEvent<NameplateCopyDetail>
  }
}
