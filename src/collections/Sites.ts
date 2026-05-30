import type { CollectionConfig } from 'payload'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    useAsTitle: 'domain',
    defaultColumns: ['domain', 'status', 'niche', 'market', 'tier'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return true
      if (user.role === 'admin') return true
      const accountId = typeof user.account === 'object' ? user.account.id : user.account
      return { account: { equals: accountId } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      const accountId = typeof user.account === 'object' ? user.account.id : user.account
      return { account: { equals: accountId } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Standby', value: 'standby' },
        { label: 'Decommissioned', value: 'decommissioned' },
        { label: 'Redirected', value: 'redirected' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'niche',
      type: 'text',
      required: true,
    },
    {
      name: 'niche_group',
      type: 'text',
    },
    {
      name: 'market',
      type: 'text',
      required: true,
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
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'launched_at',
      type: 'date',
    },
    {
      name: 'successor_of',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'standby_for',
      type: 'relationship',
      relationTo: 'sites',
    },
    {
      name: 'hosting_provider',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'external_ids',
      type: 'group',
      fields: [
        {
          name: 'gsc_property',
          type: 'text',
          label: 'GSC Property',
        },
        {
          name: 'ga4_property_id',
          type: 'text',
          label: 'GA4 Property ID',
        },
        {
          name: 'subaffiliate_tracking_id',
          type: 'text',
          label: 'Sub-affiliate Tracking ID',
        },
      ],
    },
  ],
}
