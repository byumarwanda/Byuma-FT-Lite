/**
 * Unlocking with the phone itself — fingerprint, face, or the phone's PIN.
 *
 * This uses WebAuthn with the platform authenticator. The browser hands the
 * prompt to the operating system, which checks the person against whatever
 * unlocks the phone and only then returns a credential.
 *
 * Be clear about what this does and does not do. Normally a server verifies
 * the signature WebAuthn produces; there is no server here, so the app trusts
 * that the ceremony resolved at all. That is a real check — the OS refuses to
 * resolve it without a successful fingerprint, face or PIN — but the expense
 * data itself still sits unencrypted in this browser's storage, so it gates
 * the app rather than the data at rest. It is a convenience and a recovery
 * route, not a safe.
 *
 * Requires a secure origin. The published app is served over HTTPS.
 */

function toB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** WebAuthn wants ArrayBuffer-backed views, so every buffer is built as one. */
function bytes(view: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(view.byteLength)
  new Uint8Array(out).set(view)
  return out
}

function challenge(): ArrayBuffer {
  return bytes(crypto.getRandomValues(new Uint8Array(32)))
}

/** Whether this phone can unlock the app with its own screen lock. */
export async function passkeyAvailable(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === 'undefined') return false
    if (!window.isSecureContext) return false
    const fn = PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    if (typeof fn !== 'function') return false
    return await fn.call(PublicKeyCredential)
  } catch {
    return false
  }
}

/**
 * Ask the phone to remember this account. Returns the credential id to store
 * against the account, or null if the person cancelled or it is unsupported.
 */
export async function registerPasskey(
  accountId: string,
  email: string,
  name: string,
): Promise<string | null> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge(),
        rp: { name: 'Byuma FT' },
        user: {
          id: bytes(new TextEncoder().encode(accountId)),
          name: email,
          displayName: name || email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null
    return cred ? toB64Url(cred.rawId) : null
  } catch {
    return null
  }
}

/**
 * Ask the phone to confirm the person. Resolves true only after the operating
 * system has accepted their fingerprint, face or PIN.
 */
export async function verifyPasskey(credentialId: string): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge(),
        allowCredentials: [
          { type: 'public-key', id: bytes(fromB64Url(credentialId)) },
        ],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return !!assertion
  } catch {
    return false
  }
}
