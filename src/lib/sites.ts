import type { Payload } from 'payload'

export async function getSiteByDomain(payload: Payload, domain: string, accountId?: number) {
  const where: Record<string, unknown> = { domain: { equals: domain } }
  if (accountId) {
    where.account = { equals: accountId }
  }

  const result = await payload.find({
    collection: 'sites',
    where,
    limit: 1,
  })
  return result.docs[0] || null
}

export async function getAllSites(
  payload: Payload,
  opts?: {
    status?: string
    page?: number
    limit?: number
    sort?: string
    accountId?: number
  },
) {
  const where: Record<string, unknown> = {}
  if (opts?.status) {
    where.status = { equals: opts.status }
  }
  if (opts?.accountId) {
    where.account = { equals: opts.accountId }
  }

  return payload.find({
    collection: 'sites',
    where,
    page: opts?.page || 1,
    limit: opts?.limit || 50,
    sort: opts?.sort || 'domain',
  })
}
