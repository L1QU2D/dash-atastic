import { getPayload } from 'payload'
import config from '../payload.config'

// Seeded random for reproducible data
function seeded(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

const rand = seeded(42)

function randomBetween(min: number, max: number): number {
  return min + rand() * (max - min)
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function generateSeries(base: number, drift: number, noise: number, days: number = 28): number[] {
  const arr: number[] = []
  let v = base
  for (let i = 0; i < days; i++) {
    v = v + drift + (rand() - 0.5) * noise
    arr.push(Math.max(0, Math.round(v)))
  }
  return arr
}

// Site definitions — 50 sites matching the mockup niches
const siteDefinitions = [
  // Tier 1 — high value sites
  { domain: 'crypto-casinos-us.com', niche: 'US crypto casinos', niche_group: 'payment-method', market: 'US', tier: '1' as const, pinned: true },
  { domain: 'sweepstakes-casino-hub.com', niche: 'Sweepstakes casinos', niche_group: 'sweepstakes', market: 'US', tier: '1' as const },
  { domain: 'best-nj-casinos.com', niche: 'New Jersey regulated', niche_group: 'state-regulated', market: 'US-NJ', tier: '1' as const },
  { domain: 'uk-slots-guide.com', niche: 'UK slot guides', niche_group: 'slots', market: 'UK', tier: '1' as const },
  { domain: 'live-casino-king.com', niche: 'Live casino hub', niche_group: 'live-dealer', market: 'ROW', tier: '1' as const },

  // Tier 2 — strong performers
  { domain: 'pa-online-casino-guide.com', niche: 'Pennsylvania regulated', niche_group: 'state-regulated', market: 'US-PA', tier: '2' as const },
  { domain: 'live-dealer-pro.com', niche: 'Live dealer games', niche_group: 'live-dealer', market: 'UK/EU', tier: '2' as const },
  { domain: 'michigan-casino-sites.com', niche: 'Michigan casinos', niche_group: 'state-regulated', market: 'US-MI', tier: '2' as const },
  { domain: 'fast-payout-casinos.com', niche: 'Fast payout casinos', niche_group: 'payment-method', market: 'EU', tier: '2' as const },
  { domain: 'new-casino-sites-uk.com', niche: 'New UK casino sites', niche_group: 'new-casinos', market: 'UK', tier: '2' as const },

  // Tier 3 — mid-tier
  { domain: 'nodeposit-casino-list.com', niche: 'No-deposit bonuses', niche_group: 'bonuses', market: 'US', tier: '3' as const },
  { domain: 'mobile-slots-hub.com', niche: 'Mobile slots', niche_group: 'slots', market: 'ROW', tier: '3' as const },
  { domain: 'low-wager-casinos-v2.com', niche: 'Low-wager bonuses', niche_group: 'bonuses', market: 'EU', tier: '3' as const },
  { domain: 'blackjack-strategy-pro.com', niche: 'Blackjack strategy', niche_group: 'table-games', market: 'US', tier: '3' as const },
  { domain: 'roulette-guide-eu.com', niche: 'Roulette systems', niche_group: 'table-games', market: 'EU', tier: '3' as const },
  { domain: 'baccarat-online-play.com', niche: 'Online baccarat', niche_group: 'table-games', market: 'ROW', tier: '3' as const },
  { domain: 'free-spins-tracker.com', niche: 'Free spins offers', niche_group: 'bonuses', market: 'UK', tier: '3' as const },
  { domain: 'casino-bonus-codes-24.com', niche: 'Bonus codes', niche_group: 'bonuses', market: 'ROW', tier: '3' as const },
  { domain: 'progressive-jackpots.com', niche: 'Progressive jackpots', niche_group: 'slots', market: 'EU', tier: '3' as const },
  { domain: 'megaways-slots-hub.com', niche: 'Megaways slots', niche_group: 'slots', market: 'UK', tier: '3' as const },

  // Tier 4 — growth stage
  { domain: 'high-rtp-slots.com', niche: 'High-RTP slot guides', niche_group: 'slots', market: 'EU', tier: '4' as const },
  { domain: 'ewallet-casinos.com', niche: 'E-wallet casinos', niche_group: 'payment-method', market: 'EU', tier: '4' as const },
  { domain: 'apple-pay-casino.com', niche: 'Apple Pay casinos', niche_group: 'payment-method', market: 'UK', tier: '4' as const },
  { domain: 'paypal-casino-sites.com', niche: 'PayPal casinos', niche_group: 'payment-method', market: 'UK', tier: '4' as const },
  { domain: 'trustly-casinos.com', niche: 'Trustly casinos', niche_group: 'payment-method', market: 'EU', tier: '4' as const },
  { domain: 'vip-casino-programs.com', niche: 'VIP casino programs', niche_group: 'loyalty', market: 'ROW', tier: '4' as const },
  { domain: 'cashback-casino-offers.com', niche: 'Cashback offers', niche_group: 'bonuses', market: 'EU', tier: '4' as const },
  { domain: 'minimum-deposit-casinos.com', niche: 'Min deposit casinos', niche_group: 'bonuses', market: 'UK', tier: '4' as const },
  { domain: 'scratch-cards-online.com', niche: 'Online scratch cards', niche_group: 'instant-win', market: 'UK', tier: '4' as const },
  { domain: 'keno-online-play.com', niche: 'Online keno', niche_group: 'instant-win', market: 'ROW', tier: '4' as const },

  // Tier 5 — foundational / new
  { domain: 'casino-reviews-daily.com', niche: 'Casino reviews', niche_group: 'reviews', market: 'ROW', tier: '5' as const },
  { domain: 'gambling-news-wire.com', niche: 'Gambling news', niche_group: 'news', market: 'ROW', tier: '5' as const },
  { domain: 'slots-rtp-database.com', niche: 'Slot RTP data', niche_group: 'slots', market: 'ROW', tier: '5' as const },
  { domain: 'online-poker-rooms.com', niche: 'Online poker', niche_group: 'poker', market: 'US', tier: '5' as const },
  { domain: 'sports-betting-101.com', niche: 'Sports betting guide', niche_group: 'sports', market: 'US', tier: '5' as const },
  { domain: 'bingo-sites-uk.com', niche: 'UK bingo sites', niche_group: 'bingo', market: 'UK', tier: '5' as const },
  { domain: 'lottery-results-eu.com', niche: 'EU lottery results', niche_group: 'lottery', market: 'EU', tier: '5' as const },
  { domain: 'virtual-sports-bet.com', niche: 'Virtual sports', niche_group: 'sports', market: 'EU', tier: '5' as const },
  { domain: 'esports-betting-hub.com', niche: 'Esports betting', niche_group: 'sports', market: 'ROW', tier: '5' as const },
  { domain: 'crash-games-guide.com', niche: 'Crash gambling', niche_group: 'instant-win', market: 'ROW', tier: '5' as const },
  { domain: 'dice-games-crypto.com', niche: 'Crypto dice games', niche_group: 'payment-method', market: 'ROW', tier: '5' as const },
  { domain: 'casino-app-reviews.com', niche: 'Casino app reviews', niche_group: 'reviews', market: 'US', tier: '5' as const },
  { domain: 'real-money-slots-us.com', niche: 'Real money slots', niche_group: 'slots', market: 'US', tier: '5' as const },
  { domain: 'new-slot-releases.com', niche: 'New slot releases', niche_group: 'slots', market: 'ROW', tier: '5' as const },
  { domain: 'table-games-guide.com', niche: 'Table game guides', niche_group: 'table-games', market: 'EU', tier: '5' as const },
  { domain: 'gamification-casinos.com', niche: 'Gamification casinos', niche_group: 'loyalty', market: 'EU', tier: '5' as const },
  { domain: 'casino-affiliate-tips.com', niche: 'Affiliate tips', niche_group: 'industry', market: 'ROW', tier: '5' as const },
  { domain: 'responsible-gambling-info.com', niche: 'Responsible gambling', niche_group: 'industry', market: 'ROW', tier: '5' as const },
  { domain: 'casino-license-checker.com', niche: 'License checker', niche_group: 'industry', market: 'ROW', tier: '5' as const },
  { domain: 'provably-fair-games.com', niche: 'Provably fair games', niche_group: 'payment-method', market: 'ROW', tier: '5' as const },
]

const sourceDomains = [
  'marketwatch.com', 'usatoday.com', 'cryptoslate.com', 'thesun.co.uk',
  'decrypt.co', 'gamblersconnect.com', 'reddit.com', 'bestcasinosites.net',
  'forbes.com', 'bloomberg.com', 'coindesk.com', 'techcrunch.com',
  'mashable.com', 'wired.com', 'business-insider.com', 'yahoo.com',
]

const anchorTexts = [
  'best crypto casinos', 'online casino guide', 'top slot sites',
  'casino reviews 2026', 'best bonuses', 'live dealer casinos',
  'instant withdrawal casinos', 'no deposit bonus', 'mobile casino apps',
  'VIP casino programs', 'real money slots', 'new casino sites',
]

async function seed() {
  console.log('Starting seed...')

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Set up branding
  console.log('Setting up branding...')
  await payload.updateGlobal({
    slug: 'branding',
    data: {
      product_name: 'Network Dashboard',
      customer_tag: 'Cat Media · Managed Network',
      logo_initials: 'ND',
      primary_color: '#2E75B6',
      dark_color: '#1F4E79',
      soft_color: '#EAF1F7',
    },
  })

  // Set up network defaults
  await payload.updateGlobal({
    slug: 'network_defaults',
    data: {
      default_alert_thresholds: {
        indexation_drop_pct: 15,
        ranking_collapse_positions: 10,
        traffic_anomaly_pct: 25,
        uptime_min_pct: 99.5,
      },
      content_refresh_cadence: 7,
      link_velocity_bands: {
        low: { min: 0, max: 5 },
        normal: { min: 5, max: 20 },
        high: { min: 20, max: 50 },
        aggressive: { min: 50, max: null },
      },
    },
  })

  // Create default account
  console.log('Creating default account...')
  const defaultAccount = await payload.create({
    collection: 'accounts',
    data: { name: 'Cat Media Network' },
  })
  const accountId = defaultAccount.id

  // Create sites
  console.log('Creating 50 sites...')
  const siteIds = new Map<string, number>()

  for (const def of siteDefinitions) {
    const site = await payload.create({
      collection: 'sites',
      data: {
        account: accountId,
        domain: def.domain,
        status: 'active',
        niche: def.niche,
        niche_group: def.niche_group,
        market: def.market,
        tier: def.tier,
        pinned: def.pinned || false,
        launched_at: new Date(2024, randomInt(0, 11), randomInt(1, 28)).toISOString(),
        hosting_provider: pick(['Cloudflare', 'AWS', 'Hetzner', 'Vultr', 'DigitalOcean']),
        external_ids: {
          gsc_property: `sc-domain:${def.domain}`,
          ga4_property_id: `${randomInt(100000000, 999999999)}`,
          subaffiliate_tracking_id: `sa_${def.domain.replace(/[^a-z0-9]/g, '_').slice(0, 20)}`,
        },
      },
    })
    siteIds.set(def.domain, site.id)
  }

  // Create 28+ days of metrics per site
  console.log('Creating daily metrics (28 days x 50 sites = 1400 records)...')
  const today = new Date(2026, 4, 30) // May 30 2026

  for (const def of siteDefinitions) {
    const siteId = siteIds.get(def.domain)!
    const tierMultiplier = { '1': 5, '2': 3, '3': 2, '4': 1.2, '5': 0.5 }[def.tier] || 1

    const baseClicks = randomBetween(200, 800) * tierMultiplier
    const baseImpressions = baseClicks * randomBetween(20, 40)
    const baseSessions = baseClicks * randomBetween(0.8, 1.2)
    const baseRevenue = baseClicks * randomBetween(0.3, 0.6)
    const baseIndexed = randomBetween(2000, 15000) * tierMultiplier

    const clicksSeries = generateSeries(baseClicks, randomBetween(-2, 8), baseClicks * 0.15, 35)
    const impressionsSeries = generateSeries(baseImpressions, randomBetween(-50, 200), baseImpressions * 0.12, 35)
    const sessionsSeries = generateSeries(baseSessions, randomBetween(-1, 5), baseSessions * 0.15, 35)
    const revenueSeries = generateSeries(baseRevenue, randomBetween(-1, 4), baseRevenue * 0.2, 35)
    const indexedSeries = generateSeries(baseIndexed, randomBetween(2, 8), baseIndexed * 0.005, 35)

    for (let dayOffset = 34; dayOffset >= 0; dayOffset--) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      const idx = 34 - dayOffset

      const clicks = clicksSeries[idx]
      const impressions = impressionsSeries[idx]
      const sessions = sessionsSeries[idx]
      const revenue = revenueSeries[idx]
      const indexed = indexedSeries[idx]

      await payload.create({
        collection: 'site_metrics_daily',
        data: {
          site: siteId,
          date: date.toISOString().split('T')[0] + 'T00:00:00.000Z',
          clicks,
          impressions,
          ctr: impressions > 0 ? clicks / impressions : 0,
          avg_position: randomBetween(5, 25),
          indexed_pages: indexed,
          crawl_errors: randomInt(0, 20),
          sessions,
          engaged_sessions: Math.round(sessions * randomBetween(0.75, 0.92)),
          affiliate_clicks: Math.round(sessions * randomBetween(0.2, 0.45)),
          conversions: Math.round(sessions * randomBetween(0.01, 0.04)),
          revenue_eur: revenue,
          uptime_pct: randomBetween(99.5, 100),
          lcp_ms: randomInt(800, 2400),
          inp_ms: randomInt(50, 200),
          cls: randomBetween(0, 0.15),
        },
      })
    }
  }

  // Create link placements
  console.log('Creating link placements...')
  for (const def of siteDefinitions.slice(0, 20)) {
    const siteId = siteIds.get(def.domain)!
    const placementCount = randomInt(3, 12)

    for (let i = 0; i < placementCount; i++) {
      const tier = pick(['1', '2', '3', '3', '4', '4', '4', '5', '5', '5'] as const)
      const daysAgo = randomInt(1, 60)
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)

      await payload.create({
        collection: 'link_placements',
        data: {
          site: siteId,
          target_url: `https://${def.domain}/${pick(['', 'guide', 'best-' + def.niche.split(' ')[0].toLowerCase(), 'reviews'])}`,
          source_domain: pick(sourceDomains),
          source_url: `https://${pick(sourceDomains)}/article-${randomInt(1000, 9999)}`,
          anchor_text: pick(anchorTexts),
          tier,
          dr: randomInt(
            tier === '1' ? 85 : tier === '2' ? 70 : tier === '3' ? 50 : tier === '4' ? 30 : 10,
            tier === '1' ? 95 : tier === '2' ? 85 : tier === '3' ? 70 : tier === '4' ? 50 : 30,
          ),
          placed_at: date.toISOString(),
          status: pick(['live', 'live', 'live', 'pending'] as const),
          kind: pick(['guest_post', 'link_insert', 'press_release', 'editorial', 'forum_social'] as const),
          cost_eur: randomInt(50, 2000),
        },
      })
    }
  }

  // Create alerts
  console.log('Creating alerts...')
  // One critical alert for sweepstakes-casino-hub
  const sweepstakesId = siteIds.get('sweepstakes-casino-hub.com')!
  await payload.create({
    collection: 'alerts',
    data: {
      site: sweepstakesId,
      kind: 'indexation_drop',
      severity: 'critical',
      status: 'open',
      triggered_at: new Date(2026, 4, 25).toISOString(),
      signal: {
        currentIndexed: 4120,
        previousIndexed: 6800,
        changePct: -39.4,
        message: 'Indexation drop detected · failover prepped — successor on standby',
      },
    },
  })

  // Warning for nodeposit-casino-list
  const nodepositId = siteIds.get('nodeposit-casino-list.com')!
  await payload.create({
    collection: 'alerts',
    data: {
      site: nodepositId,
      kind: 'ranking_collapse',
      severity: 'warning',
      status: 'open',
      triggered_at: new Date(2026, 4, 27).toISOString(),
      signal: {
        affectedTerms: 14,
        avgPositionShift: 4.2,
        message: 'Ranking softening on 14 head terms — review pending',
      },
    },
  })

  // Some resolved alerts for history
  for (let i = 0; i < 5; i++) {
    const siteId = pick(Array.from(siteIds.values()))
    const triggeredDaysAgo = randomInt(10, 60)
    const triggeredAt = new Date(today)
    triggeredAt.setDate(triggeredAt.getDate() - triggeredDaysAgo)
    const resolvedAt = new Date(triggeredAt)
    resolvedAt.setDate(resolvedAt.getDate() + randomInt(1, 5))

    await payload.create({
      collection: 'alerts',
      data: {
        site: siteId,
        kind: pick(['traffic_anomaly', 'indexation_drop', 'ranking_collapse', 'uptime_cwv'] as const),
        severity: pick(['warning', 'info'] as const),
        status: 'resolved',
        triggered_at: triggeredAt.toISOString(),
        resolved_at: resolvedAt.toISOString(),
        signal: { message: 'Auto-resolved — metric recovered' },
      },
    })
  }

  // Create alert configs
  console.log('Creating alert configs...')
  const alertKinds = ['indexation_drop', 'ranking_collapse', 'manual_action', 'traffic_anomaly', 'link_velocity', 'uptime_cwv'] as const
  for (const siteId of Array.from(siteIds.values()).slice(0, 20)) {
    for (const kind of alertKinds) {
      await payload.create({
        collection: 'alert_configs',
        data: {
          site: siteId,
          kind,
          enabled: true,
          threshold: kind === 'indexation_drop'
            ? { drop_pct: 15 }
            : kind === 'ranking_collapse'
            ? { position_shift: 10 }
            : kind === 'traffic_anomaly'
            ? { drop_pct: 25 }
            : { enabled: true },
        },
      })
    }
  }

  // Create content events
  console.log('Creating content events...')
  for (const def of siteDefinitions.slice(0, 15)) {
    const siteId = siteIds.get(def.domain)!

    for (let i = 0; i < 4; i++) {
      const daysAgo = randomInt(1, 30)
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)

      await payload.create({
        collection: 'content_events',
        data: {
          site: siteId,
          kind: pick(['generated', 'updated', 'pruned', 'editorial'] as const),
          count: randomInt(5, 500),
          at: date.toISOString(),
          template: pick(['review-page', 'comparison', 'bonus-page', 'guide', null]),
          note: pick([
            'Scheduled weekly refresh',
            'Data spine update: new operators',
            'Low-yield page cleanup',
            'Manual editorial addition',
            null,
          ]),
        },
      })
    }
  }

  // Create incidents
  console.log('Creating incidents...')
  await payload.create({
    collection: 'incidents',
    data: {
      site: sweepstakesId,
      title: 'Indexation drop investigation',
      started_at: new Date(2026, 4, 25).toISOString(),
      outcome: 'ongoing',
      summary: 'Indexation dropped ~40%. Failover prepared. Monitoring recovery.',
      actions_taken: [
        { description: 'Submitted reindex request for top 50 URLs', at: new Date(2026, 4, 25).toISOString(), by: 'ops.team' },
        { description: 'Prepared successor site redirect map', at: new Date(2026, 4, 26).toISOString(), by: 'ops.team' },
      ],
    },
  })

  console.log('Seed complete!')
  console.log(`Created:`)
  console.log(`  - 1 account (${defaultAccount.name})`)
  console.log(`  - 50 sites`)
  console.log(`  - ${50 * 35} daily metric records`)
  console.log(`  - Link placements for top 20 sites`)
  console.log(`  - 7+ alerts (2 active, 5 resolved)`)
  console.log(`  - Alert configs for top 20 sites`)
  console.log(`  - Content events for top 15 sites`)
  console.log(`  - 1 incident`)

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
