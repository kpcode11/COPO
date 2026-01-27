import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createTeacherSchema } from '@/schemas/admin/teacher.schema'
import { hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || (me.role !== 'ADMIN' && me.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createTeacherSchema.parse(body)

    // HOD can only create teachers in their department
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== parsed.departmentId) {
      return NextResponse.json({ error: 'HOD can only create teachers in their department' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const plainPassword = parsed.password ?? crypto.randomBytes(6).toString('base64')
    const hashed = await hashPassword(plainPassword)

    const user = await prisma.user.create({ data: { name: parsed.name, email: parsed.email, password: hashed, role: 'TEACHER', departmentId: parsed.departmentId } })

    await createAudit(me.id, 'CREATE_TEACHER', 'User', user.id, `Created teacher ${user.email}`)

    // Return created user and the plain password so admin can share it securely
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, departmentId: user.departmentId }, password: plainPassword })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (me.role === 'ADMIN') {
      const teachers = await prisma.user.findMany({ where: { role: 'TEACHER', deletedAt: null }, select: { id: true, name: true, email: true, departmentId: true, isActive: true } })
      return NextResponse.json({ teachers })
    }

    if (me.role === 'HOD') {
      const teachers = await prisma.user.findMany({ where: { role: 'TEACHER', departmentId: me.departmentId, deletedAt: null }, select: { id: true, name: true, email: true, departmentId: true, isActive: true } })
      return NextResponse.json({ teachers })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
