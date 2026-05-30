import React, { Suspense } from 'react'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { parsePeriod, periodLabel } from '@/lib/period'
import { getNetworkKPIs } from '@/lib/metrics'
import { getTopSites } from '@/lib/nine-sites'
import { getActiveAlerts } from '@/lib/alerts'
import { getUserAccountId } from '@/lib/account'
import { getAccountSiteIds } from '@/lib/account'
import { KPI } from '@/components/KPI'
import { SiteCard } from '@/components/SiteCard'
import { PeriodPicker } from '@/components/PeriodPicker'
import { FilterStrip } from '@/components/FilterStrip'
import { AddSiteModal } from '@/components/AddSiteModal'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return n.toLocaleString('en-US')
}

function formatDelta(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function deltaDir(n: number): 'up' | 'down' | 'flat' {
  if (n > 0.5) return 'up'
  if (n < -0.5) return 'down'
  return 'flat'
}

interface Props {
  searchParams: Promise<{ period?: string; page?: string; filter?: string }>
}

export default async function NetworkOverview({ searchParams }: Props) {
  const params = await searchParams
  const period = parsePeriod(params.period)
  const page = parseInt(params.page || '1', 10)

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const accountId = user ? getUserAccountId(user) : undefined
  const accountSiteIds = accountId ? await getAccountSiteIds(payload, accountId) : undefined

  // Check if Google is connected for this account
  let googleConnected = false
  if (accountId) {
    const account = await payload.findByID({ collection: 'accounts', id: accountId })
    googleConnected = !!account.google_oauth?.google_email
  }

  const [kpis, topSites, alerts] = await Promise.all([
    getNetworkKPIs(payload, period, accountId),
    getTopSites(payload, period, 9, page, accountId),
    getActiveAlerts(payload, undefined, accountSiteIds),
  ])

  const totalSites = topSites.totalSites

  // Empty state for new users
  if (totalSites === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl font-bold text-[var(--brand)]">
          ND
        </div>
        <h1 className="mb-2 text-xl font-bold text-[var(--brand-dark)]">Welcome to Network Dashboard</h1>
        <p className="mb-6 max-w-md text-center text-sm text-[var(--text-muted)]">
          {googleConnected
            ? 'Your network is empty. Add your first site from Google Search Console to get started.'
            : 'Your network is empty. Connect your Google account to start pulling Search Console and Analytics data for your sites.'}
        </p>
        {googleConnected ? (
          <AddSiteModal googleConnected={true} />
        ) : (
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white no-underline"
          >
            Go to Settings
          </Link>
        )}
      </div>
    )
  }

  const filters = [
    { label: 'All sites', value: 'all', count: totalSites },
    { label: 'Active alerts', value: 'alerts', count: alerts.length, isAlert: alerts.length > 0 },
    { label: 'Top movers', value: 'movers' },
    { label: 'By niche \u25BE', value: 'niche' },
    { label: 'By market \u25BE', value: 'market' },
    { label: 'By tier \u25BE', value: 'tier' },
    { label: 'Pinned', value: 'pinned' },
  ]

  return (
    <>
      {/* Title row */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
            Network overview
          </h1>
          <div className="mt-1 text-[13px] text-[var(--text-muted)]">
            Live performance across all {totalSites} sites · drill into any card for the full site report.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AddSiteModal googleConnected={googleConnected} />
          <Suspense>
            <PeriodPicker current={period} />
          </Suspense>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI
          label="Network clicks"
          value={formatNumber(kpis.clicks)}
          delta={`${formatDelta(kpis.clicksDelta)} vs prior ${periodLabel(period)}`}
          deltaDirection={deltaDir(kpis.clicksDelta)}
        />
        <KPI
          label="Network impressions"
          value={formatNumber(kpis.impressions)}
          delta={formatDelta(kpis.impressionsDelta)}
          deltaDirection={deltaDir(kpis.impressionsDelta)}
        />
        <KPI
          label="Avg position"
          value={kpis.avgPosition.toFixed(1)}
          delta={`${kpis.positionDelta >= 0 ? '+' : ''}${kpis.positionDelta.toFixed(1)} positions`}
          deltaDirection={kpis.positionDelta > 0 ? 'up' : kpis.positionDelta < 0 ? 'down' : 'flat'}
        />
        <KPI
          label="Indexed pages"
          value={formatNumber(kpis.indexedPages)}
          delta={formatDelta(kpis.indexedDelta)}
          deltaDirection={deltaDir(kpis.indexedDelta)}
        />
        <KPI
          label="Attributed revenue"
          value={`\u20AC${formatNumber(kpis.revenueEur)}`}
          delta={formatDelta(kpis.revenueDelta)}
          deltaDirection={deltaDir(kpis.revenueDelta)}
        />
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Network health
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-lg font-bold">
            <span className="text-[var(--good)]">{kpis.healthGood}</span>
            <span className="text-[var(--warn)]">{kpis.healthWarn}</span>
            <span className="text-[var(--bad)]">{kpis.healthBad}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">good / warn / alert</div>
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <FilterStrip filters={filters} current={params.filter || 'all'} />
      </Suspense>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topSites.sites.map((site) => (
          <SiteCard key={site.domain} site={site} />
        ))}
      </div>

      {/* Pagination */}
      {topSites.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-[18px] py-3.5">
          <div className="text-[13px] text-[var(--text-muted)]">
            Showing{' '}
            <strong className="text-[var(--text)]">
              {(page - 1) * 9 + 1}–{Math.min(page * 9, totalSites)}
            </strong>{' '}
            of <strong className="text-[var(--text)]">{totalSites} sites</strong>
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <a
                href={`?period=${period}&page=${page - 1}`}
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] no-underline"
              >
                &larr; Prev
              </a>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] opacity-40">
                &larr; Prev
              </span>
            )}
            <span className="px-2 text-[13px] text-[var(--text-muted)]">
              Page {page} of {topSites.totalPages}
            </span>
            {page < topSites.totalPages ? (
              <a
                href={`?period=${period}&page=${page + 1}`}
                className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3.5 py-1.5 text-[13px] text-white no-underline"
              >
                Next &rarr;
              </a>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] opacity-40">
                Next &rarr;
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-[var(--text-muted)]">
        Data sources: Google Search Console · Google Analytics 4 · Sub-affiliate attribution · Link registry · Site Audit · Uptime.
      </div>
    </>
  )
}
