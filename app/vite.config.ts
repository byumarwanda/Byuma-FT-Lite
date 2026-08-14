import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pxtorem from 'postcss-pxtorem'

// The design is authored at a 390px-wide canvas. Every length in the CSS is
// written with the exact pixel number from the design and converted to rem at
// build time, with 1rem = 10 design px. The root font-size then scales with the
// viewport (see base.css), so all spacing keeps its proportion on any phone.
// Stamped into the build so the app can show which version it is running.
const BUILD =
  new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.tsx registers the worker itself so it can force the new version
      // in and reload; the plugin's own one-line script never does that.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Byuma FT',
        short_name: 'Byuma FT',
        description: 'Track what you spend.',
        theme_color: '#f5f4f9',
        background_color: '#f5f4f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Take over from the previous worker at once and bin its caches,
        // rather than waiting for every tab to close.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [
        pxtorem({
          rootValue: 10,
          propList: ['*'],
          // 1px and 1.5px are hairlines — they must stay crisp device pixels
          // rather than scaling down to a fraction of one.
          minPixelValue: 2,
          mediaQuery: false,
          // base.css is written in real viewport pixels on purpose (the phone
          // shell, the breakpoints, the root font-size rule itself).
          exclude: /base\.css/,
        }),
      ],
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
