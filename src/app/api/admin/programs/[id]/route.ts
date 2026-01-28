import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateProgramSchema } from '@/schemas/admin/program.schema'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const body = await req.json()
    const parsed = updateProgramSchema.parse(body)

    const program = await prisma.program.findUnique({ where: { id } })
    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.program.update({ where: { id }, data: { name: parsed.name ?? program.name } })

    // Upsert outcome templates if provided
    if (parsed.outcomeTemplates) {
      for (const t of parsed.outcomeTemplates) {
        const existing = await prisma.programOutcome.findFirst({ where: { programId: id, code: t.code } })
        if (existing) {
          await prisma.programOutcome.update({ where: { id: existing.id }, data: { description: t.description ?? existing.description } })
        } else {
          await prisma.programOutcome.create({ data: { code: t.code, description: t.description ?? '', programId: id } })
        }
      }
    }

    await createAudit(me.id, 'UPDATE_PROGRAM', 'Program', id, `Updated program ${updated.name}`)

    return NextResponse.json({ program: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
