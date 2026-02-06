import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMockPrisma, type MockPrisma } from '../helpers/mock-prisma'
import {
  mockRequest,
  jsonRequest,
  mockContext,
  getJson,
  ADMIN_USER,
  HOD_USER,
  TEACHER_USER,
  MOCK_COURSE,
  MOCK_PROGRAM,
  MOCK_DEPARTMENT,
  MOCK_SEMESTER,
  MOCK_COURSE_OUTCOME,
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

vi.mock('@/lib/db/audit', () => ({
  createAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}))

vi.mock('@/lib/reports', () => ({
  getCourseCoAttainment: vi.fn().mockResolvedValue([{ code: 'CO1', description: 'test', attainment: { level: 2 } }]),
  getProgramPoAttainment: vi.fn().mockResolvedValue([{ code: 'PO1', description: 'test', attainment: null }]),
  getDepartmentSummary: vi.fn().mockResolvedValue({ programs: [{ name: 'CS', outcomes: [{ code: 'PO1', avg: 2.1 }] }] }),
  getSemesterAttainment: vi.fn().mockResolvedValue({ courses: [{ course: { id: 'c1', code: 'CS101', name: 'DS' }, cos: [] }] }),
}))

vi.mock('@/lib/attainment-engine/po-calculator', () => ({
  recalcProgramPO: vi.fn().mockResolvedValue({ results: [], auditId: 'audit-1' }),
  computeCourseLevelPO: vi.fn().mockResolvedValue(2.5),
}))

import { getCurrentUser } from '@/lib/auth/get-current-user'

// ── Routes ──────────────────────────────────────────────────────────
import { GET as courseCoAttainment } from '@/app/api/reports/course/[courseId]/co-attainment/route'
import { GET as programPoAttainment } from '@/app/api/reports/program/[programId]/po-attainment/route'
import { GET as semesterAttainment } from '@/app/api/reports/semester/[semesterId]/attainment/route'
import { GET as deptSummary } from '@/app/api/reports/department/[deptId]/summary/route'
import { GET as excelExport } from '@/app/api/reports/export/excel/route'
import { POST as recalculate } from '@/app/api/attainment/po/recalculate/route'
import { PATCH as cqiStatus } from '@/app/api/cqi/[id]/status/route'
import { GET as deptCqi } from '@/app/api/departments/[deptId]/cqi/route'
import { GET as programAttainment } from '@/app/api/programs/[programId]/attainment/route'
import { POST as rbacRequest } from '@/app/api/rbac/requests/route'
import { GET as deptList } from '@/app/api/departments/route'
import { POST as createUser, GET as listUsers } from '@/app/api/users/route'
import { GET as getUser, PATCH as updateUser, DELETE as deleteUser } from '@/app/api/users/[id]/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

const asAdmin = () => (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
const asHod = () => (getCurrentUser as any).mockResolvedValue(HOD_USER)
const asTeacher = () => (getCurrentUser as any).mockResolvedValue(TEACHER_USER)
const asNone = () => (getCurrentUser as any).mockResolvedValue(null)

// ═══════════════════════════════════════════════════════════════════
// REPORTS - COURSE CO ATTAINMENT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/reports/course/[courseId]/co-attainment', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    const req = mockRequest('http://localhost/api/reports/course/course-1/co-attainment')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseCoAttainment(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.cos).toHaveLength(1)
  })

  it('assigned teacher can view', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    const req = mockRequest('http://localhost/api/reports/course/course-1/co-attainment')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseCoAttainment(req, ctx)
    expect(res.status).toBe(200)
  })

  it('unassigned teacher gets 403', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/reports/course/course-1/co-attainment')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseCoAttainment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing course', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/reports/course/bad/co-attainment')
    const ctx = mockContext({ courseId: 'bad' })
    const res = await courseCoAttainment(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// REPORTS - PROGRAM PO ATTAINMENT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/reports/program/[programId]/po-attainment', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = mockRequest('http://localhost/api/reports/program/prog-1/po-attainment')
    const ctx = mockContext({ programId: 'prog-1' })
    const res = await programPoAttainment(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD of same dept can view', async () => {
    asHod()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = mockRequest('http://localhost/api/reports/program/prog-1/po-attainment')
    const ctx = mockContext({ programId: 'prog-1' })
    const res = await programPoAttainment(req, ctx)
    expect(res.status).toBe(200)
  })

  it('teacher gets 403', async () => {
    asTeacher()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = mockRequest('http://localhost/api/reports/program/prog-1/po-attainment')
    const ctx = mockContext({ programId: 'prog-1' })
    const res = await programPoAttainment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing program', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/reports/program/bad/po-attainment')
    const ctx = mockContext({ programId: 'bad' })
    const res = await programPoAttainment(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// REPORTS - SEMESTER ATTAINMENT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/reports/semester/[semesterId]/attainment', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
    const req = mockRequest('http://localhost/api/reports/semester/sem-1/attainment')
    const ctx = mockContext({ semesterId: 'sem-1' })
    const res = await semesterAttainment(req, ctx)
    expect(res.status).toBe(200)
  })

  it('teacher gets 403', async () => {
    asTeacher()
    mockPrisma.semester.findUnique.mockResolvedValue(MOCK_SEMESTER)
    const req = mockRequest('http://localhost/api/reports/semester/sem-1/attainment')
    const ctx = mockContext({ semesterId: 'sem-1' })
    const res = await semesterAttainment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing semester', async () => {
    asAdmin()
    mockPrisma.semester.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/reports/semester/bad/attainment')
    const ctx = mockContext({ semesterId: 'bad' })
    const res = await semesterAttainment(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// REPORTS - DEPARTMENT SUMMARY
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/reports/department/[deptId]/summary', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.department.findUnique.mockResolvedValue(MOCK_DEPARTMENT)
    const req = mockRequest('http://localhost/api/reports/department/dept-1/summary')
    const ctx = mockContext({ deptId: 'dept-1' })
    const res = await deptSummary(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.department.name).toBe('Computer Science')
  })

  it('HOD from different dept gets 403', async () => {
    asHod()
    mockPrisma.department.findUnique.mockResolvedValue({ ...MOCK_DEPARTMENT, id: 'dept-other' })
    const req = mockRequest('http://localhost/api/reports/department/dept-other/summary')
    const ctx = mockContext({ deptId: 'dept-other' })
    const res = await deptSummary(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/reports/export/excel', () => {
  it('exports course report as xlsx', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    const req = mockRequest('http://localhost/api/reports/export/excel?type=course&courseId=course-1')
    const res = await excelExport(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
  })

  it('returns 400 for missing type', async () => {
    asAdmin()
    const req = mockRequest('http://localhost/api/reports/export/excel')
    const res = await excelExport(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 for teacher', async () => {
    asTeacher()
    const req = mockRequest('http://localhost/api/reports/export/excel?type=course&courseId=c1')
    const res = await excelExport(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 for unknown type', async () => {
    asAdmin()
    const req = mockRequest('http://localhost/api/reports/export/excel?type=badtype')
    const res = await excelExport(req)
    expect(res.status).toBe(400)
  })

  it('exports program report', async () => {
    asAdmin()
    const req = mockRequest('http://localhost/api/reports/export/excel?type=program&programId=prog-1')
    const res = await excelExport(req)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════════
// PO RECALCULATE
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/attainment/po/recalculate', () => {
  it('admin can trigger recalculation', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = jsonRequest('http://localhost/api/attainment/po/recalculate', {
      programId: 'prog-1', semesterId: 'sem-1',
    })
    const res = await recalculate(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.auditId).toBeDefined()
  })

  it('returns 400 for missing programId/semesterId', async () => {
    asAdmin()
    const req = jsonRequest('http://localhost/api/attainment/po/recalculate', {})
    const res = await recalculate(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent program', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/attainment/po/recalculate', {
      programId: 'bad', semesterId: 'sem-1',
    })
    const res = await recalculate(req)
    expect(res.status).toBe(404)
  })

  it('teacher gets 403', async () => {
    asTeacher()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = jsonRequest('http://localhost/api/attainment/po/recalculate', {
      programId: 'prog-1', semesterId: 'sem-1',
    })
    const res = await recalculate(req)
    expect(res.status).toBe(403)
  })

  it('HOD of same dept can recalculate', async () => {
    asHod()
    mockPrisma.program.findUnique.mockResolvedValue(MOCK_PROGRAM)
    const req = jsonRequest('http://localhost/api/attainment/po/recalculate', {
      programId: 'prog-1', semesterId: 'sem-1',
    })
    const res = await recalculate(req)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════════
// CQI STATUS
// ═══════════════════════════════════════════════════════════════════
describe('PATCH /api/cqi/[id]/status', () => {
  const CQI_ACTION = {
    id: 'cqi-1',
    courseOutcome: { course: MOCK_COURSE },
  }

  it('admin can review CQI action', async () => {
    asAdmin()
    mockPrisma.cQIAction.findUnique.mockResolvedValue(CQI_ACTION)
    mockPrisma.cQIAction.update.mockResolvedValue({ ...CQI_ACTION, status: 'ACCEPTED' })
    const req = jsonRequest('http://localhost/api/cqi/cqi-1/status', { status: 'ACCEPTED' }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'cqi-1' })
    const res = await cqiStatus(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD of same dept can review', async () => {
    asHod()
    mockPrisma.cQIAction.findUnique.mockResolvedValue(CQI_ACTION)
    mockPrisma.cQIAction.update.mockResolvedValue({ ...CQI_ACTION, status: 'REVIEWED' })
    const req = jsonRequest('http://localhost/api/cqi/cqi-1/status', { status: 'REVIEWED' }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'cqi-1' })
    const res = await cqiStatus(req, ctx)
    expect(res.status).toBe(200)
  })

  it('teacher gets 403', async () => {
    asTeacher()
    mockPrisma.cQIAction.findUnique.mockResolvedValue(CQI_ACTION)
    const req = jsonRequest('http://localhost/api/cqi/cqi-1/status', { status: 'ACCEPTED' }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'cqi-1' })
    const res = await cqiStatus(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing action', async () => {
    asAdmin()
    mockPrisma.cQIAction.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/cqi/bad/status', { status: 'ACCEPTED' }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'bad' })
    const res = await cqiStatus(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// DEPARTMENT CQI LIST
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/departments/[deptId]/cqi', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.cQIAction.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/departments/dept-1/cqi')
    const ctx = mockContext({ deptId: 'dept-1' })
    const res = await deptCqi(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD of same dept can view', async () => {
    asHod()
    mockPrisma.cQIAction.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/departments/dept-1/cqi')
    const ctx = mockContext({ deptId: 'dept-1' })
    const res = await deptCqi(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD of diff dept gets 403', async () => {
    asHod()
    const req = mockRequest('http://localhost/api/departments/other/cqi')
    const ctx = mockContext({ deptId: 'other' })
    const res = await deptCqi(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// PROGRAM ATTAINMENT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/programs/[programId]/attainment', () => {
  it('admin can view', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue({
      ...MOCK_PROGRAM,
      outcomes: [MOCK_PROGRAM_OUTCOME],
      department: MOCK_DEPARTMENT,
    })
    mockPrisma.pOAttainment.findUnique.mockResolvedValue(null)
    mockPrisma.coPoMapping.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/programs/prog-1/attainment')
    const ctx = mockContext({ programId: 'prog-1' })
    const res = await programAttainment(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.outcomes).toHaveLength(1)
  })

  it('returns 404 for missing program', async () => {
    asAdmin()
    mockPrisma.program.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/programs/bad/attainment')
    const ctx = mockContext({ programId: 'bad' })
    const res = await programAttainment(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// RBAC REQUESTS
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/rbac/requests', () => {
  it('authenticated user can submit role request', async () => {
    asTeacher()
    const req = jsonRequest('http://localhost/api/rbac/requests', { requestedRole: 'HOD', reason: 'I am department head' })
    const res = await rbacRequest(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.ok).toBe(true)
  })

  it('returns 401 for unauthenticated', async () => {
    asNone()
    const req = jsonRequest('http://localhost/api/rbac/requests', { requestedRole: 'HOD' })
    const res = await rbacRequest(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing requestedRole', async () => {
    asTeacher()
    const req = jsonRequest('http://localhost/api/rbac/requests', {})
    const res = await rbacRequest(req)
    expect(res.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════════════════
// DEPARTMENTS (public list)
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/departments', () => {
  it('admin can list', async () => {
    asAdmin()
    mockPrisma.department.findMany.mockResolvedValue([MOCK_DEPARTMENT])
    const req = mockRequest('http://localhost/api/departments')
    const res = await deptList(req)
    expect(res.status).toBe(200)
  })

  it('teacher gets 403', async () => {
    asTeacher()
    const req = mockRequest('http://localhost/api/departments')
    const res = await deptList(req)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// USERS CRUD
// ═══════════════════════════════════════════════════════════════════
describe('Users API', () => {
  describe('POST /api/users', () => {
    it('admin creates user', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', name: 'New', email: 'new@x.com', role: 'TEACHER', departmentId: 'dept-1' })
      const req = jsonRequest('http://localhost/api/users', {
        name: 'New', email: 'new@x.com', password: 'pass123', role: 'TEACHER', departmentId: 'dept-1',
      })
      const res = await createUser(req)
      expect(res.status).toBe(200)
    })

    it('returns 403 for non-admin', async () => {
      asTeacher()
      const req = jsonRequest('http://localhost/api/users', {
        name: 'X', email: 'x@x.com', password: 'pass123', role: 'TEACHER',
      })
      const res = await createUser(req)
      expect(res.status).toBe(403)
    })

    it('returns 400 for duplicate email', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
      const req = jsonRequest('http://localhost/api/users', {
        name: 'X', email: 'teacher@test.com', password: 'pass123', role: 'TEACHER',
      })
      const res = await createUser(req)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/users', () => {
    it('admin lists all users', async () => {
      asAdmin()
      mockPrisma.user.findMany.mockResolvedValue([TEACHER_USER])
      const req = mockRequest('http://localhost/api/users')
      const res = await listUsers(req)
      expect(res.status).toBe(200)
    })

    it('HOD lists only dept users', async () => {
      asHod()
      mockPrisma.user.findMany.mockResolvedValue([TEACHER_USER])
      const req = mockRequest('http://localhost/api/users')
      const res = await listUsers(req)
      expect(res.status).toBe(200)
    })

    it('teacher gets 403', async () => {
      asTeacher()
      const req = mockRequest('http://localhost/api/users')
      const res = await listUsers(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/users/[id]', () => {
    it('admin can view any user', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', name: 'T', email: 't@x.com', role: 'TEACHER', departmentId: 'dept-1', isActive: true })
      const req = mockRequest('http://localhost/api/users/teacher-1')
      const ctx = mockContext({ id: 'teacher-1' })
      const res = await getUser(req, ctx)
      expect(res.status).toBe(200)
    })

    it('returns 404 for missing user', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      const req = mockRequest('http://localhost/api/users/bad')
      const ctx = mockContext({ id: 'bad' })
      const res = await getUser(req, ctx)
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/users/[id]', () => {
    it('admin updates user name', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
      mockPrisma.user.update.mockResolvedValue({ ...TEACHER_USER, name: 'Updated' })
      const req = jsonRequest('http://localhost/api/users/teacher-1', { name: 'Updated' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'teacher-1' })
      const res = await updateUser(req, ctx)
      expect(res.status).toBe(200)
    })

    it('non-admin, non-self gets 403', async () => {
      asTeacher()
      mockPrisma.user.findUnique.mockResolvedValue({ ...TEACHER_USER, id: 'other' })
      const req = jsonRequest('http://localhost/api/users/other', { name: 'X' }, { method: 'PATCH' })
      const ctx = mockContext({ id: 'other' })
      const res = await updateUser(req, ctx)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/users/[id]', () => {
    it('admin can deactivate user', async () => {
      asAdmin()
      mockPrisma.user.findUnique.mockResolvedValue(TEACHER_USER)
      mockPrisma.user.update.mockResolvedValue({ ...TEACHER_USER, isActive: false })
      const req = mockRequest('http://localhost/api/users/teacher-1', { method: 'DELETE' })
      const ctx = mockContext({ id: 'teacher-1' })
      const res = await deleteUser(req, ctx)
      expect(res.status).toBe(200)
    })

    it('non-admin gets 403', async () => {
      asTeacher()
      const req = mockRequest('http://localhost/api/users/teacher-1', { method: 'DELETE' })
      const ctx = mockContext({ id: 'teacher-1' })
      const res = await deleteUser(req, ctx)
      expect(res.status).toBe(403)
    })
  })
})
