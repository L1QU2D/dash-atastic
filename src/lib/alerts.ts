import type { Payload } from 'payload'

export async function getActiveAlerts(
  payload: Payload,
  siteId?: string | number,
  accountSiteIds?: Set<number>,
) {
  const where: Record<string, unknown> = {
    status: { not_equals: 'resolved' },
  }

  if (siteId) {
    where.site = { equals: siteId }
  }

  const result = await payload.find({
    collection: 'alerts',
    where,
    sort: '-triggered_at',
    limit: 0,
    depth: 1,
  })

  // Filter by account's site IDs if provided
  if (accountSiteIds) {
    return result.docs.filter((alert) => {
      const sid = typeof alert.site === 'object' ? (alert.site as unknown as { id: number }).id : alert.site
      return accountSiteIds.has(sid as number)
    })
  }

  return result.docs
}

export async function getAlertsFeed(
  payload: Payload,
  opts?: {
    siteId?: string | number
    severity?: string
    status?: string
    page?: number
    limit?: number
    accountSiteIds?: Set<number>
  },
) {
  const conditions: Record<string, unknown>[] = []

  if (opts?.siteId) {
    conditions.push({ site: { equals: opts.siteId } })
  }
  if (opts?.severity) {
    conditions.push({ severity: { equals: opts.severity } })
  }
  if (opts?.status) {
    conditions.push({ status: { equals: opts.status } })
  }

  const result = await payload.find({
    collection: 'alerts',
    where: conditions.length > 0 ? { and: conditions } : {},
    sort: '-triggered_at',
    page: opts?.page || 1,
    limit: opts?.limit || 20,
    depth: 1,
  })

  // Filter by account's site IDs if provided
  if (opts?.accountSiteIds) {
    result.docs = result.docs.filter((alert) => {
      const sid = typeof alert.site === 'object' ? (alert.site as unknown as { id: number }).id : alert.site
      return opts.accountSiteIds!.has(sid as number)
    })
    result.totalDocs = result.docs.length
  }

  return result
}
