import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { getDepartmentSummary } from '@/lib/reports'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deptId } = params
    const dept = await prisma.department.findUnique({ where: { id: deptId } })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 })

    if (!(isAdmin(me) || (isHod(me) && me.departmentId === deptId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await getDepartmentSummary(deptId)
    return NextResponse.json({ department: { id: dept.id, name: dept.name }, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}