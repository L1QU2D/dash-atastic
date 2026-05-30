import type { Payload } from 'payload'
import { refreshAccessToken } from './google-oauth'

/**
 * Gets a valid Google access token for the given account.
 * Automatically refreshes if expired. Updates the stored token on refresh.
 *
 * Returns null if the account has no Google connection.
 */
export async function getValidAccessToken(
  payload: Payload,
  accountId: number,
): Promise<string | null> {
  const account = await payload.findByID({
    collection: 'accounts',
    id: accountId,
    showHiddenFields: true,
  })

  const accessToken = account.google_oauth?.google_access_token
  const expiry = account.google_oauth?.google_token_expiry

  // Check if current token is still valid (with 5 minute buffer)
  if (accessToken && expiry) {
    const expiryDate = new Date(expiry)
    const bufferMs = 5 * 60 * 1000
    if (expiryDate.getTime() - bufferMs > Date.now()) {
      return accessToken
    }
  }

  // Token expired or missing — try to refresh it
  const refreshToken = account.google_oauth?.google_refresh_token
  if (!refreshToken) return null

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    payload.logger.error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured')
    return null
  }

  try {
    const result = await refreshAccessToken(refreshToken, clientId, clientSecret)
    const newExpiry = new Date(Date.now() + result.expires_in * 1000).toISOString()

    await payload.update({
      collection: 'accounts',
      id: accountId,
      data: {
        google_oauth: {
          ...account.google_oauth,
          google_access_token: result.access_token,
          google_token_expiry: newExpiry,
        },
      },
    })

    return result.access_token
  } catch (error) {
    payload.logger.error(`Failed to refresh Google token for account ${accountId}: ${error}`)
    return null
  }
}
