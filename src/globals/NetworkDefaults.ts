import type { GlobalConfig } from 'payload'

export const NetworkDefaults: GlobalConfig = {
  slug: 'network_defaults',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'default_alert_thresholds',
      type: 'json',
      defaultValue: {
        indexation_drop_pct: 15,
        ranking_collapse_positions: 10,
        traffic_anomaly_pct: 25,
        uptime_min_pct: 99.5,
      },
    },
    {
      name: 'content_refresh_cadence',
      type: 'number',
      defaultValue: 7,
      admin: {
        description: 'Days between content refresh cycles',
      },
    },
    {
      name: 'link_velocity_bands',
      type: 'json',
      defaultValue: {
        low: { min: 0, max: 5 },
        normal: { min: 5, max: 20 },
        high: { min: 20, max: 50 },
        aggressive: { min: 50, max: null },
      },
    },
  ],
}
