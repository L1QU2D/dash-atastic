import type { Payload } from 'payload'
import { upsertDailyMetrics } from './ingest-gsc'

/**
 * CSV attribution import job — reads a CSV from R2 bucket,
 * maps subaffiliate_tracking_id to site, and writes conversions + revenue.
 * Intended to run daily at 04:00 UTC.
 */
export async function ingestAttribution(payload: Payload): Promise<{ processed: number }> {
  // In production, this would:
  // 1. List R2 bucket for new attribution CSV files
  // 2. Parse CSV rows (date, subaffiliate_id, conversions, revenue_eur)
  // 3. Map subaffiliate_tracking_id → site via sites collection
  // 4. Upsert into site_metrics_daily

  const sites = await payload.find({
    collection: 'sites',
    where: {
      and: [
        { status: { equals: 'active' } },
        { 'external_ids.subaffiliate_tracking_id': { exists: true } },
      ],
    },
    limit: 0,
  })

  // Build lookup map
  const trackingIdToSite = new Map<string, string | number>()
  for (const site of sites.docs) {
    const trackingId = site.external_ids?.subaffiliate_tracking_id
    if (trackingId) {
      trackingIdToSite.set(trackingId, site.id)
    }
  }

  payload.logger.info(
    `Attribution ingestion: ${trackingIdToSite.size} sites with tracking IDs configured`,
  )

  // Stub: would process CSV rows here
  // for (const row of csvRows) {
  //   const siteId = trackingIdToSite.get(row.subaffiliate_id)
  //   if (!siteId) continue
  //   await upsertDailyMetrics(payload, siteId, row.date, {
  //     conversions: row.conversions,
  //     revenue_eur: row.revenue_eur,
  //   })
  // }

  return { processed: 0 }
}
