import React from 'react'
import Link from 'next/link'
import { Sparkline } from './Sparkline'
import { HealthDot } from './HealthDot'
import { TierTag } from './TierTag'
import { AlertBadge } from './AlertBadge'
import { DeleteSiteButton } from './DeleteSiteButton'
import type { SiteCardData } from '@/lib/nine-sites'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n.toLocaleString('en-US')
}

function formatCurrency(n: number): string {
  return '\u20AC' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function SiteCard({ site }: { site: SiteCardData }) {
  const clicksDeltaDir = site.clicksDelta > 0.5 ? 'up' : site.clicksDelta < -0.5 ? 'down' : 'flat'
  const impDeltaDir = site.impressionsDelta > 0.5 ? 'up' : site.impressionsDelta < -0.5 ? 'down' : 'flat'
  const clickColor = clicksDeltaDir === 'up' ? '#15803D' : clicksDeltaDir === 'down' ? '#B91C1C' : '#6B7280'
  const impColor = impDeltaDir === 'up' ? '#2E75B6' : impDeltaDir === 'down' ? '#B91C1C' : '#6B7280'

  const deltaSymbol = (dir: string) => dir === 'up' ? '\u25B2' : dir === 'down' ? '\u25BC' : '\u25AC'
  const deltaColor = (dir: string) => dir === 'up' ? 'text-[var(--good)]' : dir === 'down' ? 'text-[var(--bad)]' : 'text-[var(--text-muted)]'

  let cardBorder = 'border-[var(--border)]'
  let cardShadow = ''
  if (site.alertSeverity === 'critical') {
    cardBorder = 'border-[#FCA5A5]'
    cardShadow = 'shadow-[inset_4px_0_0_var(--bad)]'
  } else if (site.successorOf) {
    cardBorder = 'border-[var(--brand-border)]'
    cardShadow = 'shadow-[inset_4px_0_0_var(--brand)]'
  }

  return (
    <Link
      href={`/dashboard/sites/${site.domain}`}
      className="group block no-underline"
    >
      <div
        className={`relative cursor-pointer rounded-xl border bg-[var(--card)] px-[18px] pb-3.5 pt-4 transition-all hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(31,78,121,0.08)] ${cardBorder} ${cardShadow}`}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold leading-tight text-[var(--brand-dark)]">
              {site.domain}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              {site.niche}
              <span className="rounded bg-[var(--brand-soft)] px-1.5 py-px text-[10px] font-semibold tracking-wide text-[var(--brand-dark)]">
                {site.market}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-end gap-1.5">
              <HealthDot status={site.health} />
              <TierTag tier={site.tier} />
            </div>
            <DeleteSiteButton siteId={site.id} />
          </div>
        </div>

        {/* Metrics row */}
        <div className="mb-2.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-[var(--border)] bg-[#FAFBFC] px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Clicks
            </div>
            <div className="mt-0.5 text-base font-bold leading-tight">{formatNumber(site.clicks)}</div>
            <div className="mt-1 flex items-end justify-between">
              <span className={`text-[11px] font-semibold ${deltaColor(clicksDeltaDir)}`}>
                {deltaSymbol(clicksDeltaDir)} {Math.abs(site.clicksDelta).toFixed(1)}%
              </span>
              {site.sparkClicks.length > 1 && (
                <Sparkline values={site.sparkClicks} color={clickColor} />
              )}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[#FAFBFC] px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Impressions
            </div>
            <div className="mt-0.5 text-base font-bold leading-tight">{formatNumber(site.impressions)}</div>
            <div className="mt-1 flex items-end justify-between">
              <span className={`text-[11px] font-semibold ${deltaColor(impDeltaDir)}`}>
                {deltaSymbol(impDeltaDir)} {Math.abs(site.impressionsDelta).toFixed(1)}%
              </span>
              {site.sparkImpressions.length > 1 && (
                <Sparkline values={site.sparkImpressions} color={impColor} />
              )}
            </div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-3 gap-2 border-t border-dashed border-[var(--border)] pt-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Avg position</span>
            <span className="mt-0.5 text-[13px] font-bold text-[var(--brand-dark)]">{site.avgPosition.toFixed(1)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Indexed</span>
            <span className="mt-0.5 text-[13px] font-bold">{formatNumber(site.indexedPages)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Revenue</span>
            <span className="mt-0.5 text-[13px] font-bold text-[var(--good)]">{formatCurrency(site.revenueEur)}</span>
          </div>
        </div>

        {/* Banners */}
        {site.alertSeverity === 'critical' && site.alert && (
          <AlertBadge severity="critical">{site.alert}</AlertBadge>
        )}
        {site.alertSeverity === 'warning' && site.alert && (
          <AlertBadge severity="warning">{site.alert}</AlertBadge>
        )}
        {site.successorOf && (
          <div className="mt-3 rounded-md bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--brand-dark)]">
            &#8635; Successor of {site.successorOf}
          </div>
        )}
      </div>
    </Link>
  )
}
