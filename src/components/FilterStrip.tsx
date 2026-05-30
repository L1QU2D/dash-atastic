'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterOption {
  label: string
  value: string
  count?: number
  isAlert?: boolean
}

interface FilterStripProps {
  filters: FilterOption[]
  current: string
}

export function FilterStrip({ filters, current }: FilterStripProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
      <span className="mr-1 font-medium text-[var(--text-muted)]">Filter:</span>
      {filters.map((f) => {
        const isActive = f.value === current
        const base = 'cursor-pointer rounded-2xl border px-3 py-1 text-xs'

        if (f.isAlert && !isActive) {
          return (
            <button
              key={f.value}
              onClick={() => handleClick(f.value)}
              className={`${base} border-[var(--bad-soft)] bg-[var(--bad-soft)] font-semibold text-[var(--bad)]`}
            >
              &#9888; {f.label}{f.count != null ? ` (${f.count})` : ''}
            </button>
          )
        }

        return (
          <button
            key={f.value}
            onClick={() => handleClick(f.value)}
            className={`${base} ${
              isActive
                ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
            }`}
          >
            {f.label}{f.count != null ? ` (${f.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
