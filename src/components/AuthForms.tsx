'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuthForms() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })
        if (!res.ok) {
          const data = await res.json() as { errors?: { message: string }[] }
          setError(data.errors?.[0]?.message || 'Login failed')
          return
        }
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, company }),
          credentials: 'include',
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error || 'Registration failed')
          return
        }
        // Auto-login after registration
        const loginRes = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })
        if (!loginRes.ok) {
          setError('Registered but login failed. Try logging in.')
          return
        }
      }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-5 flex gap-1 rounded-lg bg-[var(--bg)] p-1">
        <button
          type="button"
          onClick={() => { setMode('login'); setError('') }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'login'
              ? 'bg-[var(--brand)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError('') }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'register'
              ? 'bg-[var(--brand)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="mb-4">
            <label htmlFor="company" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Company
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Your company name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--brand)]"
            />
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--brand)]"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--brand)]"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
