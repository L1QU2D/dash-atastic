import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { AuthForms } from '@/components/AuthForms'

export default async function WelcomePage() {
  // If already authenticated, redirect to dashboard
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand)] text-xl font-bold text-white">
            ND
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
            Welcome to Network Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Sign in to your account or register to get started.
          </p>
        </div>
        <AuthForms />
      </div>
    </div>
  )
}
