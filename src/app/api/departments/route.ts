import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Allow admins and HODs to list departments
    if (me.role !== 'ADMIN' && me.role !== 'HOD') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const depts = await prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
    return NextResponse.json({ departments: depts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}