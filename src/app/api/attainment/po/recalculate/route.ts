import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { recalcProgramPO } from '@/lib/attainment-engine/po-calculator'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { programId, semesterId } = body as { programId?: string; semesterId?: string }
    if (!programId || !semesterId) return NextResponse.json({ error: 'programId and semesterId required' }, { status: 400 })

    const program = await prisma.program.findUnique({ where: { id: programId } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    // Allow Admin or HOD of the program
    if (!(isAdmin(me) || (isHod(me) && me.departmentId === program.departmentId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure CO Attainment exists for required COs inside compute function — recalcProgramPO throws if missing
    const { results, auditId } = await recalcProgramPO(programId, semesterId, me.id)

    return NextResponse.json({ results, auditId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}