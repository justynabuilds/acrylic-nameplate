import "../src/element/index.ts"
import type { NameplateCopyDetail } from "../src/element/index.ts"
import { DEFAULT_BASE, DEFAULT_LIGHT } from "../src/core/engine.ts"

/* ---------------- state ---------------- */

const initial = () => ({
  name: "nadia",
  jobTitle: "product designer",
  mark: "",
  photo: "https://acrylic-nameplate.vercel.app/example-portrait.jpg",
  email: "hello@example.com",
  x: "https://x.com",
  linkedin: "https://www.linkedin.com",
  instagram: "https://www.instagram.com",
  framer: "https://www.framer.com",
  light: "",
  base: "",
  startOn: true,
  tilt: true,
  sound: true,
  haptics: true,
  pixelFace: true,
  device: "full",
})
const S = initial()
type Key = keyof typeof S
/** Where the built script is served, so pasted HTML works anywhere. */
const SCRIPT_URL = "https://acrylic-nameplate.vercel.app/acrylic-nameplate.iife.js"
const DEFAULT_COLOURS: Partial<Record<Key, string>> = { light: DEFAULT_LIGHT, base: DEFAULT_BASE }

/* ---------------- panel schema ---------------- */

type Base = { k: Key; label: string; hint?: string | (() => string); when?: () => boolean }
type Ctl = Base & (
  | { type: "text"; max?: number; placeholder?: string }
  | { type: "segment"; options: [string, string][] }
  | { type: "toggle" }
  | { type: "colour" }
)

const SCHEMA: [string, Ctl[]][] = [
  ["Content", [
    { k: "name", label: "Name", type: "text", max: 40, hint: "A long name shrinks to fit." },
    { k: "jobTitle", label: "Job title", type: "text", max: 80 },
    { k: "mark", label: "Mark", type: "text", max: 30, placeholder: "yoursite.com", hint: "Etched into the base, on the left." },
    { k: "photo", label: "Photo", type: "text", max: 500, placeholder: "Image URL", hint: "Shown as a black and white print above the name." },
  ]],
  ["Link keys", [
    { k: "email", label: "Email", type: "text", max: 120, placeholder: "you@yoursite.com", hint: "The email key copies the address." },
    { k: "x", label: "X", type: "text", max: 200, placeholder: "https://x.com/…" },
    { k: "linkedin", label: "LinkedIn", type: "text", max: 200, placeholder: "https://linkedin.com/in/…" },
    { k: "instagram", label: "Instagram", type: "text", max: 200, placeholder: "https://instagram.com/…" },
    { k: "framer", label: "Framer", type: "text", max: 200, placeholder: "https://…", hint: "Each link you fill in becomes a backlit key on the base." },
  ]],
  ["Colours", [
    { k: "light", label: "Light", type: "colour", hint: "The light inside the acrylic, the LED and the keys." },
    { k: "base", label: "Base", type: "colour", hint: "The metal of the base. Its highlights and shade follow." },
  ]],
  ["Behaviour", [
    { k: "startOn", label: "Start on", type: "toggle" },
    { k: "tilt", label: "Tilt", type: "toggle", hint: "Turns a little toward the mouse. Never on touch screens." },
    { k: "sound", label: "Sound", type: "toggle" },
    { k: "haptics", label: "Haptics", type: "toggle" },
    { k: "pixelFace", label: "Pixel face", type: "toggle", hint: "Off: the name and mark use your site's font." },
  ]],
  ["Preview", [
    { k: "device", label: "Screen", type: "segment", options: [["full", "Desktop"], ["768", "Tablet"], ["390", "Phone"]] },
  ]],
]

/* ---------------- build panel ---------------- */

const panel = document.getElementById("panel")!
const frame = document.getElementById("frame")!
const plate = document.getElementById("plate") as HTMLElementTagNameMap["acrylic-nameplate"]
const refresh: (() => void)[] = []
let uid = 0

function set<K extends Key>(k: K, v: (typeof S)[K]) {
  S[k] = v
  refreshAll()
  apply()
}
function refreshAll() { refresh.forEach((f) => f()) }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

const head = document.createElement("div")
head.className = "panel-head"
head.innerHTML = `<span>Properties</span><button type="button" class="reset">Reset all</button>`
head.querySelector("button")!.addEventListener("click", () => { Object.assign(S, initial()); refreshAll(); apply() })
panel.appendChild(head)

