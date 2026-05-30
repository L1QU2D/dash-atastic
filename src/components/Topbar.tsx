import React from 'react'
import Link from 'next/link'

interface TopbarProps {
  productName: string
  customerTag: string
  logoInitials: string
  siteCount: number
  userEmail: string
}

export function Topbar({ productName, customerTag, logoInitials, siteCount, userEmail }: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center justify-between border-b-[3px] border-[var(--brand)] bg-[var(--brand-dark)] px-7 py-3.5 text-white">
      <Link href="/dashboard" className="flex items-center gap-3.5 no-underline text-white hover:no-underline">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-base font-bold tracking-tight text-white">
          {logoInitials}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold">{productName} Network Operations</span>
          <span className="text-[11px] uppercase tracking-wide opacity-75">{customerTag}</span>
        </div>
      </Link>
      <div className="flex items-center gap-5 text-[13px] opacity-90">
        <span>Network: <strong>{siteCount} sites</strong></span>
        <span className="opacity-50">|</span>
        <Link
          href="/dashboard/settings"
          className="text-white/80 no-underline hover:text-white"
          title="Settings"
        >
          Settings
        </Link>
        <span className="opacity-50">|</span>
        <div className="flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold">
            {initials}
          </div>
          <span>{userEmail}</span>
        </div>
      </div>
    </div>
  )
}
