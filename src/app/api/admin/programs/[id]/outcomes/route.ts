import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const program = await prisma.program.findUnique({ where: { id } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    const outcomes = await prisma.programOutcome.findMany({ where: { programId: id }, orderBy: { code: 'asc' } })
    return NextResponse.json({ outcomes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
