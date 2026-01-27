import { NextResponse } from 'next/server'
import pkg from '../../../../package.json'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // App version from package.json
    const appVersion = (pkg as any).version
    // Prisma client version
    let prismaVersion = 'unknown'
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pPkg = require('@prisma/client/package.json')
      prismaVersion = pPkg.version
    } catch (e) {}

    // Get DB timestamp
    const now = await (prisma as any).$queryRaw`SELECT now() as now`
    return NextResponse.json({ appVersion, prismaVersion, dbTime: now && now[0] ? now[0].now : null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 500 })
  }
}