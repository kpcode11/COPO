import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createUserSchema } from '@/schemas/common/user.schema'
import { hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createUserSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const hashed = await hashPassword(parsed.password)

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashed,
        role: parsed.role,
        departmentId: parsed.departmentId,
      },
    })

    await createAudit(me.id, 'CREATE_USER', 'User', user.id, `Created user ${user.email}`)

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, name: true, email: true, role: true, departmentId: true, createdAt: true, isActive: true } })
    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
