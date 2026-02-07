import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    const where: any = {}
    if (type === 'COURSE' || type === 'PROGRAM') where.type = type

    const templates = await prisma.surveyTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: templates.length,
      course: templates.filter(t => t.type === 'COURSE').length,
      program: templates.filter(t => t.type === 'PROGRAM').length,
    }

    return NextResponse.json({ templates, stats })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
