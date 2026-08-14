/**
 * Password handling.
 *
 * Passwords are never stored. What is stored is a PBKDF2-SHA-256 hash with a
 * random per-account salt, which cannot be turned back into the password.
 * Everything stays on this phone; nothing is sent anywhere.
 */

const ITERATIONS = 210_000

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(s: string): Uint8Array {
  const raw = atob(s)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function cryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      // A fresh copy keeps TypeScript happy about the buffer type.
      salt: salt.slice().buffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return toB64(new Uint8Array(bits))
}

export async function hashPassword(
  password: string,
): Promise<{ salt: string; hash: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, ITERATIONS)
  return { salt: toB64(salt), hash, iterations: ITERATIONS }
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string,
  iterations: number,
): Promise<boolean> {
  const candidate = await derive(password, fromB64(salt), iterations)
  // Constant-time-ish comparison so the check does not leak by timing.
  if (candidate.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < hash.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  return diff === 0
}
