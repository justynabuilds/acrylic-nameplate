import { test } from "node:test"
import assert from "node:assert/strict"
import {
  LIGHT_MS,
  NAME_ROOM,
  PALE,
  STRIKE_MS,
  emailAddress,
  fitRatio,
  flag,
  guessFit,
  lightAt,
  linkHref,
  toRGB,
  strikeAt,
} from "../src/core/engine.ts"

test("toRGB reads hex, short hex, rgb() and Framer-style var() fallbacks", () => {
  assert.equal(toRGB("#FFF4E4"), "255, 244, 228")
  assert.equal(toRGB("#0af"), "0, 170, 255")
  assert.equal(toRGB("#11223380"), "17, 34, 51")
  assert.equal(toRGB("rgb(10, 20, 30)"), "10, 20, 30")
  assert.equal(toRGB("rgba(10 20 30 / 0.5)"), "10, 20, 30")
  assert.equal(toRGB("var(--token-abc, rgb(1, 2, 3))"), "1, 2, 3")
  assert.equal(toRGB("var(--token-abc, #ffffff)"), "255, 255, 255")
})

test("toRGB falls back for empty or unknown colours", () => {
  assert.equal(toRGB(""), "255, 90, 40")
  assert.equal(toRGB(null), "255, 90, 40")
  assert.equal(toRGB("tomato", "1, 1, 1"), "1, 1, 1")
})

test("guessFit leaves short names alone and shrinks long ones", () => {
  assert.equal(guessFit("nadia"), 1)
  assert.equal(guessFit("justyna"), 1)
  const long = guessFit("Alexandra Montgomery")
  assert.ok(long < 0.5 && long > 0.3, String(long))
  assert.equal(guessFit(""), 1)
  assert.equal(NAME_ROOM, 360)
})

test("fitRatio is never above 1 and keeps a small margin", () => {
  assert.equal(fitRatio(300, 100), 1)
  assert.ok(Math.abs(fitRatio(100, 200) - 0.49) < 1e-9)
  assert.equal(fitRatio(0, 200), 1)
  assert.equal(fitRatio(100, 0), 1)
})

test("lightAt eases out and lands exactly on the target", () => {
  assert.deepEqual(lightAt(0, 1, 0), { value: 0, done: false })
  const mid = lightAt(0, 1, LIGHT_MS / 2).value
  assert.ok(mid > 0.8 && mid < 0.95, String(mid)) // ease-out: most of the way at half time
  assert.deepEqual(lightAt(0, 1, LIGHT_MS), { value: 1, done: true })
  assert.deepEqual(lightAt(1, 0, LIGHT_MS * 2), { value: 0, done: true })
  assert.equal(lightAt(0.4, 1, 0).value, 0.4)
})

test("lightAt only moves one way", () => {
  let prev = -1
  for (let t = 0; t <= LIGHT_MS; t += 8) {
    const v = lightAt(0, 1, t).value
    assert.ok(v >= prev)
    prev = v
  }
})

test("strikeAt goes from pale to the chosen light", () => {
  const pale = (c: number) => Math.round(c + (255 - c) * PALE)
  assert.equal(strikeAt(0, "255, 90, 40"), `255, ${pale(90)}, ${pale(40)}`)
  assert.equal(strikeAt(STRIKE_MS, "255, 90, 40"), "255, 90, 40")
  assert.equal(strikeAt(STRIKE_MS * 3, "10, 20, 30"), "10, 20, 30")
  const [, g] = strikeAt(STRIKE_MS / 2, "255, 90, 40").split(",").map(Number)
  assert.ok(g > 90 && g < pale(90), String(g))
})

test("strikeAt only moves toward the chosen colour", () => {
  let prev = Infinity
  for (let t = 0; t <= STRIKE_MS; t += 8) {
    const [, g] = strikeAt(t, "255, 90, 40").split(",").map(Number)
    assert.ok(g <= prev)
    prev = g
  }
})

test("linkHref turns a plain address into mailto and leaves others alone", () => {
  assert.equal(linkHref("email", "hi@example.com"), "mailto:hi@example.com")
  assert.equal(linkHref("email", "mailto:hi@example.com"), "mailto:hi@example.com")
  assert.equal(linkHref("x", " https://x.com/someone "), "https://x.com/someone")
  assert.equal(linkHref("linkedin", null), "")
  assert.equal(emailAddress("mailto:hi@example.com?subject=Hello"), "hi@example.com")
})

test("flag reads on/off attributes", () => {
  assert.equal(flag(null, true), true)
  assert.equal(flag(null, false), false)
  assert.equal(flag("", false), true)
  assert.equal(flag("on", false), true)
  for (const v of ["off", "false", "no", "0", " OFF "]) assert.equal(flag(v, true), false)
})
