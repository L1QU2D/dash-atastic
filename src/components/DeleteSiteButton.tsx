'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteSiteButton({ siteId }: { siteId: string | number }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? '...' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        setConfirming(true)
      }}
      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-red-500 group-hover:opacity-100"
      title="Delete site"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}
