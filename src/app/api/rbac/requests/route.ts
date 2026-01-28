import { NextResponse } from 'next/server'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { requestedRole, reason } = body
    if (!requestedRole) return NextResponse.json({ error: 'requestedRole is required' }, { status: 400 })

    await createAudit(me.id, 'ROLE_REQUEST', 'User', me.id, JSON.stringify({ requestedRole, reason }))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}