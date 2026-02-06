import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Access control: Admin, HOD (same dept), assigned teacher
    if (me.role === 'ADMIN') {
      // allowed
    } else if (me.role === 'HOD' && (!me.departmentId || me.departmentId !== course.departmentId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else if (me.role === 'TEACHER') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assessments = await prisma.assessment.findMany({ where: { courseId }, orderBy: { date: 'asc' }, include: { questions: true } })
    return NextResponse.json({ assessments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
