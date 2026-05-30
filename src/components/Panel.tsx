import React from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Panel({ title, subtitle, actions, tabs, children, className = '' }: PanelProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 ${className}`}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold tracking-tight text-[var(--brand-dark)]">
            {title}
          </h2>
          {subtitle && (
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tabs}
          {actions}
        </div>
      </div>
      {children}
    </div>
  )
}
