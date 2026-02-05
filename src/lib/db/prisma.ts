import { PrismaClient } from '@prisma/client'

/**
 * PrismaClient constructor now supports passing an `adapter` for a direct DB connection
 * or `accelerateUrl` for Prisma Accelerate. For compatibility and to avoid strict
 * runtime type errors, we build a minimal options object and cast to `any`.
 *
 * Connection URLs for `prisma migrate` are stored in `prisma.config.ts` (see project root).
 */

// Prefer Prisma Accelerate when configured, otherwise default to standard Prisma client
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL?.trim() || undefined
const hasDatabaseUrl = !!process.env.DATABASE_URL

if (!accelerateUrl && !hasDatabaseUrl) {
  // Helpful warning for developers running locally without env configured
  // (keeps behavior identical otherwise)
  // eslint-disable-next-line no-console
  console.warn('Prisma: no PRISMA_ACCELERATE_URL or DATABASE_URL found in environment. Ensure .env is configured.')
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// If using Prisma Accelerate, pass the accelerateUrl option. Otherwise, provide
// explicit datasources when constructing the client so Prisma has a valid
// configuration at runtime (avoids the 'must be constructed with non-empty options' error).
const prismaOptions: any = accelerateUrl ? { accelerateUrl } : (process.env.DATABASE_URL ? { datasources: { db: { url: process.env.DATABASE_URL } } } : {})

export const prisma = global.prisma ?? new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

