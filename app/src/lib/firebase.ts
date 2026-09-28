import type { FirebaseOptions } from 'firebase/app'

/**
 * The one place Firebase is configured.
 *
 * These values are not secrets. A web app's Firebase config ships inside the
 * JavaScript of every page that uses it, by design — what actually guards the
 * data is the Firestore security rules (see firestore.rules), which only ever
 * let a signed-in person touch their own document.
 *
 * Fill them in either way:
 *   - paste them straight into FALLBACK below, or
 *   - set VITE_FB_* environment variables (locally in app/.env, and in the
 *     GitHub repository's Actions variables for the published build).
 *
 * The Firebase code itself lives in firebase-live.ts and is loaded only once
 * the app is already on screen: it is two thirds of all the JavaScript, and
 * a phone opening the app should not have to read it before showing
 * anything. Nothing here pulls it in.
 */
const FALLBACK: FirebaseOptions = {
  apiKey: 'AIzaSyAg5f6SBMW9oRMrQ_yjzGw1uppplL7rTy4',
  authDomain: 'byuma-ft.firebaseapp.com',
  projectId: 'byuma-ft',
  storageBucket: 'byuma-ft.firebasestorage.app',
  messagingSenderId: '851947720535',
  appId: '1:851947720535:web:2530f2a944ca784a863812',
}

const env = import.meta.env

/**
 * A build for the local emulators (VITE_FB_EMULATOR=1) uses the emulators'
 * own project — "demo-" ids exist nowhere on the internet, so such a build
 * can never reach the real project by accident, whatever config is filled
 * in above. It is also the project the checks look into afterwards.
 */
const EMULATOR: FirebaseOptions = {
  apiKey: 'demo-key',
  authDomain: 'localhost',
  projectId: 'demo-byuma',
  appId: 'demo-app',
}

export const emulated = !!env.VITE_FB_EMULATOR

export const config: FirebaseOptions = emulated
  ? EMULATOR
  : {
      apiKey: env.VITE_FB_API_KEY || FALLBACK.apiKey,
      authDomain: env.VITE_FB_AUTH_DOMAIN || FALLBACK.authDomain,
      projectId: env.VITE_FB_PROJECT_ID || FALLBACK.projectId,
      storageBucket: env.VITE_FB_STORAGE_BUCKET || FALLBACK.storageBucket,
      messagingSenderId: env.VITE_FB_SENDER_ID || FALLBACK.messagingSenderId,
      appId: env.VITE_FB_APP_ID || FALLBACK.appId,
    }

/** False while the placeholders are still in place, so the app can say so. */
export const isConfigured =
  !!config.apiKey && !String(config.apiKey).startsWith('PASTE_')

type Live = typeof import('./firebase-live')

let loading: Promise<Live> | null = null

/**
 * Firebase, loaded on first use and shared from then on. The service worker
 * keeps the file on the phone, so this is a read from storage, not the
 * network — it just no longer stands between opening the app and seeing it.
 */
export function live(): Promise<Live> {
  if (!isConfigured) return Promise.reject(new Error('Firebase is not configured'))
  // A failed load is not remembered, so the next call tries again.
  loading ??= import('./firebase-live').catch((err: unknown) => {
    loading = null
    throw err
  })
  return loading
}
