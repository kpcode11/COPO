import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createProgramSchema } from '@/schemas/admin/program.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createProgramSchema.parse(body)

    const dept = await prisma.department.findUnique({ where: { id: parsed.departmentId } })
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 })

    const program = await prisma.program.create({ data: { name: parsed.name, departmentId: parsed.departmentId } })

    // Create outcomes: either from templates or default PO1..PO12
    const templates = parsed.outcomeTemplates && parsed.outcomeTemplates.length > 0
      ? parsed.outcomeTemplates
      : Array.from({ length: 12 }, (_, i) => ({ code: `PO${i + 1}`, description: `Program Outcome PO${i + 1}` }))

    for (const t of templates) {
      await prisma.programOutcome.create({ data: { code: t.code, description: t.description ?? '', programId: program.id } })
    }

    await createAudit(me.id, 'CREATE_PROGRAM', 'Program', program.id, `Created program ${program.name}`)

    return NextResponse.json({ program })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const programs = await prisma.program.findMany({ include: { department: true } })
    return NextResponse.json({ programs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
