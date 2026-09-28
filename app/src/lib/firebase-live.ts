import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
} from 'firebase/firestore'
import type { UserData } from '../types'
import { config, emulated } from './firebase'
import { hasSession } from './snapshot'
import { normalise } from './storage'
import type { CloudCopy } from './sync'

/**
 * Firebase itself: sign-in and the saved data. Loaded by `live()` in
 * firebase.ts once the app is already on screen — see the note there.
 */

const app = initializeApp(config)

/**
 * Sign-in, remembered on the phone the same way it always was.
 *
 * Signing in with Google needs a helper page from Google loaded into the
 * app, and on a phone Firebase loads it the moment it starts — before it
 * will even say who is signed in. That is a few more round trips to Google
 * on every opening, for a button a signed-in person never presses. So it is
 * loaded ahead of time only on a phone showing the sign-in screen; anywhere
 * else it is loaded when "Continue with Google" is actually tapped.
 */
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  ...(hasSession() ? {} : { popupRedirectResolver: browserPopupRedirectResolver }),
})

// The saved copy on the phone is what makes the app work with no internet:
// reads are served from it, and writes made offline are queued and sent up
// the moment there is a connection again. Multi-tab keeps two open copies
// of the app from fighting over that cache.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  // A field left holding undefined would otherwise make Firestore refuse
  // the whole save, silently. Dropping the field is always what is meant.
  ignoreUndefinedProperties: true,
})

// Point at the local emulators when running the end-to-end checks.
if (emulated) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export {
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'

/* ---------------- the saved data: one document per person ---------------- */

const userDoc = (uid: string) => doc(db, 'users', uid)

/**
 * Their saved data and the stamp of its last save, or null when this
 * account has never saved any. `cache` reads only what the phone holds
 * (and throws if it holds nothing); `server` asks the server, falling back
 * to the phone's copy when there is no internet.
 */
export async function loadCloud(uid: string, from: 'cache' | 'server'): Promise<CloudCopy | null> {
  const snap = from === 'cache' ? await getDocFromCache(userDoc(uid)) : await getDoc(userDoc(uid))
  if (!snap.exists()) return null
  const raw = snap.data() as Partial<UserData> & { updatedAt?: unknown }
  return {
    data: normalise(raw),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

/** Save the whole of it; resolves with the stamp once the server has it. */
export async function saveCloud(uid: string, data: UserData): Promise<number> {
  const updatedAt = Date.now()
  await setDoc(userDoc(uid), { ...data, updatedAt })
  return updatedAt
}

export async function deleteCloud(uid: string): Promise<void> {
  await deleteDoc(userDoc(uid))
}
