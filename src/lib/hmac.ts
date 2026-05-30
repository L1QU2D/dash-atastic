/**
 * HMAC-based state signing for OAuth flows.
 * Uses Web Crypto API (compatible with Cloudflare Workers).
 */

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer
}

/**
 * Creates a signed state string: `payload.signature`
 */
export async function signState(payload: string, secret: string): Promise<string> {
  const key = await getKey(secret)
  const encoder = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `${payload}.${bufToHex(sig)}`
}

/**
 * Verifies and extracts the payload from a signed state string.
 * Returns null if verification fails.
 */
export async function verifyState(state: string, secret: string): Promise<string | null> {
  const dotIndex = state.lastIndexOf('.')
  if (dotIndex === -1) return null

  const payload = state.substring(0, dotIndex)
  const signature = state.substring(dotIndex + 1)

  const key = await getKey(secret)
  const encoder = new TextEncoder()
  const sigBuf = hexToBuf(signature)

  const valid = await crypto.subtle.verify('HMAC', key, sigBuf, encoder.encode(payload))
  return valid ? payload : null
}
