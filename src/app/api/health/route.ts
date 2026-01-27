import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Simple DB check
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 })
  }
}