import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMockPrisma, type MockPrisma } from '../helpers/mock-prisma'
import {
  jsonRequest,
  mockRequest,
  mockContext,
  getJson,
  ADMIN_USER,
  HOD_USER,
  TEACHER_USER,
  MOCK_DEPARTMENT,
  MOCK_PROGRAM,
  MOCK_COURSE,
  MOCK_SEMESTER,
  MOCK_LOCKED_SEMESTER,
  MOCK_PROGRAM_OUTCOME,
  MOCK_ASSIGNMENT,
} from '../helpers/test-helpers'

// ── Mocks ───────────────────────────────────────────────────────────
let mockPrisma: MockPrisma

vi.mock('@/lib/db/prisma', () => ({
  get prisma() { return mockPrisma },
}))

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-pw'),
}))

vi.mock('@/lib/db/audit', () => ({
  createAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}))

import { getCurrentUser } from '@/lib/auth/get-current-user'

// ── Routes ──────────────────────────────────────────────────────────
import { POST as createDept, GET as listDepts } from '@/app/api/admin/departments/route'
import { PATCH as updateDept } from '@/app/api/admin/departments/[id]/route'
import { POST as createProgram, GET as listPrograms } from '@/app/api/admin/programs/route'
import { PATCH as updateProgram } from '@/app/api/admin/programs/[id]/route'
import { GET as listProgramOutcomes } from '@/app/api/admin/programs/[id]/outcomes/route'
import { POST as createCourse, GET as listCourses } from '@/app/api/admin/courses/route'
import { POST as assignTeacher } from '@/app/api/admin/courses/[courseId]/assign-teacher/route'
import { POST as createTeacher, GET as listTeachers } from '@/app/api/admin/teachers/route'
import { GET as getConfig, PATCH as updateConfig } from '@/app/api/admin/config/route'
import { GET as configHistory } from '@/app/api/admin/config/history/route'
import { GET as listAuditLogs, POST as createAuditLog } from '@/app/api/admin/audit-logs/route'
import { POST as lockSemester } from '@/app/api/admin/semesters/[id]/lock/route'
import { POST as unlockSemester } from '@/app/api/admin/semesters/[id]/unlock/route'
import { POST as createSurveyTemplate } from '@/app/api/admin/surveys/course/template/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

