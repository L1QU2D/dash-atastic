'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface GA4Property {
  propertyId: string
  displayName: string
  alreadyUsed: boolean
}

interface GA4ConfigButtonProps {
  siteId: number
  currentGa4PropertyId?: string
}

export function GA4ConfigButton({ siteId, currentGa4PropertyId }: GA4ConfigButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<GA4Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function openModal() {
    setOpen(true)
    fetchProperties()
  }

  function closeModal() {
    setOpen(false)
  }

  async function fetchProperties() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/google/ga4-properties')
      if (!res.ok) {
        const errData: { error?: string } = await res.json()
        setError(errData.error || 'Failed to load GA4 properties')
        return
      }
      const data: { properties?: GA4Property[] } = await res.json()
      setProperties(data.properties || [])
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function selectProperty(propertyId: string | null) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/sites/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, ga4PropertyId: propertyId }),
      })

      if (!res.ok) {
        const errData: { error?: string } = await res.json()
        setError(errData.error || 'Failed to update GA4 property')
        return
      }

      closeModal()
      router.refresh()
    } catch {
      setError('Failed to connect to server')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--brand-dark)]"
      >
        {currentGa4PropertyId
          ? `GA4 · ${currentGa4PropertyId}`
          : 'Connect GA4'}
        <span className="text-[10px]">&#9998;</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="m-0 text-lg font-bold text-[var(--brand-dark)]">
                {currentGa4PropertyId ? 'Change GA4 Property' : 'Connect GA4 Property'}
              </h2>
              <button
                onClick={closeModal}
                className="border-none bg-transparent text-xl text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5">
              {loading && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Loading GA4 properties...
                </p>
              )}
              {error && (
                <p className="text-center text-sm text-[var(--bad)]">{error}</p>
              )}
              {saving && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Saving...
                </p>
              )}
              {!loading && !saving && !error && properties.length === 0 && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  No GA4 properties found for this Google account.
                </p>
              )}
              {!loading && !saving && properties.length > 0 && (
                <>
                  <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
                    {properties.map((prop) => {
                      const isCurrent = prop.propertyId === currentGa4PropertyId
                      return (
                        <li key={prop.propertyId}>
                          <button
                            onClick={() => selectProperty(prop.propertyId)}
                            disabled={prop.alreadyUsed && !isCurrent}
                            className={`w-full border-none px-4 py-3 text-left ${
                              prop.alreadyUsed && !isCurrent
                                ? 'cursor-not-allowed bg-[var(--surface-alt)] opacity-50'
                                : 'cursor-pointer bg-transparent hover:bg-[var(--brand-soft)]'
                            } rounded-lg`}
                          >
                            <div className="text-sm font-medium text-[var(--text)]">
                              {prop.displayName}
                              {isCurrent && (
                                <span className="ml-2 text-xs text-[var(--brand)]">
                                  (current)
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {prop.alreadyUsed && !isCurrent
                                ? 'Already linked'
                                : `Property ID: ${prop.propertyId}`}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {currentGa4PropertyId && (
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <button
                        onClick={() => selectProperty(null)}
                        className="w-full cursor-pointer rounded-lg border-none bg-transparent px-4 py-2 text-left text-sm text-[var(--bad)] hover:bg-[var(--bad-soft)]"
                      >
                        Disconnect GA4
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
