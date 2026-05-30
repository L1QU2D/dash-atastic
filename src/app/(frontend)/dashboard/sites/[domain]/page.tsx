import React, { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { parsePeriod, periodLabel } from '@/lib/period'
import { getSiteByDomain } from '@/lib/sites'
import { getUserAccountId } from '@/lib/account'
import { getSiteMetricsComparison } from '@/lib/metrics'
import { getActiveAlerts } from '@/lib/alerts'
import { getRecentActivity } from '@/lib/activity'
import { KPI } from '@/components/KPI'
import { PeriodPicker } from '@/components/PeriodPicker'
import { Panel } from '@/components/Panel'
import { HealthDot } from '@/components/HealthDot'
import { TierTag } from '@/components/TierTag'
import { TimeSeriesChart } from '@/components/TimeSeriesChart'
import { TierBreakdownBar } from '@/components/TierBreakdownBar'
import { Funnel } from '@/components/Funnel'
import { IncidentTimeline } from '@/components/IncidentTimeline'
import { GA4ConfigButton } from '@/components/GA4ConfigButton'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n.toLocaleString('en-US')
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

interface Props {
  params: Promise<{ domain: string }>
  searchParams: Promise<{ period?: string }>
}

export default async function SiteDetailPage({ params, searchParams }: Props) {
  const { domain } = await params
  const sp = await searchParams
  const period = parsePeriod(sp.period)

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const accountId = user ? getUserAccountId(user) : undefined

  const site = await getSiteByDomain(payload, decodeURIComponent(domain), accountId)
  if (!site) notFound()

  const [metricsData, alerts, activity, linkPlacements, contentEvents] = await Promise.all([
    getSiteMetricsComparison(payload, site.id, period),
    getActiveAlerts(payload, site.id),
    getRecentActivity(payload, site.id, 90),
    payload.find({
      collection: 'link_placements',
      where: { site: { equals: site.id } },
      sort: '-placed_at',
      limit: 10,
      depth: 0,
    }),
    payload.find({
      collection: 'content_events',
      where: { site: { equals: site.id } },
      sort: '-at',
      limit: 20,
      depth: 0,
    }),
  ])

  const { current: metrics, previous: prevMetrics } = metricsData

  // Aggregate current and previous totals
  const sum = (arr: typeof metrics, key: keyof typeof metrics[0]) =>
    arr.reduce((acc, d) => acc + ((d[key] as number) || 0), 0)
  const avg = (arr: typeof metrics, key: keyof typeof metrics[0]) => {
    const vals = arr.filter((d) => d[key] != null && d[key] !== 0)
    if (vals.length === 0) return 0
    return vals.reduce((acc, d) => acc + ((d[key] as number) || 0), 0) / vals.length
  }

  const totalClicks = sum(metrics, 'clicks')
  const totalImpressions = sum(metrics, 'impressions')
  const avgPos = avg(metrics, 'avg_position')
  const avgCtr = avg(metrics, 'ctr')
  const totalSessions = sum(metrics, 'sessions')
  const totalEngaged = sum(metrics, 'engaged_sessions')
  const totalAffClicks = sum(metrics, 'affiliate_clicks')
  const totalConversions = sum(metrics, 'conversions')
  const totalRevenue = sum(metrics, 'revenue_eur')
  const latestIndexed = metrics.length > 0 ? Math.max(...metrics.map((m) => m.indexed_pages || 0)) : 0

  const prevClicks = sum(prevMetrics, 'clicks')
  const prevImpressions = sum(prevMetrics, 'impressions')
  const prevPos = avg(prevMetrics, 'avg_position')
  const prevRevenue = sum(prevMetrics, 'revenue_eur')
  const prevIndexed = prevMetrics.length > 0 ? Math.max(...prevMetrics.map((m) => m.indexed_pages || 0)) : 0

  const clicksDelta = pctChange(totalClicks, prevClicks)
  const impDelta = pctChange(totalImpressions, prevImpressions)
  const posDelta = avgPos - prevPos
  const revDelta = pctChange(totalRevenue, prevRevenue)
  const indexDelta = latestIndexed - prevIndexed

  const deltaDir = (n: number): 'up' | 'down' | 'flat' =>
    n > 0.5 ? 'up' : n < -0.5 ? 'down' : 'flat'

  // Health
  let health: 'good' | 'warn' | 'bad' = 'good'
  if (alerts.some((a) => a.severity === 'critical')) health = 'bad'
  else if (alerts.some((a) => a.severity === 'warning')) health = 'warn'

  // Chart data
  const chartData = metrics.map((m) => ({
    date: m.date,
    clicks: m.clicks,
    impressions: m.impressions,
    sessions: m.sessions,
    revenue: m.revenue_eur,
    indexed: m.indexed_pages,
  }))

  // Link tier breakdown
  const tierCounts = [1, 2, 3, 4, 5].map((t) => ({
    tier: t,
    count: linkPlacements.docs.filter((l) => String(l.tier) === String(t)).length,
    label: `Tier ${t}`,
  }))

  // Content pipeline stats
  const contentStats = {
    generated: 0,
    updated: 0,
    pruned: 0,
    editorial: 0,
  }
  for (const e of contentEvents.docs) {
    const kind = e.kind as keyof typeof contentStats
    if (kind in contentStats) contentStats[kind] += e.count || 0
  }

  // Funnel
  const engagedPct = totalSessions > 0 ? ((totalEngaged / totalSessions) * 100).toFixed(1) : '0'
  const affClickPct = totalSessions > 0 ? ((totalAffClicks / totalSessions) * 100).toFixed(1) : '0'
  const convPct = totalAffClicks > 0 ? ((totalConversions / totalAffClicks) * 100).toFixed(1) : '0'
  const revenuePerConv = totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0'

  // Alert checks
  const alertKinds = [
    'indexation_drop',
    'ranking_collapse',
    'manual_action',
    'traffic_anomaly',
    'link_velocity',
    'uptime_cwv',
  ]
  const alertStatus = alertKinds.map((kind) => {
    const matching = alerts.find((a) => a.kind === kind)
    return {
      kind: kind.replace(/_/g, ' '),
      status: matching
        ? matching.severity === 'critical'
          ? 'bad'
          : 'warn'
        : 'good',
      message: matching ? `Active - ${matching.severity}` : 'Quiet',
    }
  })

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-3.5 text-[13px] text-[var(--text-muted)]">
        <Link href="/dashboard" className="font-medium text-[var(--brand)]">
          &larr; Network overview
        </Link>
        <span className="mx-2 text-[var(--border)]">/</span>
        <span>Site detail</span>
        <span className="mx-2 text-[var(--border)]">/</span>
        <span className="text-[var(--text)]">{site.domain}</span>
      </div>

      {/* Site header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-6 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 flex flex-wrap items-center gap-2.5 text-[26px] font-bold tracking-tight text-[var(--brand-dark)]">
            {site.domain}
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand)] no-underline"
            >
              &#8599; visit site
            </a>
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[13px] text-[var(--text-muted)]">
            <span>{site.niche}{site.niche_group ? ` · niche group: ${site.niche_group}` : ''}</span>
            <span className="rounded-full bg-[var(--brand-soft)] px-2 py-px text-[11px] font-semibold tracking-wide text-[var(--brand-dark)]">
              MARKET · {site.market}
            </span>
            <TierTag tier={site.tier} />
            <HealthDot status={health} />
            <GA4ConfigButton siteId={site.id} currentGa4PropertyId={site.external_ids?.ga4_property_id} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/alerts?site=${site.domain}`} className="rounded-[7px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-[7px] text-[13px] font-medium no-underline">
            Open incident log
          </Link>
        </div>
      </div>

      {/* Period picker */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[var(--text-muted)]">
          Showing data for {periodLabel(period)}
        </div>
        <Suspense>
          <PeriodPicker current={period} />
        </Suspense>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI
          label={`Clicks · ${period}`}
          value={formatNumber(totalClicks)}
          delta={`${clicksDelta >= 0 ? '+' : ''}${clicksDelta.toFixed(1)}%`}
          deltaDirection={deltaDir(clicksDelta)}
          sparkData={metrics.map((m) => m.clicks)}
          sparkColor="var(--chart-clicks)"
        />
        <KPI
          label={`Impressions · ${period}`}
          value={formatNumber(totalImpressions)}
          delta={`${impDelta >= 0 ? '+' : ''}${impDelta.toFixed(1)}%`}
          deltaDirection={deltaDir(impDelta)}
          sparkData={metrics.map((m) => m.impressions)}
          sparkColor="var(--chart-impressions)"
        />
        <KPI
          label="Avg position"
          value={avgPos.toFixed(1)}
          delta={`${posDelta >= 0 ? '+' : ''}${posDelta.toFixed(1)} pos`}
          deltaDirection={posDelta > 0 ? 'up' : posDelta < 0 ? 'down' : 'flat'}
          sparkData={metrics.map((m) => m.avg_position)}
          sparkColor="var(--chart-clicks)"
        />
        <KPI
          label="CTR"
          value={`${(avgCtr * 100).toFixed(2)}%`}
          delta=""
          deltaDirection="flat"
          sparkData={metrics.map((m) => m.ctr)}
          sparkColor="var(--chart-clicks)"
        />
        <KPI
          label="Indexed pages"
          value={formatNumber(latestIndexed)}
          delta={`${indexDelta >= 0 ? '+' : ''}${indexDelta}`}
          deltaDirection={indexDelta > 0 ? 'up' : indexDelta < 0 ? 'down' : 'flat'}
          sparkData={metrics.map((m) => m.indexed_pages)}
          sparkColor="var(--brand)"
        />
        <KPI
          label="Attributed revenue"
          value={`\u20AC${formatNumber(totalRevenue)}`}
          delta={`${revDelta >= 0 ? '+' : ''}${revDelta.toFixed(1)}%`}
          deltaDirection={deltaDir(revDelta)}
          sparkData={metrics.map((m) => m.revenue_eur)}
          sparkColor="var(--chart-rev)"
        />
      </div>

      {/* GSC Performance chart */}
      <Panel
        title="Google Search Console · performance"
        subtitle="Clicks and impressions over the selected period"
      >
        <TimeSeriesChart
          data={chartData}
          series={[
            { dataKey: 'clicks', name: 'Clicks', color: 'var(--chart-clicks)', type: 'area' },
            { dataKey: 'impressions', name: 'Impressions', color: 'var(--chart-impressions)', yAxisId: 'right', type: 'area' },
          ]}
        />
      </Panel>

      {/* GA4 + Funnel */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Google Analytics 4 · traffic & engagement"
          subtitle={`Sessions and attributed revenue · ${period}`}
        >
          <TimeSeriesChart
            data={chartData}
            series={[
              { dataKey: 'sessions', name: 'Sessions', color: 'var(--chart-sessions)', type: 'area' },
              { dataKey: 'revenue', name: 'Revenue (\u20AC)', color: 'var(--chart-rev)', yAxisId: 'right', type: 'area' },
            ]}
            height={220}
          />
        </Panel>
        <Panel
          title="Commercial funnel"
          subtitle={`${period} · attribution via sub-affiliate identifiers`}
        >
          <Funnel
            steps={[
              { label: 'Sessions', value: formatNumber(totalSessions), widthPct: 100 },
              { label: 'Engaged sessions', value: formatNumber(totalEngaged), pct: `${engagedPct}%`, widthPct: 86 },
              { label: 'Affiliate clicks', value: formatNumber(totalAffClicks), pct: `${affClickPct}%`, widthPct: 38 },
              { label: 'Conversions', value: formatNumber(totalConversions), pct: `${convPct}% of clicks`, widthPct: 19 },
              { label: 'Revenue', value: `\u20AC${formatNumber(totalRevenue)}`, pct: `\u20AC${revenuePerConv} / conv`, widthPct: 12 },
            ]}
          />
        </Panel>
      </div>

      {/* Indexation health */}
      <Panel
        title="Indexation health"
        subtitle={`Indexed pages over ${period}`}
        className="mb-5"
      >
        <TimeSeriesChart
          data={chartData}
          series={[
            { dataKey: 'indexed', name: 'Indexed pages', color: 'var(--chart-clicks)', type: 'area' },
          ]}
          height={160}
        />
        <div className="mt-3.5 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Indexed pages</div>
            <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">{formatNumber(latestIndexed)}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Crawl errors</div>
            <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">
              {sum(metrics, 'crawl_errors')}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Index delta</div>
            <div className={`mt-0.5 text-xl font-bold ${indexDelta >= 0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
              {indexDelta >= 0 ? '+' : ''}{indexDelta}
            </div>
          </div>
        </div>
      </Panel>

      {/* Link profile + Content pipeline */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Link profile · authority pipeline"
          subtitle="Placements by tier"
          actions={
            <Link href="#" className="text-xs text-[var(--brand)]">
              Open link registry &rarr;
            </Link>
          }
        >
          <div className="mt-1.5 mb-3 flex items-center justify-between text-[13px]">
            <span>
              <strong>{linkPlacements.totalDocs}</strong> total placements
            </span>
          </div>
          <TierBreakdownBar segments={tierCounts} />
          {linkPlacements.docs.length > 0 && (
            <table className="mt-4 w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Source
                  </th>
                  <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Tier
                  </th>
                  <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    DR
                  </th>
                  <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {linkPlacements.docs.map((link) => (
                  <tr key={link.id}>
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <div className="text-[13px]">{link.source_domain}</div>
                      {link.anchor_text && (
                        <div className="text-[11px] text-[var(--text-muted)]">{link.anchor_text}</div>
                      )}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <TierTag tier={link.tier} />
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2 text-right font-semibold">
                      {link.dr || '-'}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2 text-right text-xs text-[var(--text-muted)]">
                      {link.placed_at ? new Date(link.placed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Content pipeline"
          subtitle="Programmatic + editorial activity"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Generated</div>
              <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">{contentStats.generated}</div>
              <div className="text-[11px] text-[var(--text-muted)]">programmatic</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Updated</div>
              <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">{contentStats.updated}</div>
              <div className="text-[11px] text-[var(--text-muted)]">data refresh</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Pruned</div>
              <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">{contentStats.pruned}</div>
              <div className="text-[11px] text-[var(--text-muted)]">low-yield</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-3.5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Editorial</div>
              <div className="mt-0.5 text-xl font-bold text-[var(--brand-dark)]">{contentStats.editorial}</div>
              <div className="text-[11px] text-[var(--text-muted)]">human-written</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Alerts + Timeline */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Active alerts"
          subtitle="Live thresholds for this site"
        >
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {alertStatus.map((a) => (
                <tr key={a.kind}>
                  <td className="border-b border-[var(--border)] px-3 py-2.5 capitalize text-[var(--text-muted)]">
                    {a.kind} alert
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5 text-right">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        a.status === 'good'
                          ? 'bg-[var(--good-soft)] text-[var(--good)]'
                          : a.status === 'warn'
                          ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                          : 'bg-[var(--bad-soft)] text-[var(--bad)]'
                      }`}
                    >
                      {a.status === 'good' ? '\u2713 ' : ''}{a.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Recent activity timeline"
          subtitle="Last 90 days for this site"
        >
          <IncidentTimeline items={activity.slice(0, 10)} />
        </Panel>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-[var(--text-muted)]">
        Data sources: Google Search Console · Google Analytics 4 · Sub-affiliate attribution · Link registry · Site Audit · Uptime · CWV
      </div>
    </>
  )
}
