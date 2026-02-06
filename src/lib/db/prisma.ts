import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma 7 uses the "client" engine by default, which requires either:
 *   - an `adapter` (e.g. @prisma/adapter-pg) for direct DB connections, or
 *   - an `accelerateUrl` for Prisma Accelerate.
 *
 * Connection URLs for `prisma migrate` are configured in prisma.config.ts.
 */

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL?.trim() || undefined
const databaseUrl = process.env.DATABASE_URL?.trim() || undefined

if (!accelerateUrl && !databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn('Prisma: no PRISMA_ACCELERATE_URL or DATABASE_URL found in environment. Ensure .env is configured.')
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (accelerateUrl) {
    // Use Prisma Accelerate
    return new PrismaClient({ accelerateUrl } as any)
  }

  // Use @prisma/adapter-pg for direct PostgreSQL connection
  // PrismaPg expects a Pool or PoolConfig object, not a raw connection string
  const adapter = new PrismaPg({ connectionString: databaseUrl! })
  return new PrismaClient({ adapter } as any)
}

export const prisma = global.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

