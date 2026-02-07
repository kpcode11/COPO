import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateSemesterSchema, semesterTypeFromNumber } from '@/schemas/admin/academic.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const semester = await prisma.semester.findUnique({
      where: { id },
      include: { academicYear: true, courses: true },
    })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    return NextResponse.json({ semester })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const parsed = updateSemesterSchema.parse(body)

    const existing = await prisma.semester.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })

    const data: any = {}
    if (parsed.number !== undefined) {
      // Check for duplicate number within same academic year
      const dup = await prisma.semester.findFirst({
        where: { number: parsed.number, academicYearId: existing.academicYearId, id: { not: id } },
      })
      if (dup) return NextResponse.json({ error: `Semester ${parsed.number} already exists for this academic year` }, { status: 400 })
      data.number = parsed.number
      data.type = semesterTypeFromNumber(parsed.number)
    }
    if (parsed.isLocked !== undefined) data.isLocked = parsed.isLocked

    const semester = await prisma.semester.update({ where: { id }, data })

    await createAudit(me.id, 'UPDATE_SEMESTER', 'Semester', id, `Updated semester ${semester.number}`)

    return NextResponse.json({ semester })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const semester = await prisma.semester.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })

    if (semester._count.courses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester with existing courses. Remove courses first.' },
        { status: 400 },
      )
    }

    await prisma.semester.delete({ where: { id } })

    await createAudit(me.id, 'DELETE_SEMESTER', 'Semester', id, `Deleted semester ${semester.number}`)

    return NextResponse.json({ message: 'Semester deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
