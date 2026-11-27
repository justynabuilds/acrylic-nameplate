import { defineConfig } from "vite"
import { resolve } from "node:path"

// Demo site build (what Vercel serves): the nameplate alone at /, the props playground at /playground
// (rewritten to /demo/playground.html) and the interaction self-test at /demo/selftest.html
export default defineConfig({
  server: { port: 4176 },
  build: {
    outDir: "site-dist",
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        selftest: resolve(import.meta.dirname, "demo/selftest.html"),
        playground: resolve(import.meta.dirname, "demo/playground.html"),
      },
    },
  },
})
