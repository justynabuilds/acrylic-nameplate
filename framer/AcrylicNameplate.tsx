import {
    addPropertyControls,
    ControlType,
    useIsOnFramerCanvas,
    useIsStaticRenderer,
} from "framer"
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react"

// ─── Helpers ────────────────────────────────────────────────

const EASE = "cubic-bezier(.22,1,.36,1)"
const DESIGN = 520 // the plate is drawn at 520px wide and scales with its frame
const u = (n: number | string) => `calc(${n} * 100cqw / ${DESIGN})`

const DEFAULT_LIGHT = "#FFF4E4"
const DEFAULT_BASE = "#2B2B29"
const COOL = [176, 206, 255] // an LED starts cool and settles warm

const DEFAULT_COLORS = { light: DEFAULT_LIGHT, base: DEFAULT_BASE }
// Geist Pixel (SIL Open Font License), hosted by Framer, so the plate looks right without any project fonts
const PIXEL_FONT = "https://framerusercontent.com/assets/IQXyklzDeInO8OYtOs50tckOE.woff2"
const PIXEL_FAMILY = 'JBIAcrylicPixel, "Geist Pixel", "Geist Mono", ui-monospace, monospace'
const DEFAULT_NAME_FONT = { fontSize: 78, letterSpacing: "-0.045em", lineHeight: "0.86em" }
const DEFAULT_ROLE_FONT = { fontSize: 14, letterSpacing: "0.06em", lineHeight: "1.2em" }
const DEFAULT_MARK_FONT = { fontSize: 12, letterSpacing: "-0.02em", lineHeight: "1em" }

const useIsoLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect

// Framer hands colours as var(--token, rgb()) or hex; the light needs plain r, g, b.
function toRGB(color: string, fallback = "255, 244, 228"): string {
    const c = String(color || "").trim()
    const inner = c.match(/var\([^,]+,\s*(.+)\)$/)
    const v = inner ? inner[1].trim() : c
    const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i)
    if (hex) {
        const h =
            hex[1].length === 3
                ? hex[1]
                      .split("")
                      .map((x) => x + x)
                      .join("")
                : hex[1]
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ")
    }
    const rgb = v.match(/[\d.]+/g)
    return rgb && rgb.length >= 3 ? rgb.slice(0, 3).join(", ") : fallback
}

// a token keeps working in CSS; only the fallback inside var() is needed for maths
function cssColor(color: string, fallback: string): string {
    const c = String(color || "").trim()
    return c || fallback
}

// Font control values: drop colour, read the size as design pixels.
// With the pixel face on, only size, spacing and line height are taken from the control.
function fontStyle(
    f: any,
    d: { fontSize: number; letterSpacing: string; lineHeight: string },
    pixel = false
) {
    const src = f && typeof f === "object" ? f : {}
    const { color: _c, "--framer-font-color": _f, fontSize, ...rest } = src
    const size = parseFloat(fontSize)
    const out: Record<string, any> = {
        letterSpacing: d.letterSpacing,
        lineHeight: d.lineHeight,
        ...rest,
    }
    if (pixel) {
        delete out.fontFeatureSettings
        delete out.fontVariationSettings
        out.fontFamily = PIXEL_FAMILY
        out.fontWeight = 400
        out.fontStyle = "normal"
    }
    out.size = isFinite(size) && size > 0 ? size : d.fontSize
    return out
}

// guess how much a long name must shrink before the browser can measure it
function guessFit(name: string, size: number) {
    const chars = Math.max(1, Array.from(name || "").length)
    const room = DESIGN - 2 * 56 - 2 * 24
    return Math.min(1, room / (chars * size * 0.6))
}