for (const [title, ctls] of SCHEMA) {
  const sec = document.createElement("section")
  sec.className = "sec"
  sec.innerHTML = `<h2>${title}</h2>`
  for (const c of ctls) {
    const row = document.createElement("div")
    row.className = "row"
    const id = `c${++uid}`
    const lab = `<label for="${id}">${c.label}</label>`
    const k = c.k
    let update: () => void = () => {}

    if (c.type === "text") {
      row.innerHTML = `${lab}<div class="ctl"><div class="fx"><input id="${id}" type="text" maxlength="${c.max ?? 40}" spellcheck="false" placeholder="${esc(c.placeholder ?? "")}"></div></div>`
      const i = row.querySelector("input")!
      update = () => { if (document.activeElement !== i) i.value = String(S[k]) }
      i.addEventListener("input", () => set(k, i.value as never))
    } else if (c.type === "segment") {
      row.innerHTML = `<span class="lab">${c.label}</span><div class="ctl"><div class="seg" role="group" aria-label="${c.label}">${c.options.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div></div>`
      const bs = [...row.querySelectorAll("button")]
      update = () => bs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === S[k])))
      bs.forEach((b) => b.addEventListener("click", () => set(k, b.dataset.v as never)))
    } else if (c.type === "toggle") {
      row.innerHTML = `<span class="lab" id="${id}">${c.label}</span><div class="ctl"><button type="button" class="tog" role="switch" aria-labelledby="${id}"></button></div>`
      const b = row.querySelector("button")!
      update = () => b.setAttribute("aria-checked", String(!!S[k]))
      b.addEventListener("click", () => set(k, !S[k] as never))
    } else if (c.type === "colour") {
      row.innerHTML = `${lab}<div class="ctl"><div class="fx col"><span class="sw"><input type="color" aria-label="${c.label} colour"></span><input id="${id}" spellcheck="false" maxlength="7"><button type="button" class="x" aria-label="Back to the default colour">×</button></div></div>`
      const [pick, hex] = row.querySelectorAll("input")
      const sw = row.querySelector<HTMLElement>(".sw")!, x = row.querySelector<HTMLButtonElement>(".x")!
      update = () => {
        const v = String(S[k])
        pick.value = (v || DEFAULT_COLOURS[k]!).toLowerCase()
        sw.style.background = pick.value
        hex.placeholder = DEFAULT_COLOURS[k]!
        if (document.activeElement !== hex) hex.value = v.toUpperCase()
        x.hidden = !v
      }
      pick.addEventListener("input", () => set(k, pick.value as never))
      hex.addEventListener("input", () => { const v = hex.value.trim(); if (!v || /^#?[0-9a-f]{6}$/i.test(v)) set(k, (v && !v.startsWith("#") ? `#${v}` : v) as never) })
      x.addEventListener("click", () => set(k, "" as never))
    }

    if (c.hint) {
      const h = document.createElement("p")
      h.className = "hint"
      row.querySelector(".ctl")!.appendChild(h)
      const prev = update
      update = () => { prev(); const t = typeof c.hint === "function" ? c.hint() : c.hint!; h.textContent = t; h.hidden = !t }
    }
    const inner = update
    refresh.push(() => { row.hidden = c.when ? !c.when() : false; inner() })
    sec.appendChild(row)
  }
  panel.appendChild(sec)
}

/* ---------------- apply to the component ---------------- */

/** The attributes that differ from the defaults, in a readable order. */
function attrs(): [string, string][] {
  const a: [string, string][] = []
  a.push(["name", S.name])
  if (S.jobTitle) a.push(["job-title", S.jobTitle])
  if (S.photo.trim()) a.push(["photo", S.photo.trim()])
  if (S.mark.trim()) a.push(["mark", S.mark.trim()])
  for (const k of ["email", "x", "linkedin", "instagram", "framer"] as const) if (S[k].trim()) a.push([k, S[k].trim()])
  if (S.light) a.push(["light", S.light])
  if (S.base) a.push(["base", S.base])
  if (!S.startOn) a.push(["start", "off"])
  if (!S.tilt) a.push(["tilt", "off"])
  if (!S.sound) a.push(["sound", "off"])
  if (!S.haptics) a.push(["haptics", "off"])
  if (!S.pixelFace) a.push(["pixel-face", "off"])
  return a
}

const KNOWN = ["name", "job-title", "photo", "mark", "email", "x", "linkedin", "instagram", "framer", "light", "base", "start", "tilt", "sound", "haptics", "pixel-face"]

function apply() {
  const want = new Map(attrs())
  for (const k of KNOWN) {
    const v = want.get(k)
    if (v == null) { if (plate.hasAttribute(k)) plate.removeAttribute(k) }
    else if (plate.getAttribute(k) !== v) plate.setAttribute(k, v)
  }
  frame.style.width = S.device === "full" ? "100%" : `${S.device}px`
  renderCode()
}

/* ---------------- code + events ---------------- */

let tab: "html" | "react" = "html"
const codeEl = document.getElementById("code")!
const escHTML = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)

