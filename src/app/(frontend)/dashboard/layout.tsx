import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Topbar } from '@/components/Topbar'
import { getUserAccountId } from '@/lib/account'

export const metadata = {
  title: 'Network Dashboard',
  description: 'Network operations dashboard',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/')
  }

  const accountId = getUserAccountId(user)

  // Get branding config and account name
  const [branding, account] = await Promise.all([
    payload.findGlobal({ slug: 'branding' }),
    payload.findByID({ collection: 'accounts', id: accountId }),
  ])

  // Count active sites scoped by account
  const sitesResult = await payload.find({
    collection: 'sites',
    where: {
      and: [
        { status: { equals: 'active' } },
        { account: { equals: accountId } },
      ],
    },
    limit: 0,
  })

  return (
    <>
      <Topbar
        productName={branding.product_name || 'Network Dashboard'}
        customerTag={account.name}
        logoInitials={branding.logo_initials || 'ND'}
        siteCount={sitesResult.totalDocs}
        userEmail={user.email}
      />
      <main className="mx-auto max-w-[1480px] px-7 py-6 pb-16">
        {children}
      </main>
    </>
  )
}
