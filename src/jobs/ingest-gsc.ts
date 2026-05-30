import type { Payload } from 'payload'
import { getValidAccessToken } from '@/lib/google-tokens'

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'

/**
 * Ingest GSC search analytics for a single site.
 */
export async function ingestGSCForSite(
  payload: Payload,
  accessToken: string,
  siteId: number,
  gscProperty: string,
): Promise<void> {
  // Pull last 3 days to catch reporting lag
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 3)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  const res = await fetch(
    `${GSC_API_BASE}/sites/${encodeURIComponent(gscProperty)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['date'],
      }),
    },
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`GSC API error: ${res.status} ${errorText}`)
  }

  const data = (await res.json()) as {
    rows?: Array<{
      keys: string[]
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
  }

  // Count indexed pages by querying pages with impressions (last 28 days for better coverage)
  let indexedPages: number | undefined
  try {
    const idxStart = new Date()
    idxStart.setDate(idxStart.getDate() - 28)
    const pagesRes = await fetch(
      `${GSC_API_BASE}/sites/${encodeURIComponent(gscProperty)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: formatDate(idxStart),
          endDate: formatDate(endDate),
          dimensions: ['page'],
          rowLimit: 25000,
        }),
      },
    )
    if (pagesRes.ok) {
      const pagesData = (await pagesRes.json()) as { rows?: Array<unknown> }
      indexedPages = pagesData.rows?.length ?? 0
    }
  } catch {
    // Non-critical — skip if pages query fails
  }

  if (data.rows) {
    for (const row of data.rows) {
      const date = row.keys[0] + 'T00:00:00.000Z'
      await upsertDailyMetrics(payload, siteId, date, {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        avg_position: row.position,
        ...(indexedPages !== undefined ? { indexed_pages: indexedPages } : {}),
      })
    }
  }

  payload.logger.info(`GSC: processed site ${siteId} (${data.rows?.length || 0} days, ${indexedPages ?? '?'} indexed)`)
}

/**
 * GSC ingestion job — pulls daily search analytics for all active sites
 * via per-account Google OAuth tokens. Intended to run every 6 hours.
 */
export async function ingestGSC(payload: Payload): Promise<{ processed: number }> {
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
      payload.logger.error(`GSC: failed to get access token for account ${account.id}`)
      continue
    }

    // Get sites belonging to this account with GSC property configured
    const sites = await payload.find({
      collection: 'sites',
      where: {
        and: [
          { account: { equals: account.id } },
          { status: { equals: 'active' } },
          { 'external_ids.gsc_property': { exists: true } },
        ],
      },
      limit: 0,
    })

    for (const site of sites.docs) {
      const gscProperty = site.external_ids?.gsc_property
      if (!gscProperty) continue

      try {
        await ingestGSCForSite(payload, accessToken, site.id, gscProperty)
        processed++
      } catch (error) {
        payload.logger.error(`GSC ingestion failed for ${site.domain}: ${error}`)
      }
    }
  }

  return { processed }
}

/**
 * Upsert a daily metric row — finds existing record by (site, date) or creates new.
 */
export async function upsertDailyMetrics(
  payload: Payload,
  siteId: number,
  date: string,
  data: Record<string, unknown>,
): Promise<void> {
  const existing = await payload.find({
    collection: 'site_metrics_daily',
    where: {
      and: [
        { site: { equals: siteId } },
        { date: { equals: date } },
      ],
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'site_metrics_daily',
      id: existing.docs[0].id,
      data,
    })
  } else {
    await payload.create({
      collection: 'site_metrics_daily',
      data: {
        site: siteId,
        date,
        ...data,
      },
    })
  }
}
