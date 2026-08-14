import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import App from './App'

/**
 * Keeping the installed app up to date.
 *
 * The app is saved onto the phone so it opens instantly and works offline,
 * which means a plain reload shows whatever was saved last rather than what
 * was just published. Three things together make a reload enough:
 *
 *   1. the worker is asked to look for a new version on every start, whenever
 *      the app is brought back to the front, and every fifteen minutes;
 *   2. a new version takes over immediately instead of waiting for every tab
 *      to be closed (skipWaiting and clientsClaim, set in vite.config.ts);
 *   3. once it has taken over, the page reloads itself so what is on screen
 *      is the new version, not the old one already painted.
 *
 * Without the third step the first reload only fetches the update and a
 * second reload was needed to see it.
 */
const hadWorker = !!navigator.serviceWorker?.controller
let reloading = false

function reloadOnce() {
  if (reloading) return
  reloading = true
  window.location.reload()
}

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => void registration.update().catch(() => {})
    check()
    window.setInterval(check, 15 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check()
    })
  },
  onNeedRefresh() {
    void updateSW(true)
  },
})

// The worker may claim the page without onNeedRefresh firing. Reload only if
// a worker was already in charge — on a first visit there is nothing to
// refresh and reloading would just cost a round trip.
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (hadWorker) reloadOnce()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
