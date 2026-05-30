import React from 'react'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { getAccountSiteIds } from '@/lib/account'

interface Props {
  searchParams: Promise<{ severity?: string; status?: string; site?: string; page?: string }>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AlertsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const accountId = user ? getUserAccountId(user) : undefined
  const accountSiteIds = accountId ? await getAccountSiteIds(payload, accountId) : undefined

  const conditions: Record<string, unknown>[] = []

  if (params.severity) {
    conditions.push({ severity: { equals: params.severity } })
  }
  if (params.status) {
    conditions.push({ status: { equals: params.status } })
  }

  // If filtering by site domain
  if (params.site) {
    const site = await payload.find({
      collection: 'sites',
      where: { domain: { equals: params.site } },
      limit: 1,
    })
    if (site.docs[0]) {
      conditions.push({ site: { equals: site.docs[0].id } })
    }
  }

  const alertsResult = await payload.find({
    collection: 'alerts',
    where: conditions.length > 0 ? { and: conditions } : {},
    sort: '-triggered_at',
    page,
    limit: 20,
    depth: 1,
  })

  // Filter by account's sites
  if (accountSiteIds) {
    alertsResult.docs = alertsResult.docs.filter((alert) => {
      const sid = typeof alert.site === 'object' ? (alert.site as unknown as { id: number }).id : alert.site
      return accountSiteIds.has(sid as number)
    })
    alertsResult.totalDocs = alertsResult.docs.length
  }
  const alerts = alertsResult

  const severityColors: Record<string, string> = {
    critical: 'bg-[var(--bad-soft)] text-[var(--bad)]',
    warning: 'bg-[var(--warn-soft)] text-[var(--warn)]',
    info: 'bg-[var(--brand-soft)] text-[var(--brand-dark)]',
  }

  const statusColors: Record<string, string> = {
    open: 'bg-[var(--bad-soft)] text-[var(--bad)]',
    acknowledged: 'bg-[var(--warn-soft)] text-[var(--warn)]',
    resolved: 'bg-[var(--good-soft)] text-[var(--good)]',
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
          Alerts feed
        </h1>
        <div className="mt-1 text-[13px] text-[var(--text-muted)]">
          {alerts.totalDocs} alerts total
          {params.site && ` · filtered by ${params.site}`}
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/alerts"
          className={`rounded-2xl border px-3 py-1 text-xs no-underline ${
            !params.severity && !params.status ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--border)] bg-[var(--card)]'
          }`}
        >
          All
        </Link>
        {['critical', 'warning', 'info'].map((sev) => (
          <Link
            key={sev}
            href={`/dashboard/alerts?severity=${sev}`}
            className={`rounded-2xl border px-3 py-1 text-xs capitalize no-underline ${
              params.severity === sev ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--border)] bg-[var(--card)]'
            }`}
          >
            {sev}
          </Link>
        ))}
        <span className="mx-1 text-[var(--border)]">|</span>
        {['open', 'acknowledged', 'resolved'].map((st) => (
          <Link
            key={st}
            href={`/dashboard/alerts?status=${st}`}
            className={`rounded-2xl border px-3 py-1 text-xs capitalize no-underline ${
              params.status === st ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--border)] bg-[var(--card)]'
            }`}
          >
            {st}
          </Link>
        ))}
      </div>

      {alerts.docs.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-center text-[var(--text-muted)]">
          No alerts found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Site
                </th>
                <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Kind
                </th>
                <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Severity
                </th>
                <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Status
                </th>
                <th className="border-b border-[var(--border)] bg-[#FAFBFC] px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Triggered
                </th>
              </tr>
            </thead>
            <tbody>
              {alerts.docs.map((alert) => {
                const site = typeof alert.site === 'object' ? alert.site as { domain: string } : null
                return (
                  <tr key={alert.id} className="hover:bg-[var(--brand-soft)]/30">
                    <td className="border-b border-[var(--border)] px-3 py-2.5">
                      {site ? (
                        <Link
                          href={`/dashboard/sites/${site.domain}`}
                          className="font-semibold text-[var(--brand-dark)]"
                        >
                          {site.domain}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2.5 capitalize">
                      {(alert.kind as string).replace(/_/g, ' ')}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize ${severityColors[alert.severity as string] || ''}`}>
                        {alert.severity as string}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize ${statusColors[alert.status as string] || ''}`}>
                        {alert.status as string}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
                      {alert.triggered_at ? formatDate(alert.triggered_at as string) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {alerts.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/alerts?page=${page - 1}${params.severity ? `&severity=${params.severity}` : ''}${params.status ? `&status=${params.status}` : ''}`}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm no-underline"
            >
              &larr; Prev
            </a>
          )}
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {alerts.totalPages}
          </span>
          {page < alerts.totalPages && (
            <a
              href={`/dashboard/alerts?page=${page + 1}${params.severity ? `&severity=${params.severity}` : ''}${params.status ? `&status=${params.status}` : ''}`}
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
