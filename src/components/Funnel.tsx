import React from 'react'

interface FunnelStep {
  label: string
  value: string
  pct?: string
  widthPct: number
}

interface FunnelProps {
  steps: FunnelStep[]
}

const bgShades = [
  'bg-[var(--brand-soft)]',
  'bg-[var(--brand-soft)]',
  'bg-[#DBE9F7]',
  'bg-[#D1E0EE]',
  'bg-[#C2D5E8]',
]

export function Funnel({ steps }: FunnelProps) {
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      {steps.map((step, i) => (
        <div
          key={step.label}
          className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] font-semibold text-[var(--brand-dark)] ${bgShades[i] || bgShades[0]}`}
          style={{ width: `${step.widthPct}%` }}
        >
          <span>{step.label}</span>
          <span className="font-bold">
            {step.value}
            {step.pct && <span className="ml-1 text-[11px] font-medium text-[var(--text-muted)]">{step.pct}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
