import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { getValidAccessToken } from '@/lib/google-tokens'

interface PropertySummary {
  property: string
  displayName: string
}

interface AccountSummary {
  account: string
  displayName: string
  propertySummaries?: PropertySummary[]
}

export async function GET() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accountId = getUserAccountId(user)

  const accessToken = await getValidAccessToken(payload, accountId)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Could not get a valid Google token. Try reconnecting your Google account in Settings.' },
      { status: 400 },
    )
  }

  const ga4Res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!ga4Res.ok) {
    const body = await ga4Res.text()
    payload.logger.error(`GA4 Admin API error (${ga4Res.status}): ${body}`)
    return NextResponse.json(
      { error: 'Failed to fetch GA4 properties' },
      { status: 502 },
    )
  }

  const data: { accountSummaries?: AccountSummary[] } = await ga4Res.json()
  const accounts = data.accountSummaries || []

  // Flatten all properties from all accounts
  const allProperties = accounts.flatMap((acct) =>
    (acct.propertySummaries || []).map((ps) => ({
      propertyId: ps.property.replace('properties/', ''),
      displayName: ps.displayName,
    })),
  )

  // Get existing sites for this account to mark already-used GA4 properties
  const existingSites = await payload.find({
    collection: 'sites',
    where: { account: { equals: accountId } },
    limit: 0,
  })

  const usedGa4Properties = new Set(
    existingSites.docs
      .map((s) => s.external_ids?.ga4_property_id)
      .filter(Boolean),
  )

  const properties = allProperties.map((p) => ({
    propertyId: p.propertyId,
    displayName: p.displayName,
    alreadyUsed: usedGa4Properties.has(p.propertyId),
  }))

  return NextResponse.json({ properties })
}
