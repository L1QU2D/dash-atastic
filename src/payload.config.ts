import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { getValidAccessToken } from '@/lib/google-tokens'
import { ingestGSC, ingestGSCForSite } from '@/jobs/ingest-gsc'
import { ingestGA4, ingestGA4ForSite } from '@/jobs/ingest-ga4'

import { Accounts } from './collections/Accounts'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Sites } from './collections/Sites'
import { SiteMetricsDaily } from './collections/SiteMetricsDaily'
import { LinkPlacements } from './collections/LinkPlacements'
import { Alerts } from './collections/Alerts'
import { AlertConfigs } from './collections/AlertConfigs'
import { Incidents } from './collections/Incidents'
import { ContentEvents } from './collections/ContentEvents'
import { Branding } from './globals/Branding'
import { NetworkDefaults } from './globals/NetworkDefaults'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

const useWranglerProxy = isCLI || !isProduction || !!process.env.USE_WRANGLER_PROXY

const cloudflare = useWranglerProxy
  ? await getCloudflareContextFromWrangler()
  : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Accounts,
    Users,
    Media,
    Sites,
    SiteMetricsDaily,
    LinkPlacements,
    Alerts,
    AlertConfigs,
    Incidents,
    ContentEvents,
  ],
  globals: [Branding, NetworkDefaults],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
  jobs: {
    deleteJobOnComplete: true,
    autoRun: [
      { cron: '* * * * *', limit: 10 },
    ],
    tasks: [
      {
        slug: 'ingest-gsc-site',
        label: 'Ingest GSC for a single site',
        retries: 2,
        inputSchema: [
          { name: 'accountId', type: 'number', required: true },
          { name: 'siteId', type: 'number', required: true },
        ],
        handler: async ({ input, req }) => {
          const { accountId, siteId } = input as { accountId: number; siteId: number }
          const accessToken = await getValidAccessToken(req.payload, accountId)
          if (!accessToken) throw new Error(`Failed to get access token for account ${accountId}`)

          const site = await req.payload.findByID({ collection: 'sites', id: siteId })
          const gscProperty = site.external_ids?.gsc_property
          if (!gscProperty) throw new Error(`Site ${siteId} has no GSC property`)

          await ingestGSCForSite(req.payload, accessToken, siteId, gscProperty)
          return { output: {} }
        },
      },
      {
        slug: 'ingest-ga4-site',
        label: 'Ingest GA4 for a single site',
        retries: 2,
        inputSchema: [
          { name: 'accountId', type: 'number', required: true },
          { name: 'siteId', type: 'number', required: true },
        ],
        handler: async ({ input, req }) => {
          const { accountId, siteId } = input as { accountId: number; siteId: number }
          const accessToken = await getValidAccessToken(req.payload, accountId)
          if (!accessToken) throw new Error(`Failed to get access token for account ${accountId}`)

          const site = await req.payload.findByID({ collection: 'sites', id: siteId })
          const ga4PropertyId = site.external_ids?.ga4_property_id
          if (!ga4PropertyId) throw new Error(`Site ${siteId} has no GA4 property`)

          await ingestGA4ForSite(req.payload, accessToken, siteId, ga4PropertyId)
          return { output: {} }
        },
      },
      {
        slug: 'ingest-gsc',
        label: 'Ingest GSC for all sites',
        schedule: [{ cron: '0 */6 * * *', queue: 'default' }],
        handler: async ({ req }) => {
          await ingestGSC(req.payload)
          return { output: {} }
        },
      },
      {
        slug: 'ingest-ga4',
        label: 'Ingest GA4 for all sites',
        schedule: [{ cron: '0 */3 * * *', queue: 'default' }],
        handler: async ({ req }) => {
          await ingestGA4(req.payload)
          return { output: {} }
        },
      },
    ],
  },
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
