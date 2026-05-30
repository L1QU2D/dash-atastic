import type { Payload } from 'payload'
import type { User } from '@/payload-types'

/**
 * Extract the account ID from a user object, whether the account
 * relationship is populated (object) or just an ID (number).
 */
export function getUserAccountId(user: User): number {
  if (typeof user.account === 'object' && user.account !== null) {
    return user.account.id
  }
  return user.account as number
}

/**
 * Returns a Set of site IDs belonging to the given account.
 */
export async function getAccountSiteIds(
  payload: Payload,
  accountId: number,
): Promise<Set<number>> {
  const sites = await payload.find({
    collection: 'sites',
    where: { account: { equals: accountId } },
    limit: 0,
  })
  return new Set(sites.docs.map((s) => s.id))
}
