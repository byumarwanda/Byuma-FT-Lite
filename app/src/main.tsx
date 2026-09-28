import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import App from './App'
import { keepAppFresh } from './pwa'

keepAppFresh()

// Firebase arrives in a file of its own, loaded after the first screen. If a
// new version replaced that file between this page loading and asking for
// it, reload once onto the new version rather than stay without Firebase.
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem('byuma.reloaded-for-update')) return
    sessionStorage.setItem('byuma.reloaded-for-update', '1')
  } catch {
    return
  }
  event.preventDefault()
  location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
