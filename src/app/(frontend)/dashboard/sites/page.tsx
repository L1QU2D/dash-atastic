import React, { Suspense } from 'react'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { HealthDot } from '@/components/HealthDot'
import { TierTag } from '@/components/TierTag'
import { PeriodPicker } from '@/components/PeriodPicker'
import { parsePeriod } from '@/lib/period'
import { getUserAccountId } from '@/lib/account'

interface Props {
  searchParams: Promise<{ page?: string; period?: string }>
}

export default async function AllSitesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const period = parsePeriod(params.period)
  const limit = 25

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const accountId = user ? getUserAccountId(user) : undefined

  const sites = await payload.find({
    collection: 'sites',
    where: accountId ? { account: { equals: accountId } } : {},
    page,
    limit,
    sort: 'domain',
    depth: 1,
  })

  // Get open alerts to determine health
  const openAlerts = await payload.find({
    collection: 'alerts',
    where: { status: { not_equals: 'resolved' } },
    limit: 0,
  })

  const alertsBySite = new Map<string, string>()
  for (const alert of openAlerts.docs) {
    const siteId = typeof alert.site === 'object' ? String((alert.site as unknown as { id: number }).id) : String(alert.site)
    if (alert.severity === 'critical') alertsBySite.set(siteId, 'bad')
    else if (!alertsBySite.has(siteId)) alertsBySite.set(siteId, 'warn')
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
            All sites
          </h1>
          <div className="mt-1 text-[13px] text-[var(--text-muted)]">
            {sites.totalDocs} sites total
          </div>
        </div>
        <Suspense>
          <PeriodPicker current={period} />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Domain
              </th>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </th>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Niche
              </th>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Market
              </th>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tier
              </th>
              <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {sites.docs.map((site) => {
              const health = (alertsBySite.get(String(site.id)) as 'good' | 'warn' | 'bad') || 'good'
              return (
                <tr key={site.id} className="hover:bg-[var(--brand-soft)]/30">
                  <td className="border-b border-[var(--border)] px-3 py-2.5">
                    <Link
                      href={`/dashboard/sites/${site.domain}`}
                      className="font-semibold text-[var(--brand-dark)]"
                    >
                      {site.domain}
                    </Link>
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5 capitalize text-[var(--text-muted)]">
                    {site.status}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5 text-[var(--text-muted)]">
                    {site.niche}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5">
                    <span className="rounded bg-[var(--brand-soft)] px-1.5 py-px text-[10px] font-semibold text-[var(--brand-dark)]">
                      {site.market}
                    </span>
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5">
                    <TierTag tier={site.tier} />
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2.5">
                    <HealthDot status={health} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sites.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/sites?page=${page - 1}&period=${period}`}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm no-underline"
            >
              &larr; Prev
            </a>
          )}
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {sites.totalPages}
          </span>
          {page < sites.totalPages && (
            <a
              href={`/dashboard/sites?page=${page + 1}&period=${period}`}
              className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-3 py-1.5 text-sm text-white no-underline"
            >
              Next &rarr;
            </a>
          )}
        </div>
      )}
    </>
  )
}