function code(): string {
  const a = attrs()
  if (tab === "html") {
    return [
      `<script src="${SCRIPT_URL}"></script>`,
      ``,
      `<!-- The plate is made for a dark background and fills the width you give it (520px looks best) -->`,
      `<div style="background: #121211; padding: 48px 16px; display: grid; place-items: center">`,
      `  <acrylic-nameplate style="width: 100%; max-width: 520px"`,
      ...a.map(([k, v]) => `    ${k}="${esc(v)}"`),
      `  ></acrylic-nameplate>`,
      `</div>`,
    ].join("\n")
  }
  const p: string[] = [`name=${JSON.stringify(S.name)}`]
  if (S.jobTitle) p.push(`jobTitle=${JSON.stringify(S.jobTitle)}`)
  if (S.photo.trim()) p.push(`photo=${JSON.stringify(S.photo.trim())}`)
  if (S.mark.trim()) p.push(`mark=${JSON.stringify(S.mark.trim())}`)
  const links = (["email", "x", "linkedin", "instagram", "framer"] as const).filter((k) => S[k].trim())
  if (links.length) p.push(`links={{ ${links.map((k) => `${k}: ${JSON.stringify(S[k].trim())}`).join(", ")} }}`)
  if (S.light) p.push(`light="${S.light}"`)
  if (S.base) p.push(`base="${S.base}"`)
  if (!S.startOn) p.push(`startOn={false}`)
  if (!S.tilt) p.push(`tilt={false}`)
  if (!S.sound) p.push(`sound={false}`)
  if (!S.haptics) p.push(`haptics={false}`)
  if (!S.pixelFace) p.push(`pixelFace={false}`)
  p.push(`style={{ maxWidth: 520 }}`)
  p.push(`onTurnOn={() => console.log("on")}`)
  return `import { AcrylicNameplate } from "@justbuilt/acrylic-nameplate/react"\n\n<AcrylicNameplate\n${p.map((x) => "  " + x).join("\n")}\n/>`
}
function renderCode() {
  codeEl.innerHTML = escHTML(code()).replace(/(&lt;\/?[\w-]+|\/?&gt;)/g, '<span class="a">$1</span>')
}

const tabs = [...document.querySelectorAll<HTMLButtonElement>("#code-tabs button")]
tabs.forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab as typeof tab
  tabs.forEach((x) => x.setAttribute("aria-selected", String(x === b)))
  renderCode()
}))

const copyBtn = document.getElementById("copy")!
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(code()); copyBtn.textContent = "Copied" }
  catch {
    const r = document.createRange(); r.selectNodeContents(codeEl)
    const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r)
    copyBtn.textContent = "Selected"
  }
  copyBtn.classList.add("done")
  setTimeout(() => { copyBtn.textContent = "Copy"; copyBtn.classList.remove("done") }, 1600)
})

const evList = document.getElementById("events")!
function logEvent(type: string, text: string) {
  evList.querySelector(".empty")?.remove()
  const li = document.createElement("li")
  li.innerHTML = `<b>${type}</b><span>${escHTML(text)}</span>`
  evList.prepend(li)
  while (evList.children.length > 20) evList.lastElementChild!.remove()
}
plate.addEventListener("turnon", () => logEvent("turnon", "light on"))
plate.addEventListener("turnoff", () => logEvent("turnoff", "light off"))
plate.addEventListener("emailcopy", (e) => logEvent("copy", (e as CustomEvent<NameplateCopyDetail>).detail.address))

const wOut = document.getElementById("stage-w")!
new ResizeObserver(() => { wOut.textContent = `${Math.round(frame.getBoundingClientRect().width)} px` }).observe(frame)

refreshAll()
apply()
