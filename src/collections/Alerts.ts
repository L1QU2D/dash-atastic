import type { CollectionConfig } from 'payload'

export const Alerts: CollectionConfig = {
  slug: 'alerts',
  admin: {
    useAsTitle: 'kind',
    defaultColumns: ['site', 'kind', 'severity', 'status', 'triggered_at'],
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
      name: 'kind',
      type: 'select',
      options: [
        { label: 'Indexation drop', value: 'indexation_drop' },
        { label: 'Ranking collapse', value: 'ranking_collapse' },
        { label: 'Manual action', value: 'manual_action' },
        { label: 'Traffic anomaly', value: 'traffic_anomaly' },
        { label: 'Link velocity', value: 'link_velocity' },
        { label: 'Uptime/CWV', value: 'uptime_cwv' },
      ],
      required: true,
    },
    {
      name: 'severity',
      type: 'select',
      options: [
        { label: 'Critical', value: 'critical' },
        { label: 'Warning', value: 'warning' },
        { label: 'Info', value: 'info' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Acknowledged', value: 'acknowledged' },
        { label: 'Resolved', value: 'resolved' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'triggered_at',
      type: 'date',
      required: true,
    },
    {
      name: 'acknowledged_at',
      type: 'date',
    },
    {
      name: 'acknowledged_by',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'resolved_at',
      type: 'date',
    },
    {
      name: 'signal',
      type: 'json',
    },
    {
      name: 'note',
      type: 'richText',
    },
  ],
}
