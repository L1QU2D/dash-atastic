import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserAccountId } from '@/lib/account'
import { getValidAccessToken } from '@/lib/google-tokens'
import { ingestGSCForSite } from '@/jobs/ingest-gsc'
import { ingestGA4ForSite } from '@/jobs/ingest-ga4'

/**
 * Derive a clean domain from a GSC property URL.
 * Handles both formats:
 *   - "sc-domain:example.com" → "example.com"
 *   - "https://example.com/" → "example.com"
 */
function extractDomain(gscPropertyUrl: string): string {
  if (gscPropertyUrl.startsWith('sc-domain:')) {
    return gscPropertyUrl.replace('sc-domain:', '')
  }
  try {
    const url = new URL(gscPropertyUrl)
    return url.hostname
  } catch {
    return gscPropertyUrl
  }
}

export async function POST(request: NextRequest) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    gscProperty?: string
    domain?: string
    niche?: string
    market?: string
    tier?: string
    ga4PropertyId?: string
  }
  const { gscProperty, niche, market, tier, ga4PropertyId } = body

  if (!gscProperty) {
    return NextResponse.json(
      { error: 'gscProperty is required' },
      { status: 400 },
    )
  }

  const accountId = getUserAccountId(user)
  const domain = body.domain || extractDomain(gscProperty)

  // Check for duplicate domain
  const existing = await payload.find({
    collection: 'sites',
    where: { domain: { equals: domain } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return NextResponse.json(
      { error: `Site "${domain}" already exists` },
      { status: 409 },
    )
  }

  const newSite = await payload.create({
    collection: 'sites',
    data: {
      account: accountId,
      domain,
      status: 'active',
      niche: niche || 'Uncategorized',
      market: market || 'US',
      tier: (tier || '3') as '1' | '2' | '3' | '4' | '5',
      external_ids: {
        gsc_property: gscProperty,
        ...(ga4PropertyId ? { ga4_property_id: ga4PropertyId } : {}),
      },
    },
  })

  // Pull initial data inline so it's available immediately
  try {
    const accessToken = await getValidAccessToken(payload, accountId)
    if (accessToken) {
      await ingestGSCForSite(payload, accessToken, newSite.id, gscProperty)
      if (ga4PropertyId) {
        await ingestGA4ForSite(payload, accessToken, newSite.id, ga4PropertyId)
      }
    }
  } catch (err) {
    payload.logger.error(`Initial ingestion failed for site ${newSite.id}: ${err}`)
  }

  return NextResponse.json({ success: true })
}
