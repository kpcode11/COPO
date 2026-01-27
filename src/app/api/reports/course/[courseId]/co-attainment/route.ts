import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod, isTeacher } from '@/lib/auth/rbac'
import { getCourseCoAttainment } from '@/lib/reports'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Permission: Admin, HOD of department, assigned teacher
    if (isAdmin(me) || (isHod(me) && me.departmentId === course.departmentId)) {
      const data = await getCourseCoAttainment(courseId)
      return NextResponse.json({ course: { id: course.id, name: course.name, code: course.code }, cos: data })
    }

    if (isTeacher(me)) {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const data = await getCourseCoAttainment(courseId)
      return NextResponse.json({ course: { id: course.id, name: course.name, code: course.code }, cos: data })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}