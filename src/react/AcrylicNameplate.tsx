import { useEffect, useRef, type CSSProperties } from "react"
import "../element/index.ts"
import type { AcrylicNameplateElement, NameplateCopyDetail } from "../element/index.ts"

export interface AcrylicNameplateLinks {
  /** A plain address or a mailto: link. The key copies the address. */
  email?: string
  x?: string
  linkedin?: string
  instagram?: string
  framer?: string
}

export interface AcrylicNameplateProps {
  /** Engraved in the acrylic. A long name shrinks to fit. */
  name: string
  /** Small line under the name. */
  jobTitle?: string
  /** Image URL, shown as a black and white print above the name. */
  photo?: string
  photoAlt?: string
  /** Etched into the front of the base, on the left. */
  mark?: string
  /** Each link that is set becomes a small backlit key on the base. */
  links?: AcrylicNameplateLinks
  /** Colour of the light in the acrylic, the LED and the keys. Default #FF5A28, neon orange. */
  light?: string
  /** Colour of the pearl base; keep it light. Default #F3F2EF. */
  base?: string
  /** Whether the light is on when the page loads. Default true. */
  startOn?: boolean
  /** Turns a little toward the mouse. Default false. */
  tilt?: boolean
  /** A soft click when the switch flips. Default true. */
  sound?: boolean
  /** A short buzz on phones that support it. Default true. */
  haptics?: boolean
  /** Built-in Geist Pixel for the name and mark. Default true. */
  pixelFace?: boolean
  onTurnOn?: () => void
  onTurnOff?: () => void
  onCopy?: (detail: NameplateCopyDetail) => void
  className?: string
  style?: CSSProperties
}

const onOff = (v: boolean | undefined) => (v === undefined ? undefined : v ? "on" : "off")

export function AcrylicNameplate(props: AcrylicNameplateProps) {
  const ref = useRef<AcrylicNameplateElement>(null)
  const handlers = useRef(props)
  handlers.current = props

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const on = () => handlers.current.onTurnOn?.()
    const off = () => handlers.current.onTurnOff?.()
    const copy = (e: Event) => handlers.current.onCopy?.((e as CustomEvent<NameplateCopyDetail>).detail)
    el.addEventListener("turnon", on)
    el.addEventListener("turnoff", off)
    el.addEventListener("emailcopy", copy)
    return () => {
      el.removeEventListener("turnon", on)
      el.removeEventListener("turnoff", off)
      el.removeEventListener("emailcopy", copy)
    }
  }, [])

  const l = props.links ?? {}
  return (
    <acrylic-nameplate
      ref={ref}
      class={props.className}
      style={props.style}
      name={props.name}
      job-title={props.jobTitle}
      photo={props.photo}
      photo-alt={props.photoAlt}
      mark={props.mark}
      email={l.email}
      x={l.x}
      linkedin={l.linkedin}
      instagram={l.instagram}
      framer={l.framer}
      light={props.light}
      base={props.base}
      start={onOff(props.startOn)}
      tilt={onOff(props.tilt)}
      sound={onOff(props.sound)}
      haptics={onOff(props.haptics)}
      pixel-face={onOff(props.pixelFace)}
    />
  )
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "acrylic-nameplate": {
        ref?: React.Ref<AcrylicNameplateElement>
        class?: string
        style?: React.CSSProperties
        name?: string
        "job-title"?: string
        photo?: string
        "photo-alt"?: string
        mark?: string
        email?: string
        x?: string
        linkedin?: string
        instagram?: string
        framer?: string
        light?: string
        base?: string
        start?: string
        tilt?: string
        sound?: string
        haptics?: string
        "pixel-face"?: string
      }
    }
  }
}
