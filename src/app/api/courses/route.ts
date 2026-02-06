import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { listCoursesQuerySchema } from '@/schemas/admin/course.schema'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const query = Object.fromEntries(url.searchParams.entries())
    const parsed = listCoursesQuerySchema.parse(query)

    const where: any = {}
    if (parsed.academicYearId) where.semester = { academicYearId: parsed.academicYearId }
    if (parsed.semesterId) where.semesterId = parsed.semesterId
    if (parsed.departmentId) where.departmentId = parsed.departmentId
    if (parsed.programId) where.programId = parsed.programId

    // Role-based visibility
    if (me.role === 'ADMIN') {
      // no extra filter
    } else if (me.role === 'HOD') {
      where.departmentId = me.departmentId
    } else if (me.role === 'TEACHER') {
      // Only courses assigned to teacher
      const assignments = await prisma.courseTeacher.findMany({ where: { teacherId: me.id } })
      const courseIds = assignments.map((a: { courseId: string }) => a.courseId)
      where.id = { in: courseIds }
    }

    const courses = await prisma.course.findMany({ where, include: { department: true, program: true, semester: true } })
    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
