// Prisma seed script - Creates initial admin, global config, sample data
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Please configure your .env file.')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Seeding database…')

  // ── Hash helper ───────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  // ── Departments ───────────────────────────────────────────
  const csDept = await prisma.department.upsert({
    where: { name: 'Computer Science' },
    update: {},
    create: { name: 'Computer Science' },
  })

  const ecDept = await prisma.department.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  })

  const fyDept = await prisma.department.upsert({
    where: { name: 'First Year' },
    update: {},
    create: { name: 'First Year', isFirstYear: true },
  })

  // ── Admin user ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@copo.in' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@copo.in',
      password: hash('admin123'),
      role: 'ADMIN',
      isActive: true,
    },
  })

  // ── HOD user ──────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'hod.cs@copo.in' },
    update: {},
    create: {
      name: 'Dr. CS Head',
      email: 'hod.cs@copo.in',
      password: hash('hod123'),
      role: 'HOD',
      departmentId: csDept.id,
      isActive: true,
    },
  })

  // ── Teacher user ──────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'teacher@copo.in' },
    update: {},
    create: {
      name: 'Prof. Teacher',
      email: 'teacher@copo.in',
      password: hash('teacher123'),
      role: 'TEACHER',
      departmentId: csDept.id,
      isActive: true,
    },
  })

  // ── Global Config ─────────────────────────────────────────
  const configCount = await prisma.globalConfig.count()
  if (configCount === 0) {
    await prisma.globalConfig.create({
      data: {
        coTargetPercent: 60,
        coTargetMarksPercent: 60,
        directWeightage: 0.8,
        indirectWeightage: 0.2,
        ia1Weightage: 0.3,
        ia2Weightage: 0.3,
        endSemWeightage: 0.4,
        poTargetLevel: 2,
        level3Threshold: 70,
        level2Threshold: 60,
        level1Threshold: 50,
      },
    })
  }

  console.log('Seed complete.')
  console.log('')
  console.log('Default credentials:')
  console.log('  Admin   → admin@copo.in   / admin123')
  console.log('  HOD     → hod.cs@copo.in  / hod123')
  console.log('  Teacher → teacher@copo.in / teacher123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
