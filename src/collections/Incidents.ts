import type { CollectionConfig } from 'payload'

export const Incidents: CollectionConfig = {
  slug: 'incidents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['site', 'title', 'started_at', 'outcome'],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'started_at',
      type: 'date',
      required: true,
    },
    {
      name: 'resolved_at',
      type: 'date',
    },
    {
      name: 'outcome',
      type: 'select',
      options: [
        { label: 'Recovered', value: 'recovered' },
        { label: 'Failed over', value: 'failed_over' },
        { label: 'Decommissioned', value: 'decommissioned' },
        { label: 'Ongoing', value: 'ongoing' },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'linked_alerts',
      type: 'relationship',
      relationTo: 'alerts',
      hasMany: true,
    },
    {
      name: 'actions_taken',
      type: 'array',
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'at',
          type: 'date',
        },
        {
          name: 'by',
          type: 'text',
        },
      ],
    },
    {
      name: 'post_mortem',
      type: 'richText',
    },
  ],
}
