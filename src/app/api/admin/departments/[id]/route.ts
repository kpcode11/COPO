import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateDepartmentSchema } from '@/schemas/admin/department.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { programs: true, _count: { select: { courses: true, users: true } } },
    })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    return NextResponse.json({ department: dept })
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
    const parsed = updateDepartmentSchema.parse(body)

    const dept = await prisma.department.findUnique({ where: { id } })
    if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If name is changing, check uniqueness
    if (parsed.name && parsed.name !== dept.name) {
      const dup = await prisma.department.findUnique({ where: { name: parsed.name } })
      if (dup) return NextResponse.json({ error: 'Department with this name already exists' }, { status: 400 })
    }

    // Only one department can be isFirstYear
    if (parsed.isFirstYear === true && !dept.isFirstYear) {
      const fyDept = await prisma.department.findFirst({ where: { isFirstYear: true, id: { not: id } } })
      if (fyDept) {
        return NextResponse.json(
          { error: `"${fyDept.name}" is already marked as the First Year department. Only one is allowed.` },
          { status: 400 },
        )
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: parsed.name ?? dept.name,
        isFirstYear: parsed.isFirstYear ?? dept.isFirstYear,
      },
    })

    await createAudit(me.id, 'UPDATE_DEPARTMENT', 'Department', id, `Updated department ${updated.name}`)

    return NextResponse.json({ department: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { programs: true, courses: true, users: true } } },
    })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 })

    if (dept._count.programs > 0 || dept._count.courses > 0 || dept._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with existing programs, courses, or users. Remove them first.' },
        { status: 400 },
      )
    }

    await prisma.department.delete({ where: { id } })

    await createAudit(me.id, 'DELETE_DEPARTMENT', 'Department', id, `Deleted department ${dept.name}`)

    return NextResponse.json({ message: 'Department deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
