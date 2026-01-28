import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createOutcomeSchema } from '@/schemas/teacher/outcome.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can create outcomes' }, { status: 403 })

    const body = await req.json()
    const parsed = createOutcomeSchema.parse(body)

    // Ensure code unique per course
    const existing = await prisma.courseOutcome.findFirst({ where: { courseId, code: parsed.code } })
    if (existing) return NextResponse.json({ error: 'CO code already exists for this course' }, { status: 400 })

    const co = await prisma.courseOutcome.create({ data: { code: parsed.code, description: parsed.description, bloomLevel: parsed.bloomLevel, courseId } })

    await createAudit(me.id, 'CREATE_COURSE_OUTCOME', 'CourseOutcome', co.id, `Created CO ${co.code} for course ${courseId}`)

    return NextResponse.json({ courseOutcome: co })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
