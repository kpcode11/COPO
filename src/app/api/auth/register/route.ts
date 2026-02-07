import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'HOD', 'TEACHER']).default('TEACHER'),
  departmentId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    // Only admins can create new accounts
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only administrators can create accounts.' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const parsed = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await hashPassword(parsed.password)

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashed,
        role: parsed.role,
        departmentId: parsed.departmentId,
        isActive: true,
      },
    })

    await createAudit(me.id, 'CREATE_USER', 'User', user.id, `Admin created user ${user.email} with role ${user.role}`)

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'User created successfully',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}