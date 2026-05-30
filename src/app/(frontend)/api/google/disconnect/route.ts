import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { revokeToken } from '@/lib/google-oauth'

export async function POST() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accountId = getUserAccountId(user)

  // Read current tokens (with hidden fields) so we can revoke
  const account = await payload.findByID({
    collection: 'accounts',
    id: accountId,
    showHiddenFields: true,
  })

  const refreshToken = account.google_oauth?.google_refresh_token

  // Attempt to revoke the token with Google (best-effort)
  if (refreshToken) {
    try {
      await revokeToken(refreshToken)
    } catch {
      // Revocation is best-effort — continue even if it fails
    }
  }

  // Clear all Google OAuth fields
  await payload.update({
    collection: 'accounts',
    id: accountId,
    data: {
      google_oauth: {
        google_email: '',
        google_refresh_token: '',
        google_access_token: '',
        google_token_expiry: '',
        google_connected_at: '',
        google_scopes: null,
      },
    },
  })

  return NextResponse.json({ success: true })
}
