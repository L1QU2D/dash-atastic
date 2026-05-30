'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface GSCProperty {
  siteUrl: string
  permissionLevel: string
  alreadyAdded: boolean
}

interface GA4Property {
  propertyId: string
  displayName: string
  alreadyUsed: boolean
}

interface AddSiteModalProps {
  googleConnected: boolean
}

export function AddSiteModal({ googleConnected }: AddSiteModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'pick' | 'ga4' | 'configure'>('pick')

  // Pick step state
  const [properties, setProperties] = useState<GSCProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // GA4 step state
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([])
  const [selectedGa4, setSelectedGa4] = useState<GA4Property | null>(null)
  const [ga4Loading, setGa4Loading] = useState(false)
  const [ga4Error, setGa4Error] = useState('')

  // Configure step state
  const [selected, setSelected] = useState<GSCProperty | null>(null)
  const [domain, setDomain] = useState('')
  const [niche, setNiche] = useState('Uncategorized')
  const [market, setMarket] = useState('US')
  const [tier, setTier] = useState('3')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function openModal() {
    setOpen(true)
    setStep('pick')
    setSelected(null)
    setSelectedGa4(null)
    setError('')
    setGa4Error('')
    setSubmitError('')
    if (googleConnected) {
      fetchProperties()
    }
  }

  function closeModal() {
    setOpen(false)
  }

  async function fetchProperties() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/google/gsc-properties')
      if (!res.ok) {
        const errData: { error?: string } = await res.json()
        setError(errData.error || 'Failed to load properties')
        return
      }
      const data: { properties?: GSCProperty[] } = await res.json()
      setProperties(data.properties || [])
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function fetchGa4Properties() {
    setGa4Loading(true)
    setGa4Error('')
    try {
      const res = await fetch('/api/google/ga4-properties')
      if (!res.ok) {
        const errData: { error?: string } = await res.json()
        setGa4Error(errData.error || 'Failed to load GA4 properties')
        return
      }
      const data: { properties?: GA4Property[] } = await res.json()
      setGa4Properties(data.properties || [])
    } catch {
      setGa4Error('Failed to connect to server')
    } finally {
      setGa4Loading(false)
    }
  }

  function selectProperty(prop: GSCProperty) {
    if (prop.alreadyAdded) return
    setSelected(prop)
    // Derive domain from the property URL
    if (prop.siteUrl.startsWith('sc-domain:')) {
      setDomain(prop.siteUrl.replace('sc-domain:', ''))
    } else {
      try {
        setDomain(new URL(prop.siteUrl).hostname)
      } catch {
        setDomain(prop.siteUrl)
      }
    }
    setNiche('Uncategorized')
    setMarket('US')
    setTier('3')
    setSelectedGa4(null)
    setSubmitError('')
    setStep('ga4')
    fetchGa4Properties()
  }

  function selectGa4(prop: GA4Property) {
    if (prop.alreadyUsed) return
    setSelectedGa4(prop)
    setStep('configure')
  }

  function skipGa4() {
    setSelectedGa4(null)
    setStep('configure')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/sites/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gscProperty: selected.siteUrl,
          domain,
          niche,
          market,
          tier,
          ...(selectedGa4 ? { ga4PropertyId: selectedGa4.propertyId } : {}),
        }),
      })

      if (!res.ok) {
        const errData: { error?: string } = await res.json()
        setSubmitError(errData.error || 'Failed to add site')
        return
      }

      closeModal()
      router.refresh()
    } catch {
      setSubmitError('Failed to connect to server')
    } finally {
      setSubmitting(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const stepTitle =
    step === 'pick'
      ? 'Add Site from Search Console'
      : step === 'ga4'
        ? 'Connect GA4 Property'
        : 'Configure Site'

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 text-[13px] font-medium text-white"
      >
        + Add Site
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="mx-4 w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="m-0 text-lg font-bold text-[var(--brand-dark)]">
                {stepTitle}
              </h2>
              <button
                onClick={closeModal}
                className="border-none bg-transparent text-xl text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {!googleConnected ? (
                <div className="text-center">
                  <p className="mb-4 text-sm text-[var(--text-muted)]">
                    Connect your Google account first to import sites from Search Console.
                  </p>
                  <a
                    href="/dashboard/settings"
                    className="inline-block rounded-md border border-[var(--brand)] bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white no-underline"
                  >
                    Go to Settings
                  </a>
                </div>
              ) : step === 'pick' ? (
                <>
                  {loading && (
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Loading properties...
                    </p>
                  )}
                  {error && (
                    <p className="text-center text-sm text-[var(--bad)]">{error}</p>
                  )}
                  {!loading && !error && properties.length === 0 && (
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      No Search Console properties found for this Google account.
                    </p>
                  )}
                  {!loading && properties.length > 0 && (
                    <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
                      {properties.map((prop) => (
                        <li key={prop.siteUrl}>
                          <button
                            onClick={() => selectProperty(prop)}
                            disabled={prop.alreadyAdded}
                            className={`w-full border-none px-4 py-3 text-left ${
                              prop.alreadyAdded
                                ? 'cursor-not-allowed bg-[var(--surface-alt)] opacity-50'
                                : 'cursor-pointer bg-transparent hover:bg-[var(--brand-soft)]'
                            } rounded-lg`}
                          >
                            <div className="text-sm font-medium text-[var(--text)]">
                              {prop.siteUrl}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {prop.alreadyAdded
                                ? 'Already added'
                                : prop.permissionLevel}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : step === 'ga4' ? (
                <>
                  <p className="mb-3 text-sm text-[var(--text-muted)]">
                    Optionally link a GA4 property to pull analytics data for this site.
                  </p>
                  {ga4Loading && (
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Loading GA4 properties...
                    </p>
                  )}
                  {ga4Error && (
                    <p className="text-center text-sm text-[var(--bad)]">{ga4Error}</p>
                  )}
                  {!ga4Loading && !ga4Error && ga4Properties.length === 0 && (
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      No GA4 properties found for this Google account.
                    </p>
                  )}
                  {!ga4Loading && ga4Properties.length > 0 && (
                    <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
                      {ga4Properties.map((prop) => (
                        <li key={prop.propertyId}>
                          <button
                            onClick={() => selectGa4(prop)}
                            disabled={prop.alreadyUsed}
                            className={`w-full border-none px-4 py-3 text-left ${
                              prop.alreadyUsed
                                ? 'cursor-not-allowed bg-[var(--surface-alt)] opacity-50'
                                : 'cursor-pointer bg-transparent hover:bg-[var(--brand-soft)]'
                            } rounded-lg`}
                          >
                            <div className="text-sm font-medium text-[var(--text)]">
                              {prop.displayName}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {prop.alreadyUsed
                                ? 'Already linked'
                                : `Property ID: ${prop.propertyId}`}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('pick')}
                      className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text)]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={skipGa4}
                      className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text)]"
                    >
                      Skip
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      GSC Property
                    </label>
                    <div className="text-sm text-[var(--text)]">{selected?.siteUrl}</div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      GA4 Property
                    </label>
                    <div className="text-sm text-[var(--text)]">
                      {selectedGa4
                        ? `${selectedGa4.displayName} (${selectedGa4.propertyId})`
                        : 'None'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      required
                      className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Niche
                      </label>
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        required
                        className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Market
                      </label>
                      <input
                        type="text"
                        value={market}
                        onChange={(e) => setMarket(e.target.value)}
                        required
                        className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Tier
                      </label>
                      <select
                        value={tier}
                        onChange={(e) => setTier(e.target.value)}
                        className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
                      >
                        <option value="1">Tier 1</option>
                        <option value="2">Tier 2</option>
                        <option value="3">Tier 3</option>
                        <option value="4">Tier 4</option>
                        <option value="5">Tier 5</option>
                      </select>
                    </div>
                  </div>

                  {submitError && (
                    <p className="mb-3 text-sm text-[var(--bad)]">{submitError}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('ga4')}
                      className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text)]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                    >
                      {submitting ? 'Adding...' : 'Add Site'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
