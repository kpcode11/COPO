import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Admin can view all
    if (me.role === 'ADMIN') {
      const outcomes = await prisma.courseOutcome.findMany({ where: { courseId }, orderBy: { code: 'asc' } })
      return NextResponse.json({ outcomes })
    }

    // HOD can view if same department
    if (me.role === 'HOD' && me.departmentId && me.departmentId === course.departmentId) {
      const outcomes = await prisma.courseOutcome.findMany({ where: { courseId }, orderBy: { code: 'asc' } })
      return NextResponse.json({ outcomes })
    }

    // Teacher can view if assigned
    if (me.role === 'TEACHER') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const outcomes = await prisma.courseOutcome.findMany({ where: { courseId }, orderBy: { code: 'asc' } })
      return NextResponse.json({ outcomes })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
