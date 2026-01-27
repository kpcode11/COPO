import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { outcomes: true, department: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Admin can view all; HOD only same dept; Teacher assigned
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== course.departmentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (me.role === 'TEACHER') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const aggregates = await prisma.cOSurveyAggregate.findMany({ where: { courseOutcome: { courseId } }, include: { courseOutcome: true } })
    return NextResponse.json({ aggregates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}