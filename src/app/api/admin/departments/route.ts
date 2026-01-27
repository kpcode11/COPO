import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createDepartmentSchema } from '@/schemas/admin/department.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createDepartmentSchema.parse(body)

    const existing = await prisma.department.findUnique({ where: { name: parsed.name } })
    if (existing) return NextResponse.json({ error: 'Department already exists' }, { status: 400 })

    const dept = await prisma.department.create({ data: { name: parsed.name, isFirstYear: parsed.isFirstYear ?? false } })

    await createAudit(me.id, 'CREATE_DEPARTMENT', 'Department', dept.id, `Created department ${dept.name}`)

    return NextResponse.json({ department: dept })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const departments = await prisma.department.findMany({ where: {}, orderBy: { name: 'asc' } })
    return NextResponse.json({ departments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
