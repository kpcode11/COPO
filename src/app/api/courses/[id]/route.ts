import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const course = await prisma.course.findUnique({ where: { id }, include: { outcomes: true, assessments: { include: { questions: true } }, teachers: { include: { teacher: true } }, coPoMappings: { include: { programOutcome: true } } } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Admin can view all
    if (me.role === 'ADMIN') return NextResponse.json({ course })

    // HOD can view if same department
    if (me.role === 'HOD' && me.departmentId && me.departmentId === course.departmentId) return NextResponse.json({ course })

    // Teacher can view if assigned
    if (me.role === 'TEACHER') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: id, teacherId: me.id } })
      if (assigned) return NextResponse.json({ course })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
