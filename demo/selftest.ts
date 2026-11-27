// Interaction self-test in a real browser, real frames. Open /demo/selftest.html; results print on the page.
import "../src/element/index.ts"
import { LIGHT_MS } from "../src/core/engine.ts"

const $ = (id: string) => document.getElementById(id) as HTMLElementTagNameMap["acrylic-nameplate"]
const a = $("a"), b = $("b"), c = $("c")
const sr = (el: HTMLElement) => el.shadowRoot!
const q = <T extends Element = HTMLElement>(el: HTMLElement, s: string) => sr(el).querySelector(s) as T
const on = (el: HTMLElement) => parseFloat(getComputedStyle(q(el, ".root")).getPropertyValue("--on"))
const out = document.getElementById("out")!
const results: string[] = []
let failed = 0
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
function check(name: string, ok: boolean, info = "") {
  if (!ok) failed++
  results.push(`${ok ? "pass" : "FAIL"}  ${name}${info ? `  (${info})` : ""}`)
}

async function run() {
  await document.fonts.ready
  await wait(300)

  // renders
  check("renders the name in the shadow root", q(a, ".name").textContent === "nadia")
  check("renders the job title", q(a, ".role").textContent === "product designer" && !q(a, ".role").hidden)
  check("no photo, no print", q<HTMLElement>(a, ".print").hidden)
  check("no links, no keys", q<HTMLElement>(a, ".keys").hidden)
  check("starts on", on(a) === 1 && q(a, ".switch").getAttribute("aria-checked") === "true")
  check("start=off starts dark", on(c) === 0 && q(c, ".switch").getAttribute("aria-checked") === "false")
  check("pixel face loaded", document.fonts.check(`12px JBIAcrylicPixel`))

  // the switch
  const events: string[] = []
  a.addEventListener("turnon", () => events.push("turnon"))
  a.addEventListener("turnoff", () => events.push("turnoff"))
  const sw = q<HTMLButtonElement>(a, ".switch")
  sw.click()
  check("click flips aria-checked at once", sw.getAttribute("aria-checked") === "false")
  check("the rocker snaps at once", getComputedStyle(q(a, ".root")).getPropertyValue("--sw").trim() === "0")
  await wait(LIGHT_MS / 3)
  const mid = on(a)
  check("the light eases, it doesn't jump", mid > 0 && mid < 1, mid.toFixed(3))
  await wait(LIGHT_MS)
  check("the light ends off", on(a) === 0)
  check("turnoff event", events.join() === "turnoff", events.join())
  a.toggle()
  await wait(LIGHT_MS + 100)
  check("toggle() turns it back on", on(a) === 1 && a.on === true)
  check("turnon event", events.join() === "turnoff,turnon", events.join())
  check("the light settles on the chosen colour", getComputedStyle(q(a, ".root")).getPropertyValue("--g").trim() === "255, 244, 228")
  check("the switch is a real button (Space and Enter work)", sw.tagName === "BUTTON" && sw.getAttribute("role") === "switch" && sw.tabIndex === 0)

  // long name fits
  const name = q(b, ".name"), box = name.parentElement!
  const room = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2
  check("a long name shrinks to fit", name.offsetWidth <= room + 0.5, `${name.offsetWidth} of ${Math.round(room)} px`)
  check("a long job title stays within two lines", q(b, ".role").offsetHeight < parseFloat(getComputedStyle(q(b, ".role")).fontSize) * 1.2 * 2 + 1)

  // no sideways overflow
  check("no horizontal overflow", document.documentElement.scrollWidth <= innerWidth, `${document.documentElement.scrollWidth} vs ${innerWidth}`)

  // attributes reflect
  a.setAttribute("name", "theo")
  a.setAttribute("light", "#9AD0FF")
  a.setAttribute("base", "#3A3F46")
  a.removeAttribute("job-title")
  a.setAttribute("photo", "data:image/gif;base64,R0lGODlhAQABAAAAACw=")
  await wait(50)
  check("name attribute updates", q(a, ".name").textContent === "theo")
  check("light attribute updates the light", getComputedStyle(q(a, ".root")).getPropertyValue("--g").trim() === "154, 208, 255")
  check("base attribute sets --an-base", q(a, ".root").style.getPropertyValue("--an-base") === "#3A3F46")
  check("removing job-title hides it", q<HTMLElement>(a, ".role").hidden)
  check("photo shows the print", !q<HTMLElement>(a, ".print").hidden && q<HTMLImageElement>(a, ".print img").alt === "theo")
  a.setAttribute("pixel-face", "off")
  check("pixel-face=off drops the built-in face", !q(a, ".root").classList.contains("pixel"))
  a.setAttribute("start", "off")
  await wait(20)
  check("start=off turns it off without easing", on(a) === 0)

  // keys
  const keys = [...sr(c).querySelectorAll<HTMLElement>(".key")]
  check("only the links that are set become keys", keys.length === 2 && !q<HTMLElement>(c, ".keys").hidden, String(keys.length))
  const link = sr(c).querySelector<HTMLAnchorElement>("a.key")!
  check("link keys open in a new tab", link.href === "https://www.linkedin.com/" && link.target === "_blank" && link.rel.includes("noopener"))
  check("mark is etched", q(c, ".mark").textContent === "example.com")
  let copied = ""
  c.addEventListener("emailcopy", (e) => (copied = (e as CustomEvent<{ address: string }>).detail.address))
  const email = sr(c).querySelector<HTMLButtonElement>(".key.email")!
  check("email key says what it does", email.getAttribute("aria-label") === "Copy hi@example.com")
  email.click()
  await wait(200)
  // browsers only allow copying from a real click, so a scripted click may be refused: then it's skipped, not failed
  if (copied === "hi@example.com") {
    check("email key copies the address", true)
    check("email key shows a tick", email.querySelector("path")!.getAttribute("d")!.startsWith("M5 12.5"))
  } else results.push("skip  email key copies the address  (the browser refused a scripted copy; click the key to try it)")
  c.setAttribute("email", "")
  c.setAttribute("linkedin", "")
  check("no links left, keys hidden", q<HTMLElement>(c, ".keys").hidden)

  const ran = results.filter((r) => !r.startsWith("skip")).length
  out.textContent = `${failed ? `${failed} FAILED` : "all passed"}  (${ran} checks)\n\n${results.join("\n")}`
  document.title = failed ? "FAIL" : "PASS"
  ;(window as unknown as { __selftest: unknown }).__selftest = { failed, total: ran, results }
}
run().catch((e) => { out.textContent = `error: ${e}`; document.title = "FAIL" })
