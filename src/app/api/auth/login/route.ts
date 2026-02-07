import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loginSchema } from '@/schemas/common/auth.schema'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (!user || !user.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await verifyPassword(parsed.password, user.password)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const { token, expiresAt } = await createSession(user.id)

    await createAudit(user.id, 'LOGIN', 'User', user.id, `User logged in`)

    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } })
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    res.headers.append('Set-Cookie', `session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`)
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
