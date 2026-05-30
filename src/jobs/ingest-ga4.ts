import type { Payload } from 'payload'
import { getValidAccessToken } from '@/lib/google-tokens'
import { upsertDailyMetrics } from './ingest-gsc'

const GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

/**
 * Ingest GA4 analytics for a single site.
 */
export async function ingestGA4ForSite(
  payload: Payload,
  accessToken: string,
  siteId: number,
  ga4PropertyId: string,
): Promise<void> {
  const res = await fetch(
    `${GA4_API_BASE}/properties/${ga4PropertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '9daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'keyEvents' },
        ],
      }),
    },
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`GA4 API error: ${res.status} ${errorText}`)
  }

  const data = (await res.json()) as {
    rows?: Array<{
      dimensionValues: Array<{ value: string }>
      metricValues: Array<{ value: string }>
    }>
  }

  if (data.rows) {
    for (const row of data.rows) {
      const rawDate = row.dimensionValues[0].value // YYYYMMDD format
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}T00:00:00.000Z`

      await upsertDailyMetrics(payload, siteId, date, {
        sessions: parseInt(row.metricValues[0].value, 10) || 0,
        engaged_sessions: parseInt(row.metricValues[1].value, 10) || 0,
        conversions: parseInt(row.metricValues[2].value, 10) || 0,
      })
    }
  }

  payload.logger.info(`GA4: processed site ${siteId} (${data.rows?.length || 0} days)`)
}

/**
 * GA4 ingestion job — pulls sessions, engaged sessions, and conversions
 * via per-account Google OAuth tokens. Intended to run every 3 hours.
 */
export async function ingestGA4(payload: Payload): Promise<{ processed: number }> {
  // Find accounts with Google OAuth connected
  const accounts = await payload.find({
    collection: 'accounts',
    where: {
      'google_oauth.google_refresh_token': { exists: true },
    },
    limit: 0,
    showHiddenFields: true,
  })

  let processed = 0

  for (const account of accounts.docs) {
    if (!account.google_oauth?.google_refresh_token) continue

    const accessToken = await getValidAccessToken(payload, account.id)
    if (!accessToken) {
      payload.logger.error(`GA4: failed to get access token for account ${account.id}`)
      continue
    }

    // Get sites belonging to this account with GA4 property configured
    const sites = await payload.find({
      collection: 'sites',
      where: {
        and: [
          { account: { equals: account.id } },
          { status: { equals: 'active' } },
          { 'external_ids.ga4_property_id': { exists: true } },
        ],
      },
      limit: 0,
    })

    for (const site of sites.docs) {
      const ga4PropertyId = site.external_ids?.ga4_property_id
      if (!ga4PropertyId) continue

      try {
        await ingestGA4ForSite(payload, accessToken, site.id, ga4PropertyId)
        processed++
      } catch (error) {
        payload.logger.error(`GA4 ingestion failed for ${site.domain}: ${error}`)
      }
    }
  }

  return { processed }
}
