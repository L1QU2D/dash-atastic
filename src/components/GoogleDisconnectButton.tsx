'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GoogleDisconnectButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    if (!confirm('Disconnect your Google account? This will stop data syncing.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/google/disconnect', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="rounded-md border border-[var(--bad)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--bad)] disabled:opacity-50"
    >
      {loading ? 'Disconnecting...' : 'Disconnect'}
    </button>
  )
}
