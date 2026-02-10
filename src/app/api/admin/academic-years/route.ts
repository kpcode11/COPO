import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createAcademicYearSchema } from '@/schemas/admin/academic.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const years = await prisma.academicYear.findMany({
      include: { semesters: { orderBy: { number: 'asc' } } },
      orderBy: { name: 'desc' },
    })
    const sanitized = years.map((y) => ({ ...y, createdAt: y.createdAt?.toISOString() }))
    return NextResponse.json({ academicYears: sanitized })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createAcademicYearSchema.parse(body)

    // Unique name check
    const existing = await prisma.academicYear.findUnique({ where: { name: parsed.name } })
    if (existing) return NextResponse.json({ error: 'Academic year with this name already exists' }, { status: 400 })

    // If setting as active, deactivate all others
    if (parsed.isActive) {
      await prisma.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }

    const year = await prisma.academicYear.create({
      data: { name: parsed.name, isActive: parsed.isActive },
    })

    await createAudit(me.id, 'CREATE_ACADEMIC_YEAR', 'AcademicYear', year.id, `Created academic year ${year.name}`)

    const sanitized = { ...year, createdAt: year.createdAt?.toISOString() }
    return NextResponse.json({ academicYear: sanitized }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
