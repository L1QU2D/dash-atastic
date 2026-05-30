import type { Payload } from 'payload'

export interface ActivityItem {
  type: 'alert' | 'incident' | 'link' | 'content'
  severity: 'good' | 'warn' | 'bad' | 'info'
  when: string
  what: string
  why?: string
}

export async function getRecentActivity(
  payload: Payload,
  siteId: string | number,
  days: number = 90,
): Promise<ActivityItem[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [alerts, incidents, links, contentEvents] = await Promise.all([
    payload.find({
      collection: 'alerts',
      where: {
        and: [
          { site: { equals: siteId } },
          { triggered_at: { greater_than_equal: since.toISOString() } },
        ],
      },
      sort: '-triggered_at',
      limit: 20,
    }),
    payload.find({
      collection: 'incidents',
      where: {
        and: [
          { site: { equals: siteId } },
          { started_at: { greater_than_equal: since.toISOString() } },
        ],
      },
      sort: '-started_at',
      limit: 10,
    }),
    payload.find({
      collection: 'link_placements',
      where: {
        and: [
          { site: { equals: siteId } },
          { placed_at: { greater_than_equal: since.toISOString() } },
        ],
      },
      sort: '-placed_at',
      limit: 20,
    }),
    payload.find({
      collection: 'content_events',
      where: {
        and: [
          { site: { equals: siteId } },
          { at: { greater_than_equal: since.toISOString() } },
        ],
      },
      sort: '-at',
      limit: 20,
    }),
  ])

  const items: ActivityItem[] = []

  for (const a of alerts.docs) {
    items.push({
      type: 'alert',
      severity: a.severity === 'critical' ? 'bad' : a.severity === 'warning' ? 'warn' : 'info',
      when: a.triggered_at as string,
      what: `Alert: ${(a.kind as string).replace(/_/g, ' ')}`,
      why: a.signal ? JSON.stringify(a.signal) : undefined,
    })
  }

  for (const i of incidents.docs) {
    items.push({
      type: 'incident',
      severity: i.outcome === 'recovered' ? 'good' : 'warn',
      when: i.started_at as string,
      what: `Incident: ${i.title}`,
      why: i.summary || undefined,
    })
  }

  for (const l of links.docs) {
    items.push({
      type: 'link',
      severity: 'info',
      when: l.placed_at as string,
      what: `Tier ${l.tier} placement: ${l.source_domain}`,
      why: l.anchor_text ? `Anchor: "${l.anchor_text}" · target: ${l.target_url}${l.dr ? ` · DR ${l.dr}` : ''}` : undefined,
    })
  }

  for (const c of contentEvents.docs) {
    items.push({
      type: 'content',
      severity: 'good',
      when: c.at as string,
      what: `Content ${c.kind}: ${c.count} pages`,
      why: c.note || undefined,
    })
  }

  items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
  return items
}
