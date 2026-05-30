import React from 'react'
import { Sparkline } from './Sparkline'

interface KPIProps {
  label: string
  value: string
  delta: string
  deltaDirection: 'up' | 'down' | 'flat'
  sparkData?: number[]
  sparkColor?: string
}

const deltaColors: Record<string, string> = {
  up: 'text-[var(--good)]',
  down: 'text-[var(--bad)]',
  flat: 'text-[var(--text-muted)]',
}

const deltaSymbols: Record<string, string> = {
  up: '\u25B2',
  down: '\u25BC',
  flat: '\u25AC',
}

export function KPI({ label, value, delta, deltaDirection, sparkData, sparkColor }: KPIProps) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-[22px] font-bold tracking-tight text-[var(--brand-dark)]">
        {value}
      </div>
      <div className="mt-1 flex items-end justify-between">
        <span className={`text-xs font-semibold ${deltaColors[deltaDirection]}`}>
          {deltaSymbols[deltaDirection]} {delta}
        </span>
        {sparkData && sparkData.length > 1 && sparkColor && (
          <Sparkline values={sparkData} color={sparkColor} />
        )}
      </div>
    </div>
  )
}
