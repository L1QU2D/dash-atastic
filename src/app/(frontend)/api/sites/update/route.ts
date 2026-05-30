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
  })

  if (!site || site.account !== accountId) {
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

  return NextResponse.json({ success: true })
}
