import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { buildConsentUrl } from '@/lib/google-oauth'
import { signState } from '@/lib/hmac'

export async function GET() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const secret = process.env.PAYLOAD_SECRET

  if (!clientId || !redirectUri || !secret) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 },
    )
  }

  const accountId = getUserAccountId(user)
  const statePayload = JSON.stringify({
    accountId,
    userId: user.id,
    ts: Date.now(),
  })

  const state = await signState(statePayload, secret)
  const consentUrl = buildConsentUrl(clientId, redirectUri, state)

  return NextResponse.redirect(consentUrl)
}
