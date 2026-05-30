import React from 'react'

interface TierSegment {
  tier: number
  count: number
  label: string
}

interface TierBreakdownBarProps {
  segments: TierSegment[]
}

const tierColors: Record<number, string> = {
  1: 'var(--tier1)',
  2: 'var(--tier2)',
  3: 'var(--tier3)',
  4: 'var(--tier4)',
  5: 'var(--tier5)',
}

const tierLabels: Record<number, string> = {
  1: 'Tier 1 PR',
  2: 'Tier 2 press release',
  3: 'Tier 3 niche',
  4: 'Tier 4 link inserts',
  5: 'Tier 5 foundational',
}

export function TierBreakdownBar({ segments }: TierBreakdownBarProps) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return null

  return (
    <div>
      <div className="my-2 flex h-[18px] overflow-hidden rounded-md border border-[var(--border)]">
        {segments.map((s) => (
          <div
            key={s.tier}
            className="flex items-center justify-center text-[11px] font-bold text-white"
            style={{
              backgroundColor: tierColors[s.tier],
              flex: s.count,
            }}
          >
            {s.count > 0 && `T${s.tier} · ${s.count}`}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3.5 text-xs text-[var(--text-muted)]">
        {segments.map((s) => (
          <span key={s.tier} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: tierColors[s.tier] }}
            />
            {tierLabels[s.tier] || s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
