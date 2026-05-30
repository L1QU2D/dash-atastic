import type { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: typeof user.account === 'object' ? user.account.id : user.account } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: typeof user.account === 'object' ? user.account.id : user.account } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'google_oauth',
      type: 'group',
      fields: [
        {
          name: 'google_email',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'google_refresh_token',
          type: 'text',
          hidden: true,
        },
        {
          name: 'google_access_token',
          type: 'text',
          hidden: true,
        },
        {
          name: 'google_token_expiry',
          type: 'date',
          hidden: true,
        },
        {
          name: 'google_connected_at',
          type: 'date',
          admin: { readOnly: true },
        },
        {
          name: 'google_scopes',
          type: 'json',
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
