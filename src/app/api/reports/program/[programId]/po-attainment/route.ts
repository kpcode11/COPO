import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { getProgramPoAttainment } from '@/lib/reports'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request, { params }: { params: { programId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId } = params
    const program = await prisma.program.findUnique({ where: { id: programId } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    if (!(isAdmin(me) || (isHod(me) && me.departmentId === program.departmentId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await getProgramPoAttainment(programId)
    return NextResponse.json({ program: { id: program.id, name: program.name }, outcomes: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}