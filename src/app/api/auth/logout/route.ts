import { NextResponse } from 'next/server'
import { deleteSessionByToken } from '@/lib/auth/session'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|; )session=([^;]+)/)
    const token = match ? decodeURIComponent(match[1]) : null
    if (token) {
      await deleteSessionByToken(token)
      // best-effort audit (user unknown here)
      await createAudit('system', 'LOGOUT', 'Session', token, 'User logged out')
    }

    const res = NextResponse.json({ ok: true })
    res.headers.append('Set-Cookie', `session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`)
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
