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

    const { assessmentId } = params
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: true } })
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    // Role-based access
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== assessment.course.departmentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (me.role === 'TEACHER') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: assessment.course.id, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const uploads = await prisma.marksUpload.findMany({ where: { assessmentId }, orderBy: { uploadedAt: 'desc' }, include: { assessment: true } })
    return NextResponse.json({ uploads })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