// Line icons on a 24px grid, one stroke weight, so the set reads as one family
const ICONS = [
    {
        key: "email",
        label: "Email",
        path: "M4.5 6.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z M4 7.5l8 5.5 8-5.5",
    },
    {
        key: "x",
        label: "X",
        path: "M4.5 4.5h4l11 15h-4z M19 4.5l-6.2 7 M5 19.5l6.2-7",
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        path: "M7.5 10.5v7 M7.5 6.75v.01 M11.5 17.5v-7 M11.5 13.5a3 3 0 0 1 6 0v4",
    },
    {
        key: "instagram",
        label: "Instagram",
        path: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5z M16.75 7.25v.01",
    },
    {
        key: "framer",
        label: "Framer",
        path: "M6.5 3.5h11v6h-5.5z M6.5 9.5h5.5l5.5 5.5h-11z M6.5 15h5.5v5.5z",
    },
]
const TICK = "M5 12.5l4.5 4.5L19 7.5"

const STYLES = `
@font-face { font-family: JBIAcrylicPixel; src: url(${PIXEL_FONT}); font-display: swap; }
.jbi-acr, .jbi-acr * { box-sizing: border-box; }
.jbi-acr-rocker { transition: box-shadow 110ms cubic-bezier(.2,0,0,1), filter 110ms cubic-bezier(.2,0,0,1), background 110ms cubic-bezier(.2,0,0,1); }
.jbi-acr-switch:active .jbi-acr-rocker { filter: brightness(0.9) !important; }
.jbi-acr-key { display: block; border-radius: 4px; -webkit-tap-highlight-color: transparent; }
.jbi-acr-cap { display: grid; place-items: center; transition: transform .08s ease, box-shadow .08s ease, filter .2s ease; }
.jbi-acr-icon { display: block; color: rgba(var(--g), calc(0.22 + 0.78 * var(--on))); filter: drop-shadow(0 0 calc(3px * var(--on)) rgba(var(--g), calc(0.75 * var(--on)))); }
.jbi-acr-key:not(.jbi-acr-key-off):hover .jbi-acr-cap { filter: brightness(1.14); }
.jbi-acr-key:not(.jbi-acr-key-off):active .jbi-acr-cap { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 rgba(0,0,0,0); filter: brightness(0.9); }
.jbi-acr-key:focus-visible { outline: 2px solid rgba(var(--g), 0.8); outline-offset: 2px; }
.jbi-acr-switch:focus-visible { outline: 2px solid rgba(var(--g), 0.8); outline-offset: 3px; border-radius: 4px; }
.jbi-acr[data-static] *, .jbi-acr[data-static] { transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) { .jbi-acr-plate, .jbi-acr-rocker, .jbi-acr-cap { transition: none !important; } }
`

// ─── Component ──────────────────────────────────────────────

interface Links {
    email?: string
    x?: string
    linkedin?: string
    instagram?: string
    framer?: string
}

interface Props {
    name: string
    role: string
    photo?: { src?: string; srcSet?: string; alt?: string }
    mark: string
    showLinks: boolean
    links?: Links
    colors?: { light?: string; base?: string }
    fonts?: { pixel?: boolean; name?: any; role?: any; mark?: any }
    startOn: boolean
    tilt: boolean
    sound: boolean
    haptics: boolean
    onTurnOn?: () => void
    onTurnOff?: () => void
    style?: CSSProperties
}

/**
 * Acrylic Nameplate
 *
 * An edge-lit acrylic plate in a machined base. The name glows from inside the acrylic,
 * the photo is a print behind it, and the rocker switch on the base turns the light on and off.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 520
 * @framerDisableUnlink
 */
export default function AcrylicNameplate(props: Props) {
    const {
        name = "nadia",
        role = "product designer",
        mark = "",
        photo,
        showLinks = false,
        startOn = true,
        tilt = true,
        sound = true,
        haptics = true,
        style,
    } = props
    const links: Links = { ...(props.links || {}) }
    const colors = { ...DEFAULT_COLORS, ...(props.colors || {}) }
    const fonts = props.fonts || {}
    const pixel = fonts.pixel !== false
    const nameF = fontStyle(fonts.name, DEFAULT_NAME_FONT, pixel)
    const roleF = fontStyle(fonts.role, DEFAULT_ROLE_FONT)
    const markF = fontStyle(fonts.mark, DEFAULT_MARK_FONT, pixel)
    const { size: nameSize, ...nameRest } = nameF
    const { size: roleSize, ...roleRest } = roleF
    const { size: markSize, ...markRest } = markF

    const isStatic = useIsStaticRenderer()
    const onCanvas = useIsOnFramerCanvas()
    const live = !isStatic && !onCanvas

    const rootRef = useRef<HTMLDivElement>(null)
    const plateRef = useRef<HTMLDivElement>(null)
    const switchRef = useRef<HTMLButtonElement>(null)
    const nameRef = useRef<HTMLSpanElement>(null)
    const s = useRef({
        on: startOn ? 1 : 0,
        shown: startOn ? 1 : 0,
        raf: 0,
        ac: null as AudioContext | null,
    })
    const events = useRef({ onTurnOn: props.onTurnOn, onTurnOff: props.onTurnOff })
    events.current = { onTurnOn: props.onTurnOn, onTurnOff: props.onTurnOff }

    const rgb = toRGB(colors.light)
    const base = cssColor(colors.base, DEFAULT_BASE)
    // every shade of the base comes from one colour, so any finish still reads as lit metal
    const shade = (pct: number) =>
        pct >= 0
            ? `color-mix(in srgb, ${base}, #fff ${pct}%)`
            : `color-mix(in srgb, ${base}, #000 ${-pct}%)`

    // the email key copies the address; its icon becomes a tick for a moment
    const [copied, setCopied] = useState(false)
    const copiedTimer = useRef(0)
    async function copyEmail(address: string) {
        let ok = false
        try {
            await navigator.clipboard.writeText(address)
            ok = true
        } catch (e) {
            const ta = document.createElement("textarea")
            ta.value = address
            ta.setAttribute("readonly", "")
            ta.style.position = "fixed"
            ta.style.opacity = "0"
            document.body.appendChild(ta)
            ta.select()
            try {
                ok = document.execCommand("copy")
            } catch (e2) {}
            ta.remove()
        }
        if (!ok) return
        setCopied(true)
        clearTimeout(copiedTimer.current)
        copiedTimer.current = window.setTimeout(() => setCopied(false), 1500)
    }

    const reduced = () =>
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    // The light level lives in one CSS variable, so dimming never re-renders.
    const apply = (v: number) =>
        rootRef.current?.style.setProperty("--on", v.toFixed(3))

    useEffect(() => {
        const st = s.current
        cancelAnimationFrame(st.raf)
        st.on = st.shown = startOn ? 1 : 0
        apply(st.shown)
        rootRef.current?.style.setProperty("--g", rgb)
        rootRef.current?.style.setProperty("--sw", String(st.on))
        switchRef.current?.setAttribute("aria-checked", String(!!st.on))
    }, [startOn])

    useEffect(() => {
        rootRef.current?.style.setProperty("--g", rgb)
    }, [rgb])

    useEffect(
        () => () => {
            cancelAnimationFrame(s.current.raf)
            clearTimeout(copiedTimer.current)
            s.current.ac?.close?.()
        },
        []
    )

    // A long name shrinks to fit the acrylic. The ratio doesn't depend on the plate's width,
    // so it is measured once per name and font.
    const fit0 = guessFit(name, nameSize)
    useIsoLayoutEffect(() => {
        const el = nameRef.current
        const box = el?.parentElement
        if (!el || !box) return
        let raf = 0
        const measure = () => {
            el.style.setProperty("--fit", "1")
            const cs = getComputedStyle(box)
            const room =
                box.clientWidth -
                parseFloat(cs.paddingLeft) -
                parseFloat(cs.paddingRight)
            const natural = el.offsetWidth
            const fit =
                natural > 0 && room > 0 ? Math.min(1, (room * 0.98) / natural) : 1
            el.style.setProperty("--fit", fit.toFixed(4))
        }
        measure()
        const later = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(measure)
        }
        const fontsSet: any = typeof document !== "undefined" ? (document as any).fonts : null
        fontsSet?.ready?.then(later)
        fontsSet?.addEventListener?.("loadingdone", later)
        const ro =
            typeof ResizeObserver !== "undefined" ? new ResizeObserver(later) : null
        ro?.observe(box)
        return () => {
            cancelAnimationFrame(raf)
            fontsSet?.removeEventListener?.("loadingdone", later)
            ro?.disconnect()
        }
    }, [name, nameSize, JSON.stringify(nameRest), photo?.src])

    // The audio context is made on pointer down, so making it never stalls the light easing in.
    const ensureAudio = () => {
        if (!sound || typeof window === "undefined") return null
        const st = s.current
        try {
            const AC = window.AudioContext || (window as any).webkitAudioContext
            if (!AC) return null
            st.ac = st.ac || new AC()
            if (st.ac.state === "suspended") st.ac.resume()
            return st.ac
        } catch (e) {
            return null
        }
    }

    // A short synthesized switch click: filtered noise with a fast decay.
    const click = (on: boolean) => {
        const ac = ensureAudio()
        if (!ac) return
        try {
            const t = ac.currentTime
            const buf = ac.createBuffer(1, Math.round(ac.sampleRate * 0.03), ac.sampleRate)
            const d = buf.getChannelData(0)
            for (let i = 0; i < d.length; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4)
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
        } catch (e) {}
    }

    // Eases the light on or off, smoothly.
    const toggle = () => {
        const st = s.current
        const next = st.on ? 0 : 1
        st.on = next
        switchRef.current?.setAttribute("aria-checked", String(!!next))
        // the rocker snaps straight away; only the light eases
        rootRef.current?.style.setProperty("--sw", String(next))
        click(!!next)
        if (haptics && typeof navigator !== "undefined") {
            try {
                navigator.vibrate?.(10)
            } catch (e) {}
        }
        const handler = next ? events.current.onTurnOn : events.current.onTurnOff
        handler?.()
        cancelAnimationFrame(st.raf)
        if (reduced() || isStatic) {
            st.shown = next
            rootRef.current?.style.setProperty("--g", rgb)
            apply(next)
            return
        }
        const from = st.shown
        const t0 = performance.now()
        const warm = rgb.split(",").map((n) => parseFloat(n))
        const frame = (t: number) => {
            const k = Math.min(1, (t - t0) / 640)
            if (next) {
                // colour temperature: cool at first, warm by about a third of a second
                const w = Math.min(1, (t - t0) / 620)
                const e = 1 - Math.pow(1 - w, 2)
                rootRef.current?.style.setProperty(
                    "--g",
                    COOL.map((c, i) => Math.round(c + (warm[i] - c) * e)).join(", ")
                )
            }
            const v = from + (next - from) * (1 - Math.pow(1 - k, 3))
            st.shown = v
            apply(v)
            st.raf = k < 1 ? requestAnimationFrame(frame) : 0
        }
        st.raf = requestAnimationFrame(frame)
    }

    // Turns toward the mouse; touch and reduced motion keep it still.
    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!live || !tilt || e.pointerType !== "mouse" || reduced()) return
        const r = e.currentTarget.getBoundingClientRect()
        if (!r.width || !r.height) return
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        if (plateRef.current)
            plateRef.current.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`
    }
    const onLeave = () => {
        if (plateRef.current) plateRef.current.style.transform = "none"
    }

    const L = (a: number) => `rgba(var(--g), calc(${a} * var(--on)))`
    const hasPhoto = !!photo?.src
    const markText = String(mark || "").trim()

    const keys = ICONS.map(({ key, label, path }) => {
        const raw = String((links as any)[key] || "").trim()
        // a plain address in the email field still works
        const href =
            key === "email" && raw && raw.includes("@") && !raw.includes(":")
                ? `mailto:${raw}`
                : raw
        return { key, label, path, href }
    })

    return (
        <div
            ref={rootRef}
            className="jbi-acr"
            data-static={isStatic ? "" : undefined}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={
                {
                    ...style,
                    position: "relative",
                    width: "100%",
                    minWidth: 0,
                    containerType: "inline-size",
                    ["--on" as any]: startOn ? 1 : 0,
                    ["--g" as any]: rgb,
                    ["--sw" as any]: startOn ? 1 : 0,
                } as CSSProperties
            }
        >
            <style>{STYLES}</style>

            <div style={{ position: "relative", perspective: u(1200) }}>
                {/* light thrown on the wall behind and the desk in front. Each is a zero-height line with a wide
                    soft shadow: shadows never count as overflow, so the glow can't widen the page on a phone. */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "30%",
                        right: "30%",
                        bottom: u(150),
                        height: 0,
                        pointerEvents: "none",
                        boxShadow: `0 0 ${u(280)} ${u(150)} ${L(0.08)}`,
                    }}
                />
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "22%",
                        right: "22%",
                        bottom: u(4),
                        height: 0,
                        pointerEvents: "none",
                        boxShadow: `0 0 ${u(40)} ${u(18)} ${L(0.14)}, 0 0 ${u(120)} ${u(50)} ${L(0.05)}`,
                    }}
                />

                <div
                    ref={plateRef}
                    className="jbi-acr-plate"
                    style={{
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transition: `transform 600ms ${EASE}`,
                    }}
                >
                    {/* the acrylic: clear, narrower than the base, polished edges; only the edges and the engraving carry light */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            height: u(252),
                            margin: `0 ${u(56)} ${u(-6)}`,
                            borderRadius: `${u(18)} ${u(18)} ${u(3)} ${u(3)}`,
                            overflow: "hidden",
                            background: `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008) 55%, ${L(0.06)})`,
                            boxShadow:
                                "inset 1px 0 0 rgba(255,255,255,0.14), inset -1px 0 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,255,255,0.06), 0 0 0 0.5px rgba(255,255,255,0.06)",
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "6%",
                                right: "6%",
                                bottom: 0,
                                height: "70%",
                                pointerEvents: "none",
                                filter: "blur(6px)",
                                background: `radial-gradient(60% 100% at 50% 100%, ${L(0.2)}, rgba(var(--g), 0) 100%)`,
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 1,
                                right: 1,
                                top: 0,
                                height: u(6),
                                borderRadius: `${u(17)} ${u(17)} 0 0`,
                                borderBottom: "1px solid rgba(0,0,0,0.55)",
                                // the top edge face of 5mm acrylic: brightest at the polished rim
                                background: `linear-gradient(180deg, rgba(var(--g), calc(0.25 + 0.75 * var(--on))), rgba(var(--g), calc(0.1 + 0.45 * var(--on))))`,
                                boxShadow: `0 0 6px ${L(0.9)}, 0 0 22px ${L(0.5)}`,
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                padding: `${u(18)} ${u(24)} ${u(30)}`, // a little more room below, so the block sits just above centre
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                // edge light falls off as it travels up the acrylic
                                maskImage:
                                    "linear-gradient(0deg, #000 35%, rgba(0,0,0,0.42) 100%)",
                                WebkitMaskImage:
                                    "linear-gradient(0deg, #000 35%, rgba(0,0,0,0.42) 100%)",
                            }}
                        >
                            {/* centred like a real nameplate: print, name, role on one axis */}
                            {hasPhoto && (
                                <div
                                    style={{
                                        position: "relative",
                                        flex: "0 0 auto",
                                        width: u(56),
                                        height: u(56),
                                        marginBottom: u(18),
                                        borderRadius: u(4),
                                        overflow: "hidden",
                                        background: shade(-10),
                                        boxShadow: `0 0 0 ${u(3)} rgba(240,236,228,0.9), 0 ${u(6)} ${u(14)} rgba(0,0,0,0.5)`,
                                    }}
                                >
                                    <img
                                        src={photo!.src}
                                        srcSet={photo!.srcSet}
                                        sizes="120px"
                                        alt={photo!.alt || name}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            filter: "grayscale(1) contrast(1.05) brightness(calc(0.55 + 0.4 * var(--on)))",
                                        }}
                                    />
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: `linear-gradient(0deg, ${L(0.18)}, rgba(255,255,255,0) 60%), linear-gradient(115deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%)`,
                                        }}
                                    />
                                </div>
                            )}
                            <span
                                ref={nameRef}
                                style={
                                    {
                                        fontFamily: PIXEL_FAMILY,
                                        ...nameRest,
                                        ["--fit" as any]: fit0.toFixed(4),
                                        fontSize: u(`${nameSize} * var(--fit)`),
                                        flex: "0 0 auto",
                                        color: `rgba(var(--g), calc(0.16 + 0.84 * var(--on)))`,
                                        // engraved lines glow hottest at the core, then a tight halo and a soft bloom
                                        textShadow: `0 0 1px rgba(255,255,255, calc(0.9 * var(--on))), 0 0 6px ${L(0.75)}, 0 0 22px ${L(0.45)}, 0 0 60px ${L(0.25)}, ${u(3)} ${u(-4)} 4px ${L(0.1)}`, // last one: the engraving reflected off the back face
                                        whiteSpace: "nowrap",
                                        userSelect: "none",
                                    } as CSSProperties
                                }
                            >
                                {name}
                            </span>
                            {role ? (
                                <span
                                    style={{
                                        marginTop: u(20), // clears the descenders of j and y
                                        maxWidth: "100%",
                                        fontFamily:
                                            '"Geist", "Inter", system-ui, sans-serif',
                                        ...roleRest,
                                        fontSize: u(roleSize),
                                        color: `rgba(var(--g), calc(0.3 + 0.55 * var(--on)))`,
                                        textShadow: `0 0 6px ${L(0.5)}`,
                                        textWrap: "balance",
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        userSelect: "none",
                                    } as CSSProperties}
                                >
                                    {role}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* the machined base: a lit top surface with the slot, a chamfer, a brushed front face */}
                    <div
                        style={{
                            position: "relative",
                            height: u(66),
                            borderRadius: u(14),
                            boxShadow:
                                "0 0 0 1px rgba(0,0,0,0.85), 0 2px 2px rgba(0,0,0,0.35), 0 4px 4px rgba(0,0,0,0.3), 0 8px 8px rgba(0,0,0,0.28), 0 16px 16px rgba(0,0,0,0.26), 0 32px 32px rgba(0,0,0,0.22)",
                        }}
                    >
                        {/* top surface, catching the LED */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: u(16),
                                borderRadius: `${u(14)} ${u(14)} 0 0`,
                                background: `radial-gradient(55% 140% at 50% 30%, ${L(0.3)}, rgba(var(--g), 0)), linear-gradient(180deg, ${shade(15)}, ${shade(7)})`,
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
                            }}
                        />
                        {/* the slot and its LED line */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: u(50),
                                right: u(50),
                                top: u(5),
                                height: u(5),
                                borderRadius: u(3),
                                background: shade(-82),
                                boxShadow:
                                    "inset 0 1px 1px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12)",
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: u(58),
                                right: u(58),
                                top: u(7),
                                height: 1,
                                borderRadius: 1,
                                background: L(0.95),
                                boxShadow: `0 0 6px ${L(0.9)}, 0 -4px 14px ${L(0.6)}`,
                            }}
                        />
                        {/* chamfer between top and front */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: u(2),
                                right: u(2),
                                top: u(16),
                                height: 1,
                                background:
                                    "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.04))",
                            }}
                        />
                        {/* brushed front face */}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: u(17),
                                bottom: 0,
                                borderRadius: `0 0 ${u(14)} ${u(14)}`,
                                padding: `0 ${u(22)}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px), linear-gradient(180deg, ${base}, ${shade(-40)} 70%, ${shade(-53)})`,
                                boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.55)",
                            }}
                        >
                            {/* the links: small keys in one recessed housing; their icons are backlit by the same light as the plate */}
                            {showLinks && (
                                <nav
                                    aria-label="Links"
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        display: "flex",
                                        gap: u(3),
                                        padding: u(3),
                                        borderRadius: u(7),
                                        background: shade(-75),
                                        boxShadow:
                                            "inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)",
                                    }}
                                >
                                    {keys.map(({ key, label, path, href }) => {
                                        const tick = key === "email" && copied
                                        const cap = (
                                            <span
                                                className="jbi-acr-cap"
                                                style={{
                                                    width: u(30),
                                                    height: u(22),
                                                    borderRadius: u(5),
                                                    background: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%), linear-gradient(180deg, ${shade(6)}, ${shade(-20)})`,
                                                    boxShadow:
                                                        "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.7)",
                                                }}
                                            >
                                                <svg
                                                    width={u(15)}
                                                    height={u(15)}
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    className="jbi-acr-icon"
                                                    style={{ width: u(15), height: u(15) }}
                                                >
                                                    <path
                                                        d={tick ? TICK : path}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={1.8}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                        )
                                        if (key === "email" && href) {
                                            const address = href
                                                .replace(/^mailto:/i, "")
                                                .split("?")[0]
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    className="jbi-acr-key"
                                                    onClick={() => copyEmail(address)}
                                                    aria-label={copied ? "Email copied" : `Copy ${address}`}
                                                    title={copied ? "Copied" : `Copy ${address}`}
                                                    style={{
                                                        appearance: "none",
                                                        border: 0,
                                                        padding: 0,
                                                        margin: 0,
                                                        background: "none",
                                                        cursor: "copy",
                                                    }}
                                                >
                                                    {cap}
                                                </button>
                                            )
                                        }
                                        return href ? (
                                            <a
                                                key={key}
                                                className="jbi-acr-key"
                                                href={href}
                                                aria-label={`${label} (opens in a new tab)`}
                                                title={label}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {cap}
                                            </a>
                                        ) : (
                                            <span
                                                key={key}
                                                className="jbi-acr-key jbi-acr-key-off"
                                                aria-hidden="true"
                                            >
                                                {cap}
                                            </span>
                                        )
                                    })}
                                </nav>
                            )}

                            {/* maker's mark, etched */}
                            <span
                                aria-hidden={markText ? undefined : true}
                                style={{
                                    fontFamily: PIXEL_FAMILY,
                                    ...markRest,
                                    fontSize: u(markSize),
                                    whiteSpace: "nowrap",
                                    color: "rgba(255,255,255,0.16)",
                                    textShadow:
                                        "0 -1px 0 rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)",
                                    userSelect: "none",
                                }}
                            >
                                {markText}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: u(12) }}>
                                {/* the indicator: glows with the light */}
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: u(5),
                                        height: u(5),
                                        borderRadius: "50%",
                                        background: `rgba(var(--g), calc(0.12 + 0.88 * var(--on)))`,
                                        boxShadow: `0 0 ${u(6)} ${L(0.9)}, inset 0 0 0 0.5px rgba(0,0,0,0.4)`,
                                    }}
                                />
                                {/* the rocker switch */}
                                <button
                                    ref={switchRef}
                                    type="button"
                                    role="switch"
                                    aria-checked={startOn}
                                    aria-label="Light"
                                    className="jbi-acr-switch"
                                    onPointerDown={ensureAudio}
                                    onClick={toggle}
                                    style={{
                                        appearance: "none",
                                        border: 0,
                                        margin: 0,
                                        cursor: "pointer",
                                        width: u(34),
                                        height: u(20),
                                        borderRadius: u(5),
                                        padding: u(2),
                                        background: shade(-75),
                                        boxShadow:
                                            "inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)",
                                        WebkitTapHighlightColor: "transparent",
                                        touchAction: "manipulation",
                                    }}
                                >
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            display: "flex",
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: u(4),
                                            overflow: "hidden",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.7)",
                                        }}
                                    >
                                        {[0, 1].map((side) => {
                                            // side 1 is "on": pressed when --sw is 1, so it sinks and the other half rises
                                            const pressed =
                                                side === 1 ? "var(--sw)" : "calc(1 - var(--sw))"
                                            return (
                                                <span
                                                    key={side}
                                                    className="jbi-acr-rocker"
                                                    style={{
                                                        flex: "1 1 50%",
                                                        background: `linear-gradient(180deg, rgba(255,255,255, calc(0.2 - 0.14 * ${pressed})), rgba(255,255,255,0) 70%), linear-gradient(180deg, ${shade(6)}, ${shade(-20)})`,
                                                        boxShadow: `inset 0 calc(${u(2)} * ${pressed}) calc(${u(3)} * ${pressed}) rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255, calc(0.22 - 0.2 * ${pressed}))`,
                                                        filter: `brightness(calc(1.12 - 0.3 * ${pressed}))`,
                                                        borderLeft:
                                                            side === 1
                                                                ? "1px solid rgba(0,0,0,0.6)"
                                                                : undefined,
                                                    }}
                                                />
                                            )
                                        })}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

