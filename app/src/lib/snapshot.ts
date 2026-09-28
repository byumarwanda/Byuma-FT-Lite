import type { User, UserData } from '../types'

/**
 * The phone's own copy of the last session, so the app opens at once.
 *
 * Firebase has its own saved copy, but reading it has to wait for Firebase
 * to start, confirm the sign-in with Google's servers and, on a phone, load
 * a helper page — seconds on mobile data, and the screen stayed empty all
 * that time. This copy is plain local storage: read in a millisecond, it
 * draws the app straight away, and the account is brought up to date in the
 * background once Firebase has caught up.
 *
 * Two keys: the data itself, rewritten when it changes, and a small note
 * beside it — whose data, which server copy it last matched, and whether a
 * change made here is still waiting to go up — rewritten more often.
 *
 * Nothing secret is kept. Signing out, or the account going away, clears it.
 */

const K_META = 'byuma.snapshot.meta.v1'
const K_DATA = 'byuma.snapshot.data.v1'
// Set when this phone last saw nobody signed in, so the sign-in screen can
// appear without waiting for Firebase to say so.
const K_OUT = 'byuma.signedout.v1'

export interface SnapUser {
  id: string
  name: string
  email: string
  createdAt: number
}

export interface SnapMeta {
  user: SnapUser
  /** The `updatedAt` of the server copy these data last matched; 0 if none. */
  base: number
  /** A change made on this phone that the server has not confirmed yet. */
  pending: boolean
  /** Ids deleted on this phone since the server last confirmed a save. */
  deleted: string[]
}

export interface Snapshot {
  meta: SnapMeta
  data: unknown
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isMeta(v: unknown): v is SnapMeta {
  const m = v as SnapMeta | null
  return (
    !!m &&
    typeof m === 'object' &&
    !!m.user &&
    typeof m.user.id === 'string' &&
    !!m.user.id &&
    typeof m.base === 'number' &&
    typeof m.pending === 'boolean'
  )
}

/** The last session, or null if there is none or it cannot be read. */
export function readSnapshot(): Snapshot | null {
  const meta = read(K_META)
  if (!isMeta(meta)) return null
  const data = read(K_DATA)
  if (!data || typeof data !== 'object') return null
  return {
    meta: { ...meta, deleted: Array.isArray(meta.deleted) ? meta.deleted : [] },
    data,
  }
}

/** Is there a session on this phone? Cheap: reads only the small note. */
export function hasSession(): boolean {
  return isMeta(read(K_META))
}

export function snapUser(user: User): SnapUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}

/**
 * Keep the copy in step with the app. The data goes first: a note that
 * names data which never made it to storage must not survive, so if the
 * data cannot be written (storage full) the whole copy is dropped and the
 * next start simply waits for Firebase, as it always used to.
 */
export function writeSnapshot(user: User, data: UserData, meta: Omit<SnapMeta, 'user'>): void {
  try {
    localStorage.setItem(K_DATA, JSON.stringify(data))
    localStorage.setItem(K_META, JSON.stringify({ ...meta, user: snapUser(user) }))
  } catch {
    clearSnapshot()
  }
}

/** Update only the note — after a save lands, say — leaving the data alone. */
export function writeSnapshotMeta(uid: string, meta: Omit<SnapMeta, 'user'>): void {
  const was = read(K_META)
  if (!isMeta(was) || was.user.id !== uid) return
  try {
    localStorage.setItem(K_META, JSON.stringify({ ...was, ...meta }))
  } catch {
    clearSnapshot()
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(K_META)
    localStorage.removeItem(K_DATA)
  } catch {
    /* ignore */
  }
}

export function markSignedOut(out: boolean): void {
  try {
    if (out) localStorage.setItem(K_OUT, '1')
    else localStorage.removeItem(K_OUT)
  } catch {
    /* ignore */
  }
}

export function wasSignedOut(): boolean {
  try {
    return localStorage.getItem(K_OUT) === '1'
  } catch {
    return false
  }
}
