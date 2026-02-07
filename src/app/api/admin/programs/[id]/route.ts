import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateProgramSchema } from '@/schemas/admin/program.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const program = await prisma.program.findUnique({
      where: { id },
      include: { department: true, outcomes: true },
    })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    return NextResponse.json({ program })
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
    const parsed = updateProgramSchema.parse(body)

    const program = await prisma.program.findUnique({ where: { id } })
    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If name is changing, check uniqueness within department
    if (parsed.name && parsed.name !== program.name) {
      const dup = await prisma.program.findFirst({
        where: { name: parsed.name, departmentId: program.departmentId, id: { not: id } },
      })
      if (dup) return NextResponse.json({ error: 'Program with this name already exists in this department' }, { status: 400 })
    }

    const updated = await prisma.program.update({ where: { id }, data: { name: parsed.name ?? program.name } })

    // Upsert outcome templates if provided
    if (parsed.outcomeTemplates) {
      for (const t of parsed.outcomeTemplates) {
        const existing = await prisma.programOutcome.findFirst({ where: { programId: id, code: t.code } })
        if (existing) {
          await prisma.programOutcome.update({
            where: { id: existing.id },
            data: { description: t.description ?? existing.description },
          })
        } else {
          await prisma.programOutcome.create({
            data: { code: t.code, description: t.description ?? '', programId: id },
          })
        }
      }
    }

    await createAudit(me.id, 'UPDATE_PROGRAM', 'Program', id, `Updated program ${updated.name}`)

    return NextResponse.json({ program: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const program = await prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    if (program._count.courses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with existing courses. Remove courses first.' },
        { status: 400 },
      )
    }

    // Delete program outcomes, then program
    await prisma.programOutcome.deleteMany({ where: { programId: id } })
    await prisma.program.delete({ where: { id } })

    await createAudit(me.id, 'DELETE_PROGRAM', 'Program', id, `Deleted program ${program.name}`)

    return NextResponse.json({ message: 'Program deleted' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