AcrylicNameplate.displayName = "Acrylic Nameplate"

// ─── Controls ───────────────────────────────────────────────

addPropertyControls(AcrylicNameplate, {
    // Content
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "nadia",
        description: "Engraved in the acrylic. A long name shrinks to fit.",
    },
    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: "product designer",
        description: "Small line under the name. Leave empty for none.",
    },
    photo: {
        type: ControlType.ResponsiveImage,
        title: "Photo",
        description: "Shown as a black and white print above the name. Leave empty for none.",
    },
    mark: {
        type: ControlType.String,
        title: "Mark",
        defaultValue: "",
        placeholder: "yoursite.com",
        description: "Etched into the front of the base, on the left. Leave empty for none.",
    },
    showLinks: {
        type: ControlType.Boolean,
        title: "Link keys",
        defaultValue: false,
        description: "Small backlit keys in the middle of the base.",
    },
    links: {
        type: ControlType.Object,
        title: "Links",
        buttonTitle: "Edit",
        hidden: (p: any) => !p.showLinks,
        description:
            "The email key copies the address. The others open in a new tab. A key without a link shows but does nothing.",
        controls: {
            email: {
                type: ControlType.String,
                title: "Email",
                defaultValue: "",
                placeholder: "you@yoursite.com",
            },
            x: { type: ControlType.Link, title: "X" },
            linkedin: { type: ControlType.Link, title: "LinkedIn" },
            instagram: { type: ControlType.Link, title: "Instagram" },
            framer: { type: ControlType.Link, title: "Framer" },
        },
    },

    // Appearance
    colors: {
        type: ControlType.Object,
        title: "Colours",
        buttonTitle: "Light, base",
        controls: {
            light: {
                type: ControlType.Color,
                title: "Light",
                defaultValue: DEFAULT_LIGHT,
                description: "The light inside the acrylic, the LED and the keys.",
            },
            base: {
                type: ControlType.Color,
                title: "Base",
                defaultValue: DEFAULT_BASE,
                description: "The metal of the base. Its highlights and shade follow.",
            },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        buttonTitle: "Name, role, mark",
        description: "Sizes are for a 520px plate and scale with it.",
        controls: {
            pixel: {
                type: ControlType.Boolean,
                title: "Pixel face",
                defaultValue: true,
                enabledTitle: "Built in",
                disabledTitle: "Custom",
                description: "Built in: name and mark use Geist Pixel. Custom: they use the fonts below.",
            },
            name: {
                type: ControlType.Font,
                title: "Name",
                controls: "extended",
                defaultFontType: "monospace",
                defaultValue: DEFAULT_NAME_FONT as any,
            },
            role: {
                type: ControlType.Font,
                title: "Role",
                controls: "extended",
                defaultFontType: "sans-serif" as any,
                defaultValue: DEFAULT_ROLE_FONT as any,
            },
            mark: {
                type: ControlType.Font,
                title: "Mark",
                controls: "extended",
                defaultFontType: "monospace",
                defaultValue: DEFAULT_MARK_FONT as any,
            },
        },
    },

    // Behaviour
    startOn: {
        type: ControlType.Boolean,
        title: "Start on",
        defaultValue: true,
        description: "Whether the light is on when the page loads.",
    },
    tilt: {
        type: ControlType.Boolean,
        title: "Tilt",
        defaultValue: true,
        description: "Turns a little toward the mouse. Never on touch screens.",
    },
    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        description: "A soft click when the switch flips.",
    },
    haptics: {
        type: ControlType.Boolean,
        title: "Haptics",
        defaultValue: true,
        description: "A short buzz on phones that support it.",
    },
    onTurnOn: { type: ControlType.EventHandler, title: "On turn on" },
    onTurnOff: { type: ControlType.EventHandler, title: "On turn off" },
} as any)
