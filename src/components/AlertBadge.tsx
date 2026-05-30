import React from 'react'

interface AlertBadgeProps {
  severity: 'critical' | 'warning' | 'info'
  children: React.ReactNode
}

export function AlertBadge({ severity, children }: AlertBadgeProps) {
  if (severity === 'critical') {
    return (
      <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[var(--bad-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--bad)]">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--bad)] text-[10px] font-bold text-white">!</span>
        {children}
      </div>
    )
  }

  if (severity === 'warning') {
    return (
      <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[var(--warn-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--warn)]">
        <span className="text-xs">&#9888;</span>
        {children}
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-1.5 rounded-md bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--brand-dark)]">
      {children}
    </div>
  )
}
