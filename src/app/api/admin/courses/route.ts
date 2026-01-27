import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createCourseSchema } from '@/schemas/admin/course.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createCourseSchema.parse(body)

    // Validate related entities
    const semester = await prisma.semester.findUnique({ where: { id: parsed.semesterId } })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 400 })

    const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 })

    const program = await prisma.program.findUnique({ where: { id: parsed.programId } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 400 })

    // Prevent duplicate course code within same semester and program
    const existing = await prisma.course.findFirst({ where: { code: parsed.code, semesterId: parsed.semesterId, programId: parsed.programId } })
    if (existing) return NextResponse.json({ error: 'Course with this code already exists for the semester and program' }, { status: 400 })

    const course = await prisma.course.create({ data: { code: parsed.code, name: parsed.name, semesterId: parsed.semesterId, departmentId: parsed.departmentId, programId: parsed.programId } })

    await createAudit(me.id, 'CREATE_COURSE', 'Course', course.id, `Created course ${course.code} - ${course.name}`)

    return NextResponse.json({ course })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const courses = await prisma.course.findMany({ include: { semester: true, department: true, program: true } })
    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
