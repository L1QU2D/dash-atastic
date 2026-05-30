'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="border-none bg-transparent text-[13px] text-white/80 hover:text-white disabled:opacity-50"
      style={{ cursor: loading ? 'wait' : 'pointer' }}
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  )
}
