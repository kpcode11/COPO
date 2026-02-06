import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMockPrisma, type MockPrisma } from '../helpers/mock-prisma'
import { getJson } from '../helpers/test-helpers'

let mockPrisma: MockPrisma

vi.mock('@/lib/db/prisma', () => ({
  get prisma() { return mockPrisma },
}))

import { GET as health } from '@/app/api/health/route'
import { GET as seedStatus } from '@/app/api/seed/status/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

// ═══════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/health', () => {
  it('returns ok when DB is reachable', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }])
    const res = await health()
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.status).toBe('ok')
    expect(json.uptime).toBeGreaterThan(0)
    expect(json.timestamp).toBeDefined()
  })

  it('returns 500 when DB is unreachable', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'))
    const res = await health()
    expect(res.status).toBe(500)
    const json = await getJson(res)
    expect(json.status).toBe('error')
  })
})

// ═══════════════════════════════════════════════════════════════════
// SEED STATUS
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/seed/status', () => {
  it('returns seeded=true when data exists', async () => {
    mockPrisma.user.count.mockResolvedValue(5)
    mockPrisma.program.count.mockResolvedValue(2)
    mockPrisma.course.count.mockResolvedValue(10)
    const res = await seedStatus()
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.seeded).toBe(true)
    expect(json.userCount).toBe(5)
  })

  it('returns seeded=false when no data', async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.program.count.mockResolvedValue(0)
    mockPrisma.course.count.mockResolvedValue(0)
    const res = await seedStatus()
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.seeded).toBe(false)
  })
})
