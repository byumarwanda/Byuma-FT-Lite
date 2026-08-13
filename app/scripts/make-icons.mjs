// Renders the app icons from the same avatar treatment the design uses:
// the accent square with a serif initial. Run with: node scripts/make-icons.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(out, { recursive: true })

const page = (size, radius, pad) => `
<html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#3b45c9;display:flex;
     align-items:center;justify-content:center;border-radius:${radius}px">
  <span style="font-family:Georgia,serif;color:#fff;font-size:${size - pad}px;
        line-height:1;transform:translateY(${size * 0.04}px)">B</span>
</div>
</body></html>`

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({ deviceScaleFactor: 1 })
const p = await ctx.newPage()

const jobs = [
  { file: 'icon-192.png', size: 192, radius: 42, pad: 78 },
  { file: 'icon-512.png', size: 512, radius: 112, pad: 208 },
  // Maskable icons need the mark inside the safe circle, so no corner radius
  // and a smaller glyph.
  { file: 'icon-512-maskable.png', size: 512, radius: 0, pad: 300 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0, pad: 72 },
]

for (const j of jobs) {
  await p.setViewportSize({ width: j.size, height: j.size })
  await p.setContent(page(j.size, j.radius, j.pad))
  await p.screenshot({ path: join(out, j.file), omitBackground: false })
  console.log('wrote', j.file)
}

await browser.close()
