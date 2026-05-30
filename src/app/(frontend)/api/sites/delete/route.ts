import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'

export async function POST(request: NextRequest) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { siteId?: number }
  const { siteId } = body

  if (!siteId) {
    return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  }

  const accountId = getUserAccountId(user)

  // Verify the site belongs to this account
  const site = await payload.findByID({
    collection: 'sites',
    id: siteId,
    depth: 0,
  })

  const siteAccountId =
    typeof site.account === 'object' && site.account !== null
      ? (site.account as { id: number }).id
      : site.account

  if (!site || siteAccountId !== accountId) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Delete related metrics first to avoid orphaned rows
  await payload.delete({
    collection: 'site_metrics_daily',
    where: { site: { equals: siteId } },
  })

  // Delete the site
  await payload.delete({
    collection: 'sites',
    id: siteId,
  })

  return NextResponse.json({ success: true })
}
