import { defineConfig } from "vite"

// Library build: one script a buyer can drop into any site. The Geist Pixel font is inlined,
// so the script is the only file to host.
//   dist/acrylic-nameplate.js       ESM   (import "…/acrylic-nameplate.js")
//   dist/acrylic-nameplate.iife.js  classic <script src> for Webflow embeds, WordPress, Squarespace, Shopify…
export default defineConfig({
  build: {
    lib: {
      entry: "src/element/index.ts",
      name: "AcrylicNameplate",
      formats: ["es", "iife"],
      fileName: (format) => (format === "es" ? "acrylic-nameplate.js" : "acrylic-nameplate.iife.js"),
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
})
