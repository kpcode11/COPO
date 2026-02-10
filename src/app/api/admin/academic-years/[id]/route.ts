import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateAcademicYearSchema } from '@/schemas/admin/academic.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: { semesters: { orderBy: { number: 'asc' } } },
    })
    if (!year) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })
    const sanitized = { ...year, createdAt: year.createdAt?.toISOString() }
    return NextResponse.json({ academicYear: sanitized })
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
    const parsed = updateAcademicYearSchema.parse(body)

    const existing = await prisma.academicYear.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })

    // If name is changing, check uniqueness
    if (parsed.name && parsed.name !== existing.name) {
      const dup = await prisma.academicYear.findUnique({ where: { name: parsed.name } })
      if (dup) return NextResponse.json({ error: 'Academic year with this name already exists' }, { status: 400 })
    }

    // If setting as active, deactivate all others
    if (parsed.isActive === true && !existing.isActive) {
      await prisma.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }

    const year = await prisma.academicYear.update({
      where: { id },
      data: { ...parsed },
    })

    await createAudit(me.id, 'UPDATE_ACADEMIC_YEAR', 'AcademicYear', year.id, `Updated academic year ${year.name}`)

    const sanitized = { ...year, createdAt: year.createdAt?.toISOString() }
    return NextResponse.json({ academicYear: sanitized })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: { semesters: { include: { _count: { select: { courses: true } } } } },
    })
    if (!year) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })

    // Block deletion if any semester has courses
    const hasCourses = year.semesters.some((s) => s._count.courses > 0)
    if (hasCourses) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with existing courses. Remove courses first.' },
        { status: 400 },
      )
    }

    // Delete child semesters first, then the academic year
    await prisma.semester.deleteMany({ where: { academicYearId: id } })
    await prisma.academicYear.delete({ where: { id } })

    await createAudit(me.id, 'DELETE_ACADEMIC_YEAR', 'AcademicYear', id, `Deleted academic year ${year.name}`)

    return NextResponse.json({ message: 'Academic year deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
