import React from 'react'

interface HealthDotProps {
  status: 'good' | 'warn' | 'bad'
}

const labels: Record<string, string> = {
  good: 'Healthy',
  warn: 'Watching',
  bad: 'Action',
}

const dotColors: Record<string, { dot: string; ring: string; text: string }> = {
  good: { dot: 'bg-[var(--good)]', ring: 'shadow-[0_0_0_3px_var(--good-soft)]', text: 'text-[var(--good)]' },
  warn: { dot: 'bg-[var(--warn)]', ring: 'shadow-[0_0_0_3px_var(--warn-soft)]', text: 'text-[var(--warn)]' },
  bad: { dot: 'bg-[var(--bad)]', ring: 'shadow-[0_0_0_3px_var(--bad-soft)]', text: 'text-[var(--bad)]' },
}

export function HealthDot({ status }: HealthDotProps) {
  const c = dotColors[status]
  return (
    <span className={`inline-flex items-center gap-[5px] text-[11px] font-semibold uppercase tracking-wide ${c.text}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot} ${c.ring}`} />
      {labels[status]}
    </span>
  )
}
