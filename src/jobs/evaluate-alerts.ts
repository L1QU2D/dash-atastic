import type { Payload } from 'payload'

/**
 * Alert evaluation job — runs threshold checks per active alert config.
 * Intended to run every 15 minutes.
 */
export async function evaluateAlerts(payload: Payload): Promise<{ triggered: number }> {
  const configs = await payload.find({
    collection: 'alert_configs',
    where: { enabled: { equals: true } },
    limit: 0,
  })

  let triggered = 0

  for (const config of configs.docs) {
    const rawSiteId = typeof config.site === 'object' ? (config.site as unknown as { id: number })?.id : config.site
    if (!rawSiteId) continue
    const siteId = typeof rawSiteId === 'number' ? rawSiteId : Number(rawSiteId)

    try {
      const threshold = config.threshold as Record<string, number> | null
      if (!threshold) continue

      // Get latest 7 days of metrics for this site
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const metrics = await payload.find({
        collection: 'site_metrics_daily',
        where: {
          and: [
            { site: { equals: siteId } },
            { date: { greater_than_equal: sevenDaysAgo.toISOString() } },
          ],
        },
        sort: '-date',
        limit: 14,
      })

      if (metrics.docs.length < 2) continue

      const recent = metrics.docs.slice(0, 7)
      const prior = metrics.docs.slice(7, 14)

      switch (config.kind) {
        case 'indexation_drop': {
          const dropPct = threshold.drop_pct || 15
          const recentIndexed = Math.max(...recent.map((m) => m.indexed_pages || 0))
          const priorIndexed = Math.max(...prior.map((m) => m.indexed_pages || 0))

          if (priorIndexed > 0) {
            const change = ((recentIndexed - priorIndexed) / priorIndexed) * 100
            if (change < -dropPct) {
              await createAlert(payload, siteId, 'indexation_drop', 'critical', {
                recentIndexed,
                priorIndexed,
                changePct: change,
              })
              triggered++
            }
          }
          break
        }

        case 'ranking_collapse': {
          const positionShift = threshold.position_shift || 10
          const recentPos = avg(recent.map((m) => m.avg_position || 0))
          const priorPos = avg(prior.map((m) => m.avg_position || 0))

          if (priorPos > 0 && recentPos - priorPos > positionShift) {
            await createAlert(payload, siteId, 'ranking_collapse', 'critical', {
              recentPos,
              priorPos,
              shift: recentPos - priorPos,
            })
            triggered++
          }
          break
        }

        case 'traffic_anomaly': {
          const dropPct = threshold.drop_pct || 25
          const recentClicks = sum(recent.map((m) => m.clicks || 0))
          const priorClicks = sum(prior.map((m) => m.clicks || 0))

          if (priorClicks > 0) {
            const change = ((recentClicks - priorClicks) / priorClicks) * 100
            if (change < -dropPct) {
              await createAlert(payload, siteId, 'traffic_anomaly', 'warning', {
                recentClicks,
                priorClicks,
                changePct: change,
              })
              triggered++
            }
          }
          break
        }

        case 'manual_action': {
          // Manual action checks would integrate with GSC API
          // Stub: no-op for now
          break
        }
      }
    } catch (error) {
      payload.logger.error(`Alert evaluation failed for config ${config.id}: ${error}`)
    }
  }

  return { triggered }
}

async function createAlert(
  payload: Payload,
  siteId: number,
  kind: 'indexation_drop' | 'ranking_collapse' | 'manual_action' | 'traffic_anomaly' | 'link_velocity' | 'uptime_cwv',
  severity: 'critical' | 'warning' | 'info',
  signal: Record<string, unknown>,
): Promise<void> {
  // Check if there's already an open alert of this kind for this site
  const existing = await payload.find({
    collection: 'alerts',
    where: {
      and: [
        { site: { equals: siteId } },
        { kind: { equals: kind } },
        { status: { not_equals: 'resolved' } },
      ],
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    // Update existing alert's signal
    await payload.update({
      collection: 'alerts',
      id: existing.docs[0].id,
      data: { signal },
    })
    return
  }

  await payload.create({
    collection: 'alerts',
    data: {
      site: siteId,
      kind,
      severity,
      status: 'open',
      triggered_at: new Date().toISOString(),
      signal,
    },
  })
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}
