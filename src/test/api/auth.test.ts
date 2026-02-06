import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMockPrisma, type MockPrisma } from '../helpers/mock-prisma'
import {
  mockRequest,
  jsonRequest,
  getJson,
  ADMIN_USER,
  TEACHER_USER,
} from '../helpers/test-helpers'

// ── Mocks ───────────────────────────────────────────────────────────
let mockPrisma: MockPrisma

vi.mock('@/lib/db/prisma', () => ({
  get prisma() { return mockPrisma },
}))

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('hashed-pw'),
}))

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn().mockResolvedValue({ token: 'tok-123', expiresAt: new Date(Date.now() + 86400000) }),
  deleteSessionByToken: vi.fn(),
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/audit', () => ({
  createAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}))

import { verifyPassword } from '@/lib/auth/password'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { deleteSessionByToken } from '@/lib/auth/session'

// ── Routes ──────────────────────────────────────────────────────────
import { POST as login } from '@/app/api/auth/login/route'
import { POST as register } from '@/app/api/auth/register/route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { GET as session } from '@/app/api/auth/session/route'
import { GET as nextauth } from '@/app/api/auth/[...nextauth]/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

// ═══════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  it('returns 401 for invalid email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/auth/login', { email: 'bad@test.com', password: 'pass123' })
    const res = await login(req)
    expect(res.status).toBe(401)
    const json = await getJson(res)
    expect(json.error).toBe('Invalid credentials')
  })

  it('returns 401 for inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...ADMIN_USER, isActive: false })
    const req = jsonRequest('http://localhost/api/auth/login', { email: 'admin@test.com', password: 'pass123' })
    const res = await login(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(ADMIN_USER);
    (verifyPassword as any).mockResolvedValue(false)
    const req = jsonRequest('http://localhost/api/auth/login', { email: 'admin@test.com', password: 'wrong' })
    const res = await login(req)
    expect(res.status).toBe(400)
  })

  it('returns user + sets session cookie on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(ADMIN_USER);
    (verifyPassword as any).mockResolvedValue(true)
    const req = jsonRequest('http://localhost/api/auth/login', { email: 'admin@test.com', password: 'correct' })
    const res = await login(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.user.email).toBe('admin@test.com')
    expect(json.user.role).toBe('ADMIN')
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toContain('session=')
    expect(cookie).toContain('HttpOnly')
  })

  it('returns 400 for invalid body (missing fields)', async () => {
    const req = jsonRequest('http://localhost/api/auth/login', { email: 'bad' })
    const res = await login(req)
    expect(res.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'u1', name: 'New', email: 'new@test.com', role: 'TEACHER', isActive: false })
    const req = jsonRequest('http://localhost/api/auth/register', { name: 'New', email: 'new@test.com', password: 'pass123' })
    const res = await register(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.user.role).toBe('TEACHER')
    expect(json.message).toContain('pending')
  })

  it('returns 400 if email already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
    const req = jsonRequest('http://localhost/api/auth/register', { name: 'Dup', email: 'teacher@test.com', password: 'pass123' })
    const res = await register(req)
    expect(res.status).toBe(400)
    const json = await getJson(res)
    expect(json.error).toContain('already registered')
  })

  it('returns 400 for invalid body', async () => {
    const req = jsonRequest('http://localhost/api/auth/register', { name: 'A', email: 'bad' })
    const res = await register(req)
    expect(res.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  it('clears session cookie and calls deleteSessionByToken', async () => {
    const req = mockRequest('http://localhost/api/auth/logout', { method: 'POST', cookie: 'session=tok-abc' })
    const res = await logout(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.ok).toBe(true)
    expect(deleteSessionByToken).toHaveBeenCalledWith('tok-abc')
    const cookie = res.headers.get('set-cookie')
    expect(cookie).toContain('Max-Age=0')
  })

  it('succeeds even without session cookie', async () => {
    const req = mockRequest('http://localhost/api/auth/logout', { method: 'POST' })
    const res = await logout(req)
    expect(res.status).toBe(200)
    expect(deleteSessionByToken).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/auth/session', () => {
  it('returns user when authenticated', async () => {
    (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
    const req = mockRequest('http://localhost/api/auth/session', { cookie: 'session=tok' })
    const res = await session(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.user.email).toBe('admin@test.com')
  })

  it('returns null user when unauthenticated', async () => {
    (getCurrentUser as any).mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/auth/session')
    const res = await session(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.user).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════
// NEXTAUTH STUB
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/auth/[...nextauth]', () => {
  it('returns stub message', async () => {
    const res = await nextauth()
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.message).toContain('NextAuth')
  })
})
