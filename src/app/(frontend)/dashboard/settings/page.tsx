import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { GoogleDisconnectButton } from '@/components/GoogleDisconnectButton'

interface Props {
  searchParams: Promise<{ google?: string; message?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/')
  }

  const accountId = getUserAccountId(user)
  const account = await payload.findByID({
    collection: 'accounts',
    id: accountId,
  })

  const googleEmail = account.google_oauth?.google_email
  const googleConnected = !!googleEmail
  const googleConnectedAt = account.google_oauth?.google_connected_at

  const hasGoogleConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REDIRECT_URI)

  return (
    <>
      <div className="mb-6">
        <h1 className="m-0 text-2xl font-bold tracking-tight text-[var(--brand-dark)]">
          Settings
        </h1>
        <div className="mt-1 text-[13px] text-[var(--text-muted)]">
          Manage your account and integrations
        </div>
      </div>

      {/* Status messages */}
      {params.google === 'connected' && (
        <div className="mb-4 rounded-lg border border-[var(--good)] bg-[var(--good-soft)] px-4 py-3 text-[13px] text-[var(--good)]">
          Google account connected successfully.
        </div>
      )}
      {params.google === 'error' && (
        <div className="mb-4 rounded-lg border border-[var(--bad)] bg-[var(--bad-soft)] px-4 py-3 text-[13px] text-[var(--bad)]">
          Google connection failed: {params.message || 'Unknown error'}
        </div>
      )}

      {/* Account section */}
      <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
        <h2 className="m-0 mb-4 text-base font-bold text-[var(--brand-dark)]">Account</h2>
        <div className="grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Account name
            </div>
            <div className="mt-1 font-medium text-[var(--text)]">{account.name}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Email
            </div>
            <div className="mt-1 font-medium text-[var(--text)]">{user.email}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Role
            </div>
            <div className="mt-1 font-medium capitalize text-[var(--text)]">{user.role}</div>
          </div>
        </div>
      </div>

      {/* Google Integration section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
        <h2 className="m-0 mb-4 text-base font-bold text-[var(--brand-dark)]">
          Google Integration
        </h2>
        <div className="text-[13px] text-[var(--text-muted)]">
          Connect your Google account to pull Search Console and Analytics data for your sites.
        </div>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[#FBFCFD] px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    googleConnected ? 'bg-[var(--good)]' : 'bg-[var(--text-muted)]'
                  }`}
                />
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {googleConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              {googleConnected && (
                <div className="mt-1.5 space-y-0.5 text-[12px] text-[var(--text-muted)]">
                  <div>Google account: <span className="font-medium text-[var(--text)]">{googleEmail}</span></div>
                  {googleConnectedAt && (
                    <div>
                      Connected:{' '}
                      {new Date(googleConnectedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              {googleConnected ? (
                <GoogleDisconnectButton />
              ) : hasGoogleConfig ? (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  href="/api/google/connect"
                  className="inline-block rounded-md border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 text-[13px] font-medium text-white no-underline"
                >
                  Connect Google
                </a>
              ) : (
                <span className="text-[12px] text-[var(--text-muted)]">
                  Google OAuth not configured
                </span>
              )}
            </div>
          </div>
        </div>

        {!googleConnected && hasGoogleConfig && (
          <div className="mt-3 text-[11px] text-[var(--text-muted)]">
            Required scopes: Search Console (read-only), Analytics (read-only), User email
          </div>
        )}
      </div>
    </>
  )
}
