// Wrapper around the open-next worker that adds a scheduled handler for cron triggers.
// The open-next worker.js is auto-generated and only exports fetch.

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
import worker from './.open-next/worker.js'

export default {
  fetch: worker.fetch,

  async scheduled(event, env, ctx) {
    const url = 'https://app.atastic.com/api/cron/ingest'
    const request = new Request(url, {
      headers: { 'x-cron-secret': env.CRON_SECRET },
    })
    ctx.waitUntil(worker.fetch(request, env, ctx))
  },
}
