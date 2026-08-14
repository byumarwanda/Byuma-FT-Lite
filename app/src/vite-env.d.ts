/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Build stamp, injected by vite.config.ts. */
declare const __BUILD__: string

declare module 'postcss-pxtorem' {
  import type { PluginCreator } from 'postcss'
  const plugin: PluginCreator<Record<string, unknown>>
  export default plugin
}
