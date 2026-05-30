import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { getValidAccessToken } from '@/lib/google-tokens'

interface GSCSite {
  siteUrl: string
  permissionLevel: string
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
      { error: 'Google account not connected' },
      { status: 400 },
    )
  }

  // Fetch GSC properties from Google API
  const gscRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!gscRes.ok) {
    const body = await gscRes.text()
    payload.logger.error(`GSC API error (${gscRes.status}): ${body}`)
    return NextResponse.json(
      { error: 'Failed to fetch Search Console properties' },
      { status: 502 },
    )
  }

  const data: { siteEntry?: GSCSite[] } = await gscRes.json()
  const gscSites = data.siteEntry || []

  // Get existing sites for this account to mark already-added ones
  const existingSites = await payload.find({
    collection: 'sites',
    where: { account: { equals: accountId } },
    limit: 0,
  })

  const existingGscProperties = new Set(
    existingSites.docs
      .map((s) => s.external_ids?.gsc_property)
      .filter(Boolean),
  )

  const properties = gscSites.map((site) => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
    alreadyAdded: existingGscProperties.has(site.siteUrl),
  }))

  return NextResponse.json({ properties })
}
