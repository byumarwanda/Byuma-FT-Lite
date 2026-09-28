/**
 * How long a returning person waits for the app, on a slow phone.
 *
 * Signs somebody up against the emulators, records an expense, then opens
 * the app again the way a phone does every day — same browser storage, the
 * service worker's saved copy — with the CPU slowed down and every network
 * request delayed. It reports how long the screen stayed empty before the
 * recorder appeared, and what the app fetched on the way.
 *
 *   npm run emulators
 *   VITE_FB_EMULATOR=1 npm run build && npx vite preview --port 4173
 *   APP_URL=http://localhost:4173/ node scripts/check-speed.mjs
 *
 * A request to Google's sign-in helper (apis.google.com) is held for a
 * second and a half and then fails, which is roughly what a phone on mobile
 * data pays for it. SPEED_BUDGET_MS, when set, turns the run into a check.
 */
import { chromium } from 'playwright'

const BASE = process.env.APP_URL || 'http://localhost:4173/'
const PROJECT = 'demo-byuma'
const LATENCY = Number(process.env.SPEED_LATENCY_MS || 600)
const CPU = Number(process.env.SPEED_CPU || 4)
const RUNS = Number(process.env.SPEED_RUNS || 3)
const BUDGET = Number(process.env.SPEED_BUDGET_MS || 0)

// An ordinary Android phone, so Firebase behaves as it does on one.
const ANDROID =
  'Mozilla/5.0 (Linux; Android 11; TECNO KF6i) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
await fetch(
  `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
  { method: 'DELETE' },
)

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: ANDROID,
})

// Google's sign-in helper: slow, then gone, as on a poor connection.
await ctx.route('https://apis.google.com/**', async (route) => {
  await new Promise((r) => setTimeout(r, 1500))
  await route.abort('failed')
})

// ---- a person with some history, signed in on this phone -----------------

const setup = await ctx.newPage()
await setup.goto(BASE, { waitUntil: 'domcontentloaded' })
await setup.waitForSelector('text=Track what you spend.', { timeout: 30000 })
await setup.click('text=Use email instead')
await setup.fill('input[placeholder="Name"]', 'Thierry')
await setup.fill('input[placeholder="Email"]', 'speed@example.com')
await setup.fill('input[placeholder="Password"]', 'ubuzima2026')
await setup.click('text=Create account')
await setup.waitForSelector('.tour-slide', { timeout: 30000 })
await setup.click('text=Skip')
await setup.waitForSelector('.amount-display', { timeout: 15000 })
for (const amount of ['2400', '12500', '850']) {
  await setup.click('.amount-display')
  await setup.fill('input[aria-label="Amount"]', amount)
  await setup.click('.method-btn >> text=Cash')
  await setup.click('.cta')
  await setup.waitForTimeout(250)
}
// Let the saves land, and the service worker finish saving the app.
await setup.waitForTimeout(2500)
await setup.evaluate(() => navigator.serviceWorker.ready)
await setup.close()

// ---- opening it again, slowly ---------------------------------------------

const times = []
let googleCalls = 0
let firstRequests = []
for (let run = 0; run < RUNS; run++) {
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: LATENCY,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  const requests = []
  page.on('request', (r) => {
    const u = r.url()
    if (u.includes('apis.google.com')) googleCalls++
    requests.push(u.replace(/\?.*$/, ''))
  })

  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('.amount-display', { timeout: 60000 })
  const ms = Date.now() - t0
  times.push(ms)
  // The data must be the person's own, not an empty stand-in.
  await page.waitForSelector('.spent-card', { timeout: 60000 })
  if (run === 0) firstRequests = requests.slice()
  console.log(`  open ${run + 1}: recorder on screen after ${ms} ms`)
  await page.close()
}

await browser.close()

const median = times.slice().sort((a, b) => a - b)[Math.floor(times.length / 2)]
const network = firstRequests.filter((u) => !u.startsWith(BASE) || u.includes('/emulator'))
console.log(`\n  median: ${median} ms (CPU ${CPU}x slower, ${LATENCY} ms per request)`)
console.log(`  requests to Google's sign-in helper while opening: ${googleCalls}`)
console.log(`  network requests before the data was up (first open): ${network.length}`)
if (BUDGET && median > BUDGET) {
  console.log(`\n  Slower than the ${BUDGET} ms budget.\n`)
  process.exit(1)
}
