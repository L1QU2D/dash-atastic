import type { CollectionConfig } from 'payload'

export const SiteMetricsDaily: CollectionConfig = {
  slug: 'site_metrics_daily',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['site', 'date', 'clicks', 'impressions', 'revenue_eur'],
  },
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      index: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    // GSC metrics
    {
      name: 'clicks',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'impressions',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'ctr',
      type: 'number',
    },
    {
      name: 'avg_position',
      type: 'number',
    },
    {
      name: 'indexed_pages',
      type: 'number',
    },
    {
      name: 'crawl_errors',
      type: 'number',
      defaultValue: 0,
    },
    // GA4 metrics
    {
      name: 'sessions',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'engaged_sessions',
      type: 'number',
      defaultValue: 0,
    },
    // Commercial metrics
    {
      name: 'affiliate_clicks',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'conversions',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'revenue_eur',
      type: 'number',
      defaultValue: 0,
    },
    // Infrastructure metrics
    {
      name: 'uptime_pct',
      type: 'number',
    },
    {
      name: 'lcp_ms',
      type: 'number',
    },
    {
      name: 'inp_ms',
      type: 'number',
    },
    {
      name: 'cls',
      type: 'number',
    },
    // Version tracking
    {
      name: 'source_versions',
      type: 'json',
    },
  ],
}
