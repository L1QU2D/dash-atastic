import React from 'react'

interface TierTagProps {
  tier: string | number
  className?: string
}

const tierColors: Record<string, string> = {
  '1': 'bg-[var(--tier1)]',
  '2': 'bg-[var(--tier2)]',
  '3': 'bg-[var(--tier3)]',
  '4': 'bg-[var(--tier4)]',
  '5': 'bg-[var(--tier5)]',
}

export function TierTag({ tier, className = '' }: TierTagProps) {
  const t = String(tier)
  return (
    <span
      className={`inline-block rounded px-[7px] py-[2px] text-[10px] font-bold tracking-wide text-white ${tierColors[t] || tierColors['5']} ${className}`}
    >
      TIER {t}
    </span>
  )
}
