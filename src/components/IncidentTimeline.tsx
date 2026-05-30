import React from 'react'
import type { ActivityItem } from '@/lib/activity'

interface IncidentTimelineProps {
  items: ActivityItem[]
}

const dotBorders: Record<string, string> = {
  good: 'border-[var(--good)]',
  warn: 'border-[var(--warn)]',
  bad: 'border-[var(--bad)]',
  info: 'border-[var(--brand)]',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const dateStr = d.toISOString().split('T')[0]
  if (diffDays === 0) return `${dateStr} · today`
  if (diffDays === 1) return `${dateStr} · yesterday`
  return `${dateStr} · ${diffDays} days ago`
}

export function IncidentTimeline({ items }: IncidentTimelineProps) {
  if (items.length === 0) {
    return <div className="py-4 text-center text-sm text-[var(--text-muted)]">No recent activity</div>
  }

  return (
    <div className="relative mt-2 pl-[22px]">
      {/* Vertical line */}
      <div className="absolute bottom-1.5 left-[7px] top-1.5 w-0.5 bg-[var(--border)]" />

      {items.map((item, i) => (
        <div
          key={`${item.when}-${i}`}
          className={`relative ${i < items.length - 1 ? 'pb-4' : ''}`}
        >
          {/* Dot */}
          <div
            className={`absolute -left-[22px] top-[5px] h-3.5 w-3.5 rounded-full border-[3px] bg-[var(--card)] ${dotBorders[item.severity]}`}
          />
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {formatDate(item.when)}
          </div>
          <div className="mt-0.5 text-[13px] font-medium">
            {item.what}
          </div>
          {item.why && (
            <div className="mt-0.5 text-xs leading-snug text-[var(--text-muted)]">
              {item.why}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
