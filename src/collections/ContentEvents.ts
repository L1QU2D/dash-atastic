import type { CollectionConfig } from 'payload'

export const ContentEvents: CollectionConfig = {
  slug: 'content_events',
  admin: {
    useAsTitle: 'kind',
    defaultColumns: ['site', 'kind', 'count', 'at'],
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
        { label: 'Generated', value: 'generated' },
        { label: 'Updated', value: 'updated' },
        { label: 'Pruned', value: 'pruned' },
        { label: 'Editorial', value: 'editorial' },
      ],
      required: true,
    },
    {
      name: 'count',
      type: 'number',
      required: true,
    },
    {
      name: 'at',
      type: 'date',
      required: true,
    },
    {
      name: 'template',
      type: 'text',
    },
    {
      name: 'note',
      type: 'textarea',
    },
  ],
}
