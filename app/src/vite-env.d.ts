/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'postcss-pxtorem' {
  import type { PluginCreator } from 'postcss'
  const plugin: PluginCreator<Record<string, unknown>>
  export default plugin
}
