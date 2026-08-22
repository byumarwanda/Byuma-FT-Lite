import { registerSW } from 'virtual:pwa-register'

// The service worker serves the saved copy of the app instantly, so it opens
// with no internet. The catch: a browser only asks the server for a newer
// version on a full navigation, and an installed app that Android keeps alive
// in memory almost never performs one — so phones sat on old versions no
// matter how often the app was reopened. Ask explicitly instead: at launch,
// every time the app comes back to the foreground, and once an hour while it
// stays open. When a newer version finishes downloading, the plugin's
// autoUpdate mode activates it and reloads the page by itself, so the update
// reaches the screen without anyone knowing a refresh trick.
export function keepAppFresh() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => {
        // Offline or the server unreachable — the saved copy keeps working
        // and the next check will simply try again.
        void reg.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      setInterval(check, 60 * 60 * 1000)
    },
  })
}
