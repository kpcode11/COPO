import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not available in production' }, { status: 403 })

    const userCount = await prisma.user.count()
    const programCount = await prisma.program.count()
    const courseCount = await prisma.course.count()

    const seeded = userCount > 0 && programCount > 0 && courseCount > 0
    return NextResponse.json({ seeded, userCount, programCount, courseCount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 500 })
  }
}