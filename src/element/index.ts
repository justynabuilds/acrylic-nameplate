import { AcrylicNameplateElement } from "./acrylic-nameplate-element.ts"

export { AcrylicNameplateElement }
export type { NameplateCopyDetail } from "./acrylic-nameplate-element.ts"

if (!customElements.get("acrylic-nameplate")) customElements.define("acrylic-nameplate", AcrylicNameplateElement)

declare global {
  interface HTMLElementTagNameMap {
    "acrylic-nameplate": AcrylicNameplateElement
  }
}
