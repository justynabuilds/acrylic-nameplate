// Vite turns `?url` imports into a URL string (inlined as a data URL in the library build).
declare module "*?url" {
  const url: string
  export default url
}
