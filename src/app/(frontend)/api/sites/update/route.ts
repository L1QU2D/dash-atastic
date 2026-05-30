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

  const body = await request.json() as {
    siteId?: number
    ga4PropertyId?: string | null
  }
  const { siteId, ga4PropertyId } = body

  if (!siteId) {
    return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  }

  const accountId = getUserAccountId(user)

  // Validate the site belongs to this account
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

  await payload.update({
    collection: 'sites',
    id: siteId,
    data: {
      external_ids: {
        ...site.external_ids,
        ga4_property_id: ga4PropertyId || '',
      },
    },
  })

  // Queue immediate GA4 ingestion if a property was connected (fire-and-forget)
  if (ga4PropertyId) {
    payload.jobs.queue({
      task: 'ingest-ga4-site',
      input: { accountId, siteId },
    }).catch((err) => payload.logger.error(`Failed to queue GA4 job for site ${siteId}: ${err}`))
  }

  return NextResponse.json({ success: true })
}
