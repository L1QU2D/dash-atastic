import type { CollectionConfig, CollectionAfterLoginHook, CollectionBeforeChangeHook } from 'payload'

const afterLogin: CollectionAfterLoginHook = async ({ req, user }) => {
  await req.payload.update({
    collection: 'users',
    id: user.id,
    data: { last_login_at: new Date().toISOString() },
  })
  return user
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && !data.account) {
    const email = data.email || 'Unknown'
    const account = await req.payload.create({
      collection: 'accounts',
      data: { name: `${email}'s Network` },
    })
    data.account = account.id
  }
  return data
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: () => true, // Allow self-registration
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      const accountId = typeof user.account === 'object' ? user.account.id : user.account
      return { account: { equals: accountId } }
    },
  },
  hooks: {
    afterLogin: [afterLogin],
    beforeChange: [beforeChange],
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
      name: 'role',
      type: 'select',
      defaultValue: 'viewer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Operator', value: 'operator' },
        { label: 'Viewer', value: 'viewer' },
      ],
      required: true,
    },
    {
      name: 'mfa_enabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'last_login_at',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
}
