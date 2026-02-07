import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createCourseSchema, listCoursesQuerySchema } from '@/schemas/admin/course.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const query = listCoursesQuerySchema.parse({
      academicYearId: searchParams.get('academicYearId') || undefined,
      semesterId: searchParams.get('semesterId') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      programId: searchParams.get('programId') || undefined,
    })

    const where: any = {}
    if (query.semesterId) where.semesterId = query.semesterId
    if (query.departmentId) where.departmentId = query.departmentId
    if (query.programId) where.programId = query.programId
    if (query.academicYearId) where.semester = { academicYearId: query.academicYearId }

    const courses = await prisma.course.findMany({
      where,
      include: {
        semester: { include: { academicYear: true } },
        department: true,
        program: true,
        _count: { select: { teachers: true, outcomes: true } },
      },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createCourseSchema.parse(body)

    // Validate related entities
    const semester = await prisma.semester.findUnique({
      where: { id: parsed.semesterId },
      include: { academicYear: true },
    })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 400 })

    const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 })

    const program = await prisma.program.findUnique({ where: { id: parsed.programId } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 400 })

    // Prevent duplicate course code within same semester and program
    const existing = await prisma.course.findFirst({
      where: { code: parsed.code, semesterId: parsed.semesterId, programId: parsed.programId },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Course with this code already exists for the semester and program' },
        { status: 400 },
      )
    }

    const course = await prisma.course.create({
      data: {
        code: parsed.code,
        name: parsed.name,
        semesterId: parsed.semesterId,
        departmentId: parsed.departmentId,
        programId: parsed.programId,
      },
    })

    await createAudit(me.id, 'CREATE_COURSE', 'Course', course.id, `Created course ${course.code} - ${course.name}`)

    return NextResponse.json({ course }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
