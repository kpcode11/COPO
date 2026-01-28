import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { getSemesterAttainment } from '@/lib/reports'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { semesterId } = params
    const semester = await prisma.semester.findUnique({ where: { id: semesterId } })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })

    // Admin or HODs
    if (!(isAdmin(me) || isHod(me))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await getSemesterAttainment(semesterId)
    return NextResponse.json({ semester: { id: semester.id, number: semester.number }, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}