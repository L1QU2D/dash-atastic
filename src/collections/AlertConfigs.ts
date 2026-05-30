import type { CollectionConfig } from 'payload'

export const AlertConfigs: CollectionConfig = {
  slug: 'alert_configs',
  admin: {
    useAsTitle: 'kind',
    defaultColumns: ['site', 'kind', 'enabled'],
  },
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
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
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'threshold',
      type: 'json',
    },
  ],
}
