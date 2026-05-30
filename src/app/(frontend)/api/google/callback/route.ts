import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { exchangeCodeForTokens, getGoogleUserEmail, SCOPES } from '@/lib/google-oauth'
import { verifyState } from '@/lib/hmac'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?google=error&message=${encodeURIComponent(error)}`, request.url),
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google=error&message=missing_params', request.url),
    )
  }

  const secret = process.env.PAYLOAD_SECRET
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!secret || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google=error&message=not_configured', request.url),
    )
  }

  // Verify state signature
  const statePayload = await verifyState(state, secret)
  if (!statePayload) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google=error&message=invalid_state', request.url),
    )
  }

  const { accountId, ts } = JSON.parse(statePayload) as { accountId: number; userId: number; ts: number }

  // Check state is not too old (10 minute window)
  if (Date.now() - ts > 10 * 60 * 1000) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?google=error&message=state_expired', request.url),
    )
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri)
    const googleEmail = await getGoogleUserEmail(tokens.access_token)

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store tokens on account
    await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        google_oauth: {
          google_email: googleEmail,
          google_refresh_token: tokens.refresh_token || '',
          google_access_token: tokens.access_token,
          google_token_expiry: expiryDate,
          google_connected_at: new Date().toISOString(),
          google_scopes: SCOPES,
        },
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?google=connected', request.url),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      new URL(`/dashboard/settings?google=error&message=${encodeURIComponent(message)}`, request.url),
    )
  }
}
