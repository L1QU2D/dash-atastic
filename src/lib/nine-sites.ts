import type { Payload } from 'payload'
import { getDateRange, getComparisonRange, type Period } from './period'

export interface SiteCardData {
  id: string | number
  domain: string
  niche: string
  market: string
  tier: string
  health: 'good' | 'warn' | 'bad'
  pinned: boolean
  clicks: number
  clicksDelta: number
  impressions: number
  impressionsDelta: number
  avgPosition: number
  indexedPages: number
  revenueEur: number
  sparkClicks: number[]
  sparkImpressions: number[]
  alert?: string
  alertSeverity?: 'critical' | 'warning'
  successorOf?: string
}

export async function getTopSites(
  payload: Payload,
  period: Period,
  count: number = 9,
  page: number = 1,
  accountId?: number,
): Promise<{ sites: SiteCardData[]; totalSites: number; totalPages: number }> {
  const { start, end } = getDateRange(period)
  const comparison = getComparisonRange(period)

  // Get all active sites, scoped by account
  const sitesWhere: Record<string, unknown> = { status: { equals: 'active' } }
  if (accountId) {
    sitesWhere.account = { equals: accountId }
  }

  const allSites = await payload.find({
    collection: 'sites',
    where: sitesWhere,
    limit: 0,
    depth: 1,
  })

  const siteIds = new Set(allSites.docs.map((s) => s.id))

  // Get open alerts
  const openAlerts = await payload.find({
    collection: 'alerts',
    where: { status: { not_equals: 'resolved' } },
    limit: 0,
  })

  const alertsBySite = new Map<string, { kind: string; severity: string; message?: string }>()
  for (const alert of openAlerts.docs) {
    const siteId = typeof alert.site === 'object' ? String((alert.site as unknown as { id: number }).id) : String(alert.site)
    if (!siteIds.has(Number(siteId))) continue
    const existing = alertsBySite.get(siteId)
    if (!existing || alert.severity === 'critical') {
      alertsBySite.set(siteId, {
        kind: alert.kind as string,
        severity: alert.severity as string,
        message: (alert.kind as string).replace(/_/g, ' '),
      })
    }
  }

  // Get metrics for all sites — query by date range only to avoid D1 bind parameter limit
  const [currentMetrics, prevMetrics] = await Promise.all([
    payload.find({
      collection: 'site_metrics_daily',
      where: {
        and: [
          { date: { greater_than_equal: start.toISOString() } },
          { date: { less_than_equal: end.toISOString() } },
        ],
      },
      sort: 'date',
      limit: 0,
    }),
    payload.find({
      collection: 'site_metrics_daily',
      where: {
        and: [
          { date: { greater_than_equal: comparison.start.toISOString() } },
          { date: { less_than_equal: comparison.end.toISOString() } },
        ],
      },
      limit: 0,
    }),
  ])

  // Aggregate per site
  const siteData = new Map<string, {
    clicks: number; impressions: number; avgPositionSum: number; avgPositionCount: number;
    indexedPages: number; revenueEur: number; sparkClicks: number[]; sparkImpressions: number[];
  }>()

  const prevData = new Map<string, { clicks: number; impressions: number }>()

  for (const doc of currentMetrics.docs) {
    const siteId = typeof doc.site === 'object' ? String((doc.site as unknown as { id: number }).id) : String(doc.site)
    if (!siteIds.has(Number(siteId))) continue
    let entry = siteData.get(siteId)
    if (!entry) {
      entry = {
        clicks: 0, impressions: 0, avgPositionSum: 0, avgPositionCount: 0,
        indexedPages: 0, revenueEur: 0, sparkClicks: [], sparkImpressions: [],
      }
      siteData.set(siteId, entry)
    }
    entry.clicks += doc.clicks || 0
    entry.impressions += doc.impressions || 0
    if (doc.avg_position) {
      entry.avgPositionSum += doc.avg_position
      entry.avgPositionCount++
    }
    if (doc.indexed_pages && doc.indexed_pages > entry.indexedPages) {
      entry.indexedPages = doc.indexed_pages
    }
    entry.revenueEur += doc.revenue_eur || 0
    entry.sparkClicks.push(doc.clicks || 0)
    entry.sparkImpressions.push(doc.impressions || 0)
  }

  for (const doc of prevMetrics.docs) {
    const siteId = typeof doc.site === 'object' ? String((doc.site as unknown as { id: number }).id) : String(doc.site)
    if (!siteIds.has(Number(siteId))) continue
    let entry = prevData.get(siteId)
    if (!entry) entry = { clicks: 0, impressions: 0 }
    entry.clicks += doc.clicks || 0
    entry.impressions += doc.impressions || 0
    prevData.set(siteId, entry)
  }

  // Build ranked list
  const ranked: SiteCardData[] = allSites.docs.map((site) => {
    const siteId = String(site.id)
    const metrics = siteData.get(siteId)
    const prev = prevData.get(siteId)
    const alert = alertsBySite.get(siteId)

    const clicks = metrics?.clicks || 0
    const impressions = metrics?.impressions || 0
    const prevClicks = prev?.clicks || 0
    const prevImpressions = prev?.impressions || 0

    const clicksDelta = prevClicks > 0 ? ((clicks - prevClicks) / prevClicks) * 100 : 0
    const impressionsDelta = prevImpressions > 0 ? ((impressions - prevImpressions) / prevImpressions) * 100 : 0

    let health: 'good' | 'warn' | 'bad' = 'good'
    if (alert?.severity === 'critical') health = 'bad'
    else if (alert?.severity === 'warning') health = 'warn'

    const successorSite = site.successor_of
    const successorDomain = successorSite && typeof successorSite === 'object'
      ? (successorSite as { domain: string }).domain
      : undefined

    return {
      id: site.id,
      domain: site.domain,
      niche: site.niche,
      market: site.market,
      tier: site.tier,
      health,
      pinned: site.pinned || false,
      clicks,
      clicksDelta,
      impressions,
      impressionsDelta,
      avgPosition: metrics?.avgPositionCount
        ? metrics.avgPositionSum / metrics.avgPositionCount
        : 0,
      indexedPages: metrics?.indexedPages || 0,
      revenueEur: metrics?.revenueEur || 0,
      sparkClicks: metrics?.sparkClicks || [],
      sparkImpressions: metrics?.sparkImpressions || [],
      alert: alert?.message,
      alertSeverity: alert?.severity as 'critical' | 'warning' | undefined,
      successorOf: successorDomain,
    }
  })

  // Sort: critical alerts first, then pinned, then by absolute clicksDelta (movers), then T1 by revenue
  ranked.sort((a, b) => {
    // Critical alerts first
    if (a.alertSeverity === 'critical' && b.alertSeverity !== 'critical') return -1
    if (b.alertSeverity === 'critical' && a.alertSeverity !== 'critical') return 1
    // Warning alerts
    if (a.alertSeverity === 'warning' && !b.alertSeverity) return -1
    if (b.alertSeverity === 'warning' && !a.alertSeverity) return 1
    // Pinned
    if (a.pinned && !b.pinned) return -1
    if (b.pinned && !a.pinned) return 1
    // Top movers (highest absolute delta)
    const aDelta = Math.abs(a.clicksDelta)
    const bDelta = Math.abs(b.clicksDelta)
    if (aDelta !== bDelta) return bDelta - aDelta
    // By revenue
    return b.revenueEur - a.revenueEur
  })

  const totalSites = ranked.length
  const totalPages = Math.ceil(totalSites / count)
  const offset = (page - 1) * count
  const sites = ranked.slice(offset, offset + count)

  return { sites, totalSites, totalPages }
}
