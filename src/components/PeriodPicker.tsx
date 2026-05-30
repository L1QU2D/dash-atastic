'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PERIODS, type Period } from '@/lib/period'

interface PeriodPickerProps {
  current: Period
}

export function PeriodPicker({ current }: PeriodPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleClick(period: Period) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 text-xs">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => handleClick(p)}
          className={`cursor-pointer rounded-md border-none px-3 py-1.5 font-medium ${
            p === current
              ? 'bg-[var(--brand)] text-white'
              : 'bg-transparent text-[var(--text-muted)]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
