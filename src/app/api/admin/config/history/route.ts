import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const history = await prisma.globalConfigHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    return NextResponse.json({ history })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}