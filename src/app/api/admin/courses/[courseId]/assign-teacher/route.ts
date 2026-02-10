import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { assignTeacherSchema } from '@/schemas/admin/assign-teacher.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || (me.role !== 'ADMIN' && me.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = params
    const body = await req.json()
    const parsed = assignTeacherSchema.parse(body)

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // HOD can only assign teachers to courses in their department
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== course.departmentId) {
      return NextResponse.json({ error: 'HOD can only assign teachers to courses in their department' }, { status: 403 })
    }

    const teacher = await prisma.user.findUnique({ where: { id: parsed.teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    // Optional: HOD can only assign teachers from their department
    if (me.role === 'HOD' && me.departmentId && teacher.departmentId !== me.departmentId) {
      return NextResponse.json({ error: 'HOD can only assign teachers from their department' }, { status: 403 })
    }

    const existing = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: parsed.teacherId } })
    if (existing) return NextResponse.json({ error: 'Teacher already assigned to course' }, { status: 400 })

    const assignment = await prisma.courseTeacher.create({ data: { courseId, teacherId: parsed.teacherId } })
    await createAudit(me.id, 'ASSIGN_TEACHER', 'CourseTeacher', assignment.id, `Assigned teacher ${parsed.teacherId} to course ${courseId}`)

    return NextResponse.json({ assignment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || (me.role !== 'ADMIN' && me.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = params
    const body = await req.json()
    const parsed = assignTeacherSchema.parse(body)

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // HOD can only unassign teachers from courses in their department
    if (me.role === 'HOD' && me.departmentId && me.departmentId !== course.departmentId) {
      return NextResponse.json({ error: 'HOD can only unassign teachers from courses in their department' }, { status: 403 })
    }

    const assignment = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: parsed.teacherId } })
    if (!assignment) return NextResponse.json({ error: 'Teacher not assigned to this course' }, { status: 404 })

    await prisma.courseTeacher.delete({ where: { id: assignment.id } })
    await createAudit(me.id, 'UNASSIGN_TEACHER', 'CourseTeacher', assignment.id, `Unassigned teacher ${parsed.teacherId} from course ${courseId}`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
