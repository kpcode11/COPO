import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || (me.role !== 'ADMIN' && me.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { teacherId } = params

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // HOD can only view teachers from their department
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== teacher.departmentId) {
      return NextResponse.json({ error: 'HOD can only view teachers from their department' }, { status: 403 })
    }

    const assignments = await prisma.courseTeacher.findMany({
      where: { teacherId },
      include: {
        course: {
          include: {
            department: true,
            program: true,
            semester: {
              include: {
                academicYear: true,
              },
            },
          },
        },
      },
    })

    const courses = assignments.map((a) => a.course)
    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
