import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateCourseSchema } from '@/schemas/admin/course.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = await params
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        semester: { include: { academicYear: true } },
        department: true,
        program: true,
        outcomes: true,
        teachers: { include: { teacher: true } },
      },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    return NextResponse.json({ course })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = await params
    const body = await req.json()
    const parsed = updateCourseSchema.parse(body)

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // If code is changing, check for duplicates within same semester+program
    if (parsed.code && parsed.code !== course.code) {
      const semId = parsed.semesterId || course.semesterId
      const progId = parsed.programId || course.programId
      const dup = await prisma.course.findFirst({
        where: { code: parsed.code, semesterId: semId, programId: progId, id: { not: courseId } },
      })
      if (dup) return NextResponse.json({ error: 'Course with this code already exists for the semester and program' }, { status: 400 })
    }

    // Validate changed relations
    if (parsed.semesterId) {
      const sem = await prisma.semester.findUnique({ where: { id: parsed.semesterId } })
      if (!sem) return NextResponse.json({ error: 'Semester not found' }, { status: 400 })
    }
    if (parsed.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } })
      if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 })
    }
    if (parsed.programId) {
      const prog = await prisma.program.findUnique({ where: { id: parsed.programId } })
      if (!prog) return NextResponse.json({ error: 'Program not found' }, { status: 400 })
    }

    const data: any = {}
    if (parsed.code) data.code = parsed.code
    if (parsed.name) data.name = parsed.name
    if (parsed.semesterId) data.semesterId = parsed.semesterId
    if (parsed.departmentId) data.departmentId = parsed.departmentId
    if (parsed.programId) data.programId = parsed.programId

    const updated = await prisma.course.update({ where: { id: courseId }, data })

    await createAudit(me.id, 'UPDATE_COURSE', 'Course', courseId, `Updated course ${updated.code} - ${updated.name}`)

    return NextResponse.json({ course: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { teachers: true, outcomes: true, assessments: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (course._count.teachers > 0 || course._count.outcomes > 0 || course._count.assessments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing teachers, outcomes, or assessments. Remove them first.' },
        { status: 400 },
      )
    }

    await prisma.course.delete({ where: { id: courseId } })

    await createAudit(me.id, 'DELETE_COURSE', 'Course', courseId, `Deleted course ${course.code} - ${course.name}`)

    return NextResponse.json({ message: 'Course deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
