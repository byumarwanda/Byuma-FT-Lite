/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Build date (and commit when built from a checkout), defined in vite.config.ts.
declare const __BUILD__: string

declare module 'postcss-pxtorem' {
  import type { PluginCreator } from 'postcss'
  const plugin: PluginCreator<Record<string, unknown>>
  export default plugin
}
