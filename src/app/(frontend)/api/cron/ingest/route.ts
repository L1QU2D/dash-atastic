import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ingestGSC } from '@/jobs/ingest-gsc'
import { ingestGA4 } from '@/jobs/ingest-ga4'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const [gsc, ga4] = await Promise.all([
    ingestGSC(payload).catch((err) => {
      payload.logger.error(`Cron GSC ingestion failed: ${err}`)
      return { processed: 0, error: String(err) }
    }),
    ingestGA4(payload).catch((err) => {
      payload.logger.error(`Cron GA4 ingestion failed: ${err}`)
      return { processed: 0, error: String(err) }
    }),
  ])

  return NextResponse.json({ gsc, ga4 })
}
