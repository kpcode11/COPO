import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateDepartmentSchema } from '@/schemas/admin/department.schema'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const body = await req.json()
    const parsed = updateDepartmentSchema.parse(body)

    const dept = await prisma.department.findUnique({ where: { id } })
    if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.department.update({ where: { id }, data: { name: parsed.name ?? dept.name, isFirstYear: parsed.isFirstYear ?? dept.isFirstYear } })

    await createAudit(me.id, 'UPDATE_DEPARTMENT', 'Department', id, `Updated department ${updated.name}`)

    return NextResponse.json({ department: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
