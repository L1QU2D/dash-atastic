import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  role: 'admin' as const,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create a test account
  const account = await payload.create({
    collection: 'accounts',
    data: { name: 'Test Account' },
  })

  // Create fresh test user with account
  await payload.create({
    collection: 'users',
    data: {
      ...testUser,
      account: account.id,
    },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  for (const user of users.docs) {
    const accountId = typeof user.account === 'object' ? user.account.id : user.account
    await payload.delete({ collection: 'users', id: user.id })
    if (accountId) {
      try {
        await payload.delete({ collection: 'accounts', id: accountId })
      } catch {
        // account may already be deleted
      }
    }
  }
}
