import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { isHod, isAdmin } from '@/lib/auth/rbac'

export async function GET(req: Request, { params }: { params: { deptId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { deptId } = params
    // Only HOD of the department or Admin
    if (!(isAdmin(me) || (isHod(me) && me.departmentId === deptId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Find CQI actions where the CO's course belongs to deptId
    const actions = await prisma.cQIAction.findMany({ include: { courseOutcome: { include: { course: true } } }, where: { courseOutcome: { course: { departmentId: deptId } } }, orderBy: { createdAt: 'desc' } })

    return NextResponse.json({ actions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}