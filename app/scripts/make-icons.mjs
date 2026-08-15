// Renders the app icons from the Byuma FT mark: three spending hills on the
// accent tile — two soft indigo days behind one tall white one, the same
// artwork as public/favicon.svg. Run with: node scripts/make-icons.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(out, { recursive: true })

// The hills, drawn in a 512 box. `art` shrinks them toward the centre for
// the maskable icon, whose edges the launcher may crop away.
const HILLS = `
  <path d="M 45 376 C 103 376, 112 248, 160 248 C 208 248, 217 376, 275 376 Z" fill="#8d93e0"/>
  <path d="M 126 376 C 191 376, 201 168, 256 168 C 311 168, 321 376, 386 376 Z" fill="#ffffff"/>
  <path d="M 280 376 C 330 376, 338 262, 380 262 C 422 262, 430 376, 480 376 Z" fill="#8d93e0"/>`

const page = (size, radius, scale) => `
<html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden">
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#3b45c9"/>
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${HILLS}</g>
  </svg>
</div>
</body></html>`

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({ deviceScaleFactor: 1 })
const p = await ctx.newPage()

const jobs = [
  { file: 'icon-192.png', size: 192, radius: 42, scale: 1 },
  { file: 'icon-512.png', size: 512, radius: 112, scale: 1 },
  // Maskable icons must keep the mark inside the safe circle, so the tile
  // runs edge to edge and the hills pull in.
  { file: 'icon-512-maskable.png', size: 512, radius: 0, scale: 0.72 },
  // iOS rounds its own corners.
  { file: 'apple-touch-icon.png', size: 180, radius: 0, scale: 1 },
]

for (const j of jobs) {
  await p.setViewportSize({ width: j.size, height: j.size })
  await p.setContent(page(j.size, j.radius, j.scale))
  await p.screenshot({ path: join(out, j.file), omitBackground: true })
  console.log('wrote', j.file)
}

await browser.close()
