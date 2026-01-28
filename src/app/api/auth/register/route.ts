import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'
import { z } from 'zod'

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await hashPassword(parsed.password)

    const user = await prisma.user.create({ data: { name: parsed.name, email: parsed.email, password: hashed, role: 'TEACHER', isActive: false } })

    await createAudit(user.id, 'SELF_REGISTER', 'User', user.id, `User self-registered`)

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, message: 'Registration successful, pending admin activation' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}