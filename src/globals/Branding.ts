import type { GlobalConfig } from 'payload'

export const Branding: GlobalConfig = {
  slug: 'branding',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'product_name',
      type: 'text',
      defaultValue: 'Atastic',
      required: true,
    },
    {
      name: 'customer_tag',
      type: 'text',
      defaultValue: 'Managed Network',
    },
    {
      name: 'primary_color',
      type: 'text',
      defaultValue: '#2E75B6',
    },
    {
      name: 'dark_color',
      type: 'text',
      defaultValue: '#1F4E79',
    },
    {
      name: 'soft_color',
      type: 'text',
      defaultValue: '#EAF1F7',
    },
    {
      name: 'logo_initials',
      type: 'text',
      defaultValue: 'AT',
    },
  ],
}
