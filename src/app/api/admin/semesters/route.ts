import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createSemesterSchema, semesterTypeFromNumber } from '@/schemas/admin/academic.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')

    const where: any = {}
    if (academicYearId) where.academicYearId = academicYearId

    const semesters = await prisma.semester.findMany({
      where,
      include: { academicYear: true, _count: { select: { courses: true } } },
      orderBy: [{ academicYear: { name: 'desc' } }, { number: 'asc' }],
    })
    return NextResponse.json({ semesters })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createSemesterSchema.parse(body)

    // Validate academic year exists
    const ay = await prisma.academicYear.findUnique({ where: { id: parsed.academicYearId } })
    if (!ay) return NextResponse.json({ error: 'Academic year not found' }, { status: 400 })

    // Duplicate check: no two semesters with same number in same academic year
    const dup = await prisma.semester.findFirst({
      where: { number: parsed.number, academicYearId: parsed.academicYearId },
    })
    if (dup) {
      return NextResponse.json(
        { error: `Semester ${parsed.number} already exists for ${ay.name}` },
        { status: 400 },
      )
    }

    const type = semesterTypeFromNumber(parsed.number)

    const semester = await prisma.semester.create({
      data: {
        number: parsed.number,
        type,
        academicYearId: parsed.academicYearId,
        isLocked: false,
      },
    })

    await createAudit(me.id, 'CREATE_SEMESTER', 'Semester', semester.id, `Created semester ${semester.number} (${type}) for ${ay.name}`)

    return NextResponse.json({ semester }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
