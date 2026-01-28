import { PrismaClient } from '@prisma/client'

/**
 * PrismaClient constructor now supports passing an `adapter` for a direct DB connection
 * or `accelerateUrl` for Prisma Accelerate. For compatibility and to avoid strict
 * runtime type errors, we build a minimal options object and cast to `any`.
 *
 * Connection URLs for `prisma migrate` are stored in `prisma.config.ts` (see project root).
 */

const clientOpts: any = {}

// If an accelerated url is provided, prefer accelerateUrl (hosted Prisma)
if (process.env.PRISMA_ACCELERATE_URL) {
  clientOpts.accelerateUrl = process.env.PRISMA_ACCELERATE_URL
} else if (process.env.DATABASE_URL) {
  // For direct DB connections, provide a minimal adapter object.
  // The adapter implementation may be provider-specific; here we pass a trivial
  // adapter config that Prisma will understand at runtime. Keep this as `any` to
  // avoid type drift until a strongly-typed adapter is available.
  clientOpts.adapter = { url: process.env.DATABASE_URL }
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient(clientOpts as any)

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

