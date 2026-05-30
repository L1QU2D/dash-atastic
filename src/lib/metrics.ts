import type { Payload } from 'payload'
import { getDateRange, getComparisonRange, type Period } from './period'

export interface NetworkKPIs {
  clicks: number
  impressions: number
  avgPosition: number
  indexedPages: number
  revenueEur: number
  healthGood: number
  healthWarn: number
  healthBad: number
  clicksDelta: number
  impressionsDelta: number
  positionDelta: number
  indexedDelta: number
  revenueDelta: number
}

export interface SiteMetricRow {
  date: string
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
  indexed_pages: number
  sessions: number
  engaged_sessions: number
  affiliate_clicks: number
  conversions: number
  revenue_eur: number
  crawl_errors: number
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export async function getNetworkKPIs(
  payload: Payload,
  period: Period,
  accountId?: number,
): Promise<NetworkKPIs> {
  const { start, end } = getDateRange(period)
  const comparison = getComparisonRange(period)

  // Get all active sites, scoped by account
  const sitesWhere: Record<string, unknown> = { status: { equals: 'active' } }
  if (accountId) {
    sitesWhere.account = { equals: accountId }
  }

  const sitesResult = await payload.find({
    collection: 'sites',
    where: sitesWhere,
    limit: 0,
  })

  const siteIds = new Set(sitesResult.docs.map((s) => s.id))

  // Current period metrics — query by date range, filter by active site in memory
  // (avoids D1 bind parameter limit with large IN clauses)
  const currentMetrics = await payload.find({
    collection: 'site_metrics_daily',
    where: {
      and: [
        { date: { greater_than_equal: start.toISOString() } },
        { date: { less_than_equal: end.toISOString() } },
      ],
    },
    limit: 0,
  })
  currentMetrics.docs = currentMetrics.docs.filter((d) => {
    const sid = typeof d.site === 'object' ? (d.site as unknown as { id: number }).id : d.site
    return siteIds.has(sid as number)
  })

  // Comparison period metrics
  const prevMetrics = await payload.find({
    collection: 'site_metrics_daily',
    where: {
      and: [
        { date: { greater_than_equal: comparison.start.toISOString() } },
        { date: { less_than_equal: comparison.end.toISOString() } },
      ],
    },
    limit: 0,
  })
  prevMetrics.docs = prevMetrics.docs.filter((d) => {
    const sid = typeof d.site === 'object' ? (d.site as unknown as { id: number }).id : d.site
    return siteIds.has(sid as number)
  })

  const sum = (docs: typeof currentMetrics.docs, field: keyof typeof docs[0]) =>
    docs.reduce((acc, d) => acc + ((d[field] as number) || 0), 0)

  const avg = (docs: typeof currentMetrics.docs, field: keyof typeof docs[0]) => {
    const vals = docs.filter((d) => d[field] != null)
    if (vals.length === 0) return 0
    return vals.reduce((acc, d) => acc + ((d[field] as number) || 0), 0) / vals.length
  }

  const clicks = sum(currentMetrics.docs, 'clicks')
  const impressions = sum(currentMetrics.docs, 'impressions')
  const avgPosition = avg(currentMetrics.docs, 'avg_position')
  const revenueEur = sum(currentMetrics.docs, 'revenue_eur')

  // Get latest indexed pages per site
  const latestBysite = new Map<string, number>()
  for (const doc of currentMetrics.docs) {
    if (doc.indexed_pages != null) {
      const siteId = typeof doc.site === 'object' ? String((doc.site as unknown as { id: number }).id) : String(doc.site)
      const existing = latestBysite.get(siteId)
      if (!existing || doc.indexed_pages > existing) {
        latestBysite.set(siteId, doc.indexed_pages)
      }
    }
  }
  const indexedPages = Array.from(latestBysite.values()).reduce((a, b) => a + b, 0)

  const prevClicks = sum(prevMetrics.docs, 'clicks')
  const prevImpressions = sum(prevMetrics.docs, 'impressions')
  const prevAvgPosition = avg(prevMetrics.docs, 'avg_position')
  const prevRevenue = sum(prevMetrics.docs, 'revenue_eur')

  const prevIndexedBysite = new Map<string, number>()
  for (const doc of prevMetrics.docs) {
    if (doc.indexed_pages != null) {
      const siteId = typeof doc.site === 'object' ? String((doc.site as unknown as { id: number }).id) : String(doc.site)
      const existing = prevIndexedBysite.get(siteId)
      if (!existing || doc.indexed_pages > existing) {
        prevIndexedBysite.set(siteId, doc.indexed_pages)
      }
    }
  }
  const prevIndexed = Array.from(prevIndexedBysite.values()).reduce((a, b) => a + b, 0)

  // Health counts (based on alerts) — filter by account's sites
  const openAlerts = await payload.find({
    collection: 'alerts',
    where: { status: { not_equals: 'resolved' } },
    limit: 0,
  })

  const sitesWithCritical = new Set<string>()
  const sitesWithWarning = new Set<string>()
  for (const alert of openAlerts.docs) {
    const siteId = typeof alert.site === 'object' ? String((alert.site as unknown as { id: number }).id) : String(alert.site)
    if (!siteIds.has(Number(siteId))) continue
    if (alert.severity === 'critical') sitesWithCritical.add(siteId)
    else if (alert.severity === 'warning') sitesWithWarning.add(siteId)
  }

  const healthBad = sitesWithCritical.size
  const healthWarn = [...sitesWithWarning].filter((id) => !sitesWithCritical.has(id)).length
  const healthGood = siteIds.size - healthBad - healthWarn

  return {
    clicks,
    impressions,
    avgPosition,
    indexedPages,
    revenueEur,
    healthGood,
    healthWarn,
    healthBad,
    clicksDelta: pctChange(clicks, prevClicks),
    impressionsDelta: pctChange(impressions, prevImpressions),
    positionDelta: avgPosition - prevAvgPosition,
    indexedDelta: pctChange(indexedPages, prevIndexed),
    revenueDelta: pctChange(revenueEur, prevRevenue),
  }
}

export async function getSiteMetrics(
  payload: Payload,
  siteId: string | number,
  period: Period,
): Promise<SiteMetricRow[]> {
  const { start, end } = getDateRange(period)

  const result = await payload.find({
    collection: 'site_metrics_daily',
    where: {
      and: [
        { site: { equals: siteId } },
        { date: { greater_than_equal: start.toISOString() } },
        { date: { less_than_equal: end.toISOString() } },
      ],
    },
    sort: 'date',
    limit: 0,
  })

  return result.docs.map((d) => ({
    date: d.date as string,
    clicks: d.clicks || 0,
    impressions: d.impressions || 0,
    ctr: d.ctr || 0,
    avg_position: d.avg_position || 0,
    indexed_pages: d.indexed_pages || 0,
    sessions: d.sessions || 0,
    engaged_sessions: d.engaged_sessions || 0,
    affiliate_clicks: d.affiliate_clicks || 0,
    conversions: d.conversions || 0,
    revenue_eur: d.revenue_eur || 0,
    crawl_errors: d.crawl_errors || 0,
  }))
}

export async function getSiteMetricsComparison(
  payload: Payload,
  siteId: string | number,
  period: Period,
): Promise<{ current: SiteMetricRow[]; previous: SiteMetricRow[] }> {
  const current = await getSiteMetrics(payload, siteId, period)

  const comparison = getComparisonRange(period)
  const prevResult = await payload.find({
    collection: 'site_metrics_daily',
    where: {
      and: [
        { site: { equals: siteId } },
        { date: { greater_than_equal: comparison.start.toISOString() } },
        { date: { less_than_equal: comparison.end.toISOString() } },
      ],
    },
    sort: 'date',
    limit: 0,
  })

  const previous = prevResult.docs.map((d) => ({
    date: d.date as string,
    clicks: d.clicks || 0,
    impressions: d.impressions || 0,
    ctr: d.ctr || 0,
    avg_position: d.avg_position || 0,
    indexed_pages: d.indexed_pages || 0,
    sessions: d.sessions || 0,
    engaged_sessions: d.engaged_sessions || 0,
    affiliate_clicks: d.affiliate_clicks || 0,
    conversions: d.conversions || 0,
    revenue_eur: d.revenue_eur || 0,
    crawl_errors: d.crawl_errors || 0,
  }))

  return { current, previous }
}
