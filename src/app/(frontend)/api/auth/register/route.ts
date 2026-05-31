import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string
    password?: string
    company?: string
  }

  const { email, password, company } = body

  if (!email || !password || !company) {
    return NextResponse.json(
      { error: 'Email, password, and company are required' },
      { status: 400 },
    )
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Create the account with the company name
  const account = await payload.create({
    collection: 'accounts',
    data: { name: company },
  })

  // Create the user linked to that account
  try {
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'viewer',
        account: account.id,
      },
    })
  } catch (err) {
    // Clean up the account if user creation fails (e.g. duplicate email)
    await payload.delete({ collection: 'accounts', id: account.id })
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