const asAdmin = () => (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
const asHod = () => (getCurrentUser as any).mockResolvedValue(HOD_USER)
const asTeacher = () => (getCurrentUser as any).mockResolvedValue(TEACHER_USER)
const asNone = () => (getCurrentUser as any).mockResolvedValue(null)

// ═══════════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════
describe('Admin Departments', () => {
  describe('POST /api/admin/departments', () => {
    it('creates department as admin', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(null)
      mockPrisma.department.create.mockResolvedValue({ id: 'd1', name: 'CS', isFirstYear: false })
      const req = jsonRequest('http://localhost/api/admin/departments', { name: 'CS' })
      const res = await createDept(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.department.name).toBe('CS')
    })

    it('returns 400 for duplicate department name', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
      const req = jsonRequest('http://localhost/api/admin/departments', { name: 'Computer Science' })
      const res = await createDept(req)
      expect(res.status).toBe(400)
    })

    it('returns 403 for non-admin', async () => {
      asTeacher()
      const req = jsonRequest('http://localhost/api/admin/departments', { name: 'CS' })
      const res = await createDept(req)
      expect(res.status).toBe(403)
    })

    it('returns 403 for unauthenticated', async () => {
      asNone()
      const req = jsonRequest('http://localhost/api/admin/departments', { name: 'CS' })
      const res = await createDept(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/admin/departments', () => {
    it('returns departments as admin', async () => {
      asAdmin()
      mockPrisma.department.findMany.mockResolvedValue([MOCK_DEPARTMENT])
      const req = mockRequest('http://localhost/api/admin/departments')
      const res = await listDepts(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.departments).toHaveLength(1)
    })

    it('returns 403 for teacher', async () => {
      asTeacher()
      const req = mockRequest('http://localhost/api/admin/departments')
      const res = await listDepts(req)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /api/admin/departments/[id]', () => {
    it('updates department as admin', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
      mockPrisma.department.update.mockResolvedValue({ ...MOCK_DEPARTMENT, name: 'New Name' })
      const req = jsonRequest('http://localhost/api/admin/departments/dept-1', { name: 'New Name' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'dept-1' })
      const res = await updateDept(req, ctx)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.department.name).toBe('New Name')
    })

    it('returns 404 when department not found', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/departments/bad', { name: 'X' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'bad' })
      const res = await updateDept(req, ctx)
      expect(res.status).toBe(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// PROGRAMS
// ═══════════════════════════════════════════════════════════════════
describe('Admin Programs', () => {
  describe('POST /api/admin/programs', () => {
    it('creates program with default PO templates', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
      mockPrisma.program.create.mockResolvedValue({ id: 'p1', name: 'CS', departmentId: 'dept-1' })
      mockPrisma.programOutcome.create.mockResolvedValue({ id: 'po-1' })
      const req = jsonRequest('http://localhost/api/admin/programs', { name: 'CS', departmentId: 'dept-1' })
      const res = await createProgram(req)
      expect(res.status).toBe(200)
      expect(mockPrisma.programOutcome.create).toHaveBeenCalledTimes(12)
    })

    it('returns 400 for non-existent department', async () => {
      asAdmin()
      mockPrisma.department.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/programs', { name: 'CS', departmentId: 'bad' })
      const res = await createProgram(req)
      expect(res.status).toBe(400)
    })

    it('returns 403 for non-admin', async () => {
      asTeacher()
      const req = jsonRequest('http://localhost/api/admin/programs', { name: 'CS', departmentId: 'dept-1' })
      const res = await createProgram(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/admin/programs', () => {
    it('returns programs', async () => {
      asAdmin()
      mockPrisma.program.findMany.mockResolvedValue([MOCK_PROGRAM])
      const req = mockRequest('http://localhost/api/admin/programs')
      const res = await listPrograms(req)
      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/admin/programs/[id]', () => {
    it('updates program as admin', async () => {
      asAdmin()
      mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
      mockPrisma.program.update.mockResolvedValue({ ...MOCK_PROGRAM, name: 'Updated' })
      const req = jsonRequest('http://localhost/api/admin/programs/prog-1', { name: 'Updated' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'prog-1' })
      const res = await updateProgram(req, ctx)
      expect(res.status).toBe(200)
    })

    it('returns 404 for missing program', async () => {
      asAdmin()
      mockPrisma.program.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/programs/bad', { name: 'X' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'bad' })
      const res = await updateProgram(req, ctx)
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/admin/programs/[id]/outcomes', () => {
    it('returns outcomes as admin', async () => {
      asAdmin()
      mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
      mockPrisma.programOutcome.findMany.mockResolvedValue([MOCK_PROGRAM_OUTCOME])
      const req = mockRequest('http://localhost/api/admin/programs/prog-1/outcomes')
      const ctx = mockContext({ id: 'prog-1' })
      const res = await listProgramOutcomes(req, ctx)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.outcomes).toHaveLength(1)
    })

    it('returns 404 when program not found', async () => {
      asAdmin()
      mockPrisma.program.findUnique.mockResolvedValue(null)
      const req = mockRequest('http://localhost/api/admin/programs/bad/outcomes')
      const ctx = mockContext({ id: 'bad' })
      const res = await listProgramOutcomes(req, ctx)
      expect(res.status).toBe(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// COURSES (admin)
// ═══════════════════════════════════════════════════════════════════
describe('Admin Courses', () => {
  describe('POST /api/admin/courses', () => {
    it('creates course as admin', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
      mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
      mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
      mockPrisma.course.findFirst.mockResolvedValue(null)
      mockPrisma.course.create.mockResolvedValue(MOCK_COURSE)
      const req = jsonRequest('http://localhost/api/admin/courses', {
        code: 'CS101', name: 'DS', semesterId: 'sem-1', departmentId: 'dept-1', programId: 'prog-1',
      })
      const res = await createCourse(req)
      expect(res.status).toBe(200)
    })

    it('returns 400 for duplicate course code', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
      mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
      mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
      mockPrisma.course.findFirst.mockResolvedValue(MOCK_COURSE)
      const req = jsonRequest('http://localhost/api/admin/courses', {
        code: 'CS101', name: 'DS', semesterId: 'sem-1', departmentId: 'dept-1', programId: 'prog-1',
      })
      const res = await createCourse(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when semester not found', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/courses', {
        code: 'CS101', name: 'DS', semesterId: 'bad', departmentId: 'dept-1', programId: 'prog-1',
      })
      const res = await createCourse(req)
      expect(res.status).toBe(400)
    })

    it('returns 403 for non-admin', async () => {
      asTeacher()
      const req = jsonRequest('http://localhost/api/admin/courses', {
        code: 'CS101', name: 'DS', semesterId: 'sem-1', departmentId: 'dept-1', programId: 'prog-1',
      })
      const res = await createCourse(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/admin/courses', () => {
    it('returns courses for any authenticated user', async () => {
      asTeacher()
      mockPrisma.course.findMany.mockResolvedValue([MOCK_COURSE])
      const req = mockRequest('http://localhost/api/admin/courses')
      const res = await listCourses(req)
      expect(res.status).toBe(200)
    })

    it('returns 401 for unauthenticated', async () => {
      asNone()
      const req = mockRequest('http://localhost/api/admin/courses')
      const res = await listCourses(req)
      expect(res.status).toBe(401)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// ASSIGN TEACHER
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/admin/courses/[courseId]/assign-teacher', () => {
  it('assigns teacher as admin', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    mockPrisma.courseTeacher.create.mockResolvedValue(MOCK_ASSIGNMENT)
    const req = jsonRequest('http://localhost/api/admin/courses/course-1/assign-teacher', { teacherId: 'teacher-1' })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 404 when course not found', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/admin/courses/bad/assign-teacher', { teacherId: 'teacher-1' })
    const ctx = mockContext({ courseId: 'bad' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 400 when teacher already assigned', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    const req = jsonRequest('http://localhost/api/admin/courses/course-1/assign-teacher', { teacherId: 'teacher-1' })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(400)
  })

  it('HOD can assign teachers in own department', async () => {
    asHod()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    mockPrisma.courseTeacher.create.mockResolvedValue(MOCK_ASSIGNMENT)
    const req = jsonRequest('http://localhost/api/admin/courses/course-1/assign-teacher', { teacherId: 'teacher-1' })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD blocked from other department courses', async () => {
    asHod()
    mockPrisma.course.findUnique.mockResolvedValue({ ...MOCK_COURSE, departmentId: 'dept-other' })
    const req = jsonRequest('http://localhost/api/admin/courses/c/assign-teacher', { teacherId: 'teacher-1' })
    const ctx = mockContext({ courseId: 'c' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 403 for teacher role', async () => {
    asTeacher()
    const req = jsonRequest('http://localhost/api/admin/courses/c/assign-teacher', { teacherId: 't' })
    const ctx = mockContext({ courseId: 'c' })
    const res = await assignTeacher(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// TEACHERS
// ═══════════════════════════════════════════════════════════════════
describe('Admin Teachers', () => {
  describe('POST /api/admin/teachers', () => {
    it('creates teacher as admin', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({ id: 't1', name: 'New', email: 'new@t.com', role: 'TEACHER', departmentId: 'dept-1' })
      const req = jsonRequest('http://localhost/api/admin/teachers', { name: 'New', email: 'new@t.com', departmentId: 'dept-1' })
      const res = await createTeacher(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.password).toBeDefined()
    })

    it('returns 400 for duplicate email', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
      const req = jsonRequest('http://localhost/api/admin/teachers', { name: 'X', email: 'teacher@test.com', departmentId: 'dept-1' })
      const res = await createTeacher(req)
      expect(res.status).toBe(400)
    })

    it('HOD blocked from creating in other department', async () => {
      asHod()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/teachers', { name: 'X', email: 'x@t.com', departmentId: 'dept-other' })
      const res = await createTeacher(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/admin/teachers', () => {
    it('admin sees all teachers', async () => {
      asAdmin()
      mockPrisma.user.findMany.mockResolvedValue([TEACHER_USER])
      const req = mockRequest('http://localhost/api/admin/teachers')
      const res = await listTeachers(req)
      expect(res.status).toBe(200)
    })

    it('HOD sees only their department teachers', async () => {
      asHod()
      mockPrisma.user.findMany.mockResolvedValue([TEACHER_USER])
      const req = mockRequest('http://localhost/api/admin/teachers')
      const res = await listTeachers(req)
      expect(res.status).toBe(200)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ departmentId: 'dept-1' }) }),
      )
    })

    it('teacher role gets 403', async () => {
      asTeacher()
      const req = mockRequest('http://localhost/api/admin/teachers')
      const res = await listTeachers(req)
      expect(res.status).toBe(403)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════
describe('Admin Config', () => {
  describe('GET /api/admin/config', () => {
    it('returns config as admin', async () => {
      asAdmin()
      mockPrisma.globalConfig.findFirst.mockResolvedValue({ id: 'cfg-1', coTargetPercent: 60 })
      const req = mockRequest('http://localhost/api/admin/config')
      const res = await getConfig(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.config.coTargetPercent).toBe(60)
    })

    it('returns 401/403 for non-admin', async () => {
      asTeacher()
      const req = mockRequest('http://localhost/api/admin/config')
      const res = await getConfig(req)
      expect([401, 403]).toContain(res.status)
    })
  })

  describe('PATCH /api/admin/config', () => {
    it('updates config and creates history', async () => {
      asAdmin()
      mockPrisma.globalConfig.findFirst.mockResolvedValue({ id: 'cfg-1', coTargetPercent: 60 })
      mockPrisma.globalConfig.update.mockResolvedValue({ id: 'cfg-1', coTargetPercent: 70 })
      mockPrisma.globalConfigHistory.findFirst.mockResolvedValue(null)
      mockPrisma.globalConfigHistory.create.mockResolvedValue({ id: 'hist-1', version: 1 })
      const req = jsonRequest('http://localhost/api/admin/config', { coTargetPercent: 70 }, { method: 'PATCH' })
      const res = await updateConfig(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.config.coTargetPercent).toBe(70)
      expect(json.historyId).toBeDefined()
    })

    it('creates config when none exists', async () => {
      asAdmin()
      mockPrisma.globalConfig.findFirst.mockResolvedValue(null)
      mockPrisma.globalConfig.create.mockResolvedValue({ id: 'cfg-new', coTargetPercent: 50 })
      mockPrisma.globalConfigHistory.findFirst.mockResolvedValue(null)
      mockPrisma.globalConfigHistory.create.mockResolvedValue({ id: 'h-1', version: 1 })
      const req = jsonRequest('http://localhost/api/admin/config', { coTargetPercent: 50 }, { method: 'PATCH' })
      const res = await updateConfig(req)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/admin/config/history', () => {
    it('returns history as admin', async () => {
      asAdmin()
      mockPrisma.globalConfigHistory.findMany.mockResolvedValue([])
      const req = mockRequest('http://localhost/api/admin/config/history')
      const res = await configHistory(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.history).toEqual([])
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════
describe('Admin Audit Logs', () => {
  describe('GET /api/admin/audit-logs', () => {
    it('returns paginated audit logs as admin', async () => {
      asAdmin()
      mockPrisma.auditLog.count.mockResolvedValue(1)
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: 'a1', action: 'LOGIN' }])
      const req = mockRequest('http://localhost/api/admin/audit-logs?action=LOGIN&page=1&perPage=10')
      const res = await listAuditLogs(req)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.total).toBe(1)
      expect(json.logs).toHaveLength(1)
    })

    it('returns 403 for non-admin', async () => {
      asHod()
      const req = mockRequest('http://localhost/api/admin/audit-logs')
      const res = await listAuditLogs(req)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/admin/audit-logs', () => {
    it('creates audit record as admin', async () => {
      asAdmin()
      const req = jsonRequest('http://localhost/api/admin/audit-logs', {
        userId: 'u1', action: 'TEST', entity: 'Test', entityId: 'e1', details: 'test detail',
      })
      const res = await createAuditLog(req)
      expect(res.status).toBe(200)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// SEMESTERS LOCK/UNLOCK
// ═══════════════════════════════════════════════════════════════════
describe('Admin Semesters Lock/Unlock', () => {
  describe('POST /api/admin/semesters/[id]/lock', () => {
    it('locks an unlocked semester', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
      mockPrisma.semester.update.mockResolvedValue({ ...MOCK_SEMESTER, isLocked: true })
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-1/lock', {})
      const ctx = mockContext({ id: 'sem-1' })
      const res = await lockSemester(req, ctx)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.semester.isLocked).toBe(true)
    })

    it('returns 400 when already locked', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_LOCKED_SEMESTER)
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-locked/lock', {})
      const ctx = mockContext({ id: 'sem-locked' })
      const res = await lockSemester(req, ctx)
      expect(res.status).toBe(400)
    })

    it('returns 404 when semester not found', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/admin/semesters/bad/lock', {})
      const ctx = mockContext({ id: 'bad' })
      const res = await lockSemester(req, ctx)
      expect(res.status).toBe(404)
    })

    it('returns 403 for non-admin', async () => {
      asTeacher()
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-1/lock', {})
      const ctx = mockContext({ id: 'sem-1' })
      const res = await lockSemester(req, ctx)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/admin/semesters/[id]/unlock', () => {
    it('unlocks a locked semester with reason', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_LOCKED_SEMESTER)
      mockPrisma.semester.update.mockResolvedValue({ ...MOCK_LOCKED_SEMESTER, isLocked: false })
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-locked/unlock', { reason: 'Data correction needed' })
      const ctx = mockContext({ id: 'sem-locked' })
      const res = await unlockSemester(req, ctx)
      expect(res.status).toBe(200)
    })

    it('returns 400 when not locked', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-1/unlock', { reason: 'test' })
      const ctx = mockContext({ id: 'sem-1' })
      const res = await unlockSemester(req, ctx)
      expect(res.status).toBe(400)
    })

    it('returns 400 when no reason provided', async () => {
      asAdmin()
      mockPrisma.semester.findUnique.mockResolvedValue(MOCK_LOCKED_SEMESTER)
      const req = jsonRequest('http://localhost/api/admin/semesters/sem-locked/unlock', {})
      const ctx = mockContext({ id: 'sem-locked' })
      const res = await unlockSemester(req, ctx)
      expect(res.status).toBe(400)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// SURVEY TEMPLATE
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/admin/surveys/course/template', () => {
  it('creates survey template as admin', async () => {
    asAdmin()
    mockPrisma.surveyTemplate.create.mockResolvedValue({ id: 'st-1', type: 'COURSE' })
    const req = jsonRequest('http://localhost/api/admin/surveys/course/template', {
      questions: [{ code: 'CO1', text: 'How well did you learn CO1?' }],
    })
    const res = await createSurveyTemplate(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.template.type).toBe('COURSE')
  })

  it('returns 403 for non-admin', async () => {
    asTeacher()
    const req = jsonRequest('http://localhost/api/admin/surveys/course/template', {
      questions: [{ code: 'CO1' }],
    })
    const res = await createSurveyTemplate(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid body (empty questions)', async () => {
    asAdmin()
    const req = jsonRequest('http://localhost/api/admin/surveys/course/template', {
      questions: [],
    })
    const res = await createSurveyTemplate(req)
    expect(res.status).toBe(400)
  })
})
