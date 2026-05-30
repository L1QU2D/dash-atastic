import type { CollectionConfig } from 'payload'

export const LinkPlacements: CollectionConfig = {
  slug: 'link_placements',
  admin: {
    useAsTitle: 'source_domain',
    defaultColumns: ['site', 'source_domain', 'tier', 'status', 'placed_at'],
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
      name: 'target_url',
      type: 'text',
      required: true,
    },
    {
      name: 'source_domain',
      type: 'text',
      required: true,
    },
    {
      name: 'source_url',
      type: 'text',
    },
    {
      name: 'anchor_text',
      type: 'text',
    },
    {
      name: 'tier',
      type: 'select',
      options: [
        { label: 'Tier 1', value: '1' },
        { label: 'Tier 2', value: '2' },
        { label: 'Tier 3', value: '3' },
        { label: 'Tier 4', value: '4' },
        { label: 'Tier 5', value: '5' },
      ],
      required: true,
    },
    {
      name: 'dr',
      type: 'number',
      label: 'Domain Rating',
    },
    {
      name: 'placed_at',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Pending', value: 'pending' },
        { label: 'Lost', value: 'lost' },
        { label: 'Replaced', value: 'replaced' },
      ],
      required: true,
    },
    {
      name: 'kind',
      type: 'select',
      options: [
        { label: 'Guest post', value: 'guest_post' },
        { label: 'Link insert', value: 'link_insert' },
        { label: 'Press release', value: 'press_release' },
        { label: 'Editorial', value: 'editorial' },
        { label: 'Forum/Social', value: 'forum_social' },
        { label: 'Directory', value: 'directory' },
      ],
    },
    {
      name: 'cost_eur',
      type: 'number',
    },
    {
      name: 'verified_at',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'redirect_replacement',
      type: 'text',
    },
  ],
}
