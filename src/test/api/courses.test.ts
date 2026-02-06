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
  MOCK_COURSE_WITH_SEMESTER,
  MOCK_COURSE_LOCKED,
  MOCK_DEPARTMENT,
  MOCK_SEMESTER,
  MOCK_COURSE_OUTCOME,
  MOCK_PROGRAM_OUTCOME,
  MOCK_ASSESSMENT,
  MOCK_ASSIGNMENT,
  MOCK_MAPPING,
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

import { getCurrentUser } from '@/lib/auth/get-current-user'

// ── Routes ──────────────────────────────────────────────────────────
import { GET as listCourses } from '@/app/api/courses/route'
import { GET as courseAssessments } from '@/app/api/courses/[courseId]/assessments/route'
import { GET as courseOutcomes } from '@/app/api/courses/[courseId]/outcomes/route'
import { POST as createMapping, GET as getMappings } from '@/app/api/courses/[courseId]/co-po-mappings/route'
import { GET as courseSurveys } from '@/app/api/courses/[courseId]/surveys/route'
import { GET as courseTeachers } from '@/app/api/courses/[courseId]/teachers/route'
import { GET as coAttainment } from '@/app/api/courses/[courseId]/outcomes/[coId]/attainment/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

const asAdmin = () => (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
const asHod = () => (getCurrentUser as any).mockResolvedValue(HOD_USER)
const asTeacher = () => (getCurrentUser as any).mockResolvedValue(TEACHER_USER)
const asNone = () => (getCurrentUser as any).mockResolvedValue(null)

// ═══════════════════════════════════════════════════════════════════
// COURSES LIST
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses', () => {
  it('admin sees all courses', async () => {
    asAdmin()
    mockPrisma.course.findMany.mockResolvedValue([MOCK_COURSE])
    const req = mockRequest('http://localhost/api/courses')
    const res = await listCourses(req)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.courses).toHaveLength(1)
  })

  it('teacher sees only assigned courses', async () => {
    asTeacher()
    mockPrisma.courseTeacher.findMany.mockResolvedValue([MOCK_ASSIGNMENT])
    mockPrisma.course.findMany.mockResolvedValue([MOCK_COURSE])
    const req = mockRequest('http://localhost/api/courses')
    const res = await listCourses(req)
    expect(res.status).toBe(200)
  })

  it('HOD sees only dept courses', async () => {
    asHod()
    mockPrisma.course.findMany.mockResolvedValue([MOCK_COURSE])
    const req = mockRequest('http://localhost/api/courses')
    const res = await listCourses(req)
    expect(res.status).toBe(200)
  })

  it('returns 401 for unauthenticated', async () => {
    asNone()
    const req = mockRequest('http://localhost/api/courses')
    const res = await listCourses(req)
    expect(res.status).toBe(401)
  })

  it('supports query params', async () => {
    asAdmin()
    mockPrisma.course.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/courses?semesterId=sem-1&departmentId=dept-1')
    const res = await listCourses(req)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════════
// COURSE ASSESSMENTS
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses/[courseId]/assessments', () => {
  it('admin can view assessments', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.assessment.findMany.mockResolvedValue([MOCK_ASSESSMENT])
    const req = mockRequest('http://localhost/api/courses/course-1/assessments')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseAssessments(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.assessments).toHaveLength(1)
  })

  it('teacher can view if assigned', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessment.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/courses/course-1/assessments')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseAssessments(req, ctx)
    expect(res.status).toBe(200)
  })

  it('teacher forbidden if not assigned', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/course-1/assessments')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseAssessments(req, ctx)
    expect(res.status).toBe(403)
  })

  it('HOD forbidden if different dept', async () => {
    asHod()
    mockPrisma.course.findUnique.mockResolvedValue({ ...MOCK_COURSE, departmentId: 'other' })
    const req = mockRequest('http://localhost/api/courses/course-1/assessments')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseAssessments(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent course', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/bad/assessments')
    const ctx = mockContext({ courseId: 'bad' })
    const res = await courseAssessments(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// COURSE OUTCOMES
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses/[courseId]/outcomes', () => {
  it('admin can view outcomes', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseOutcome.findMany.mockResolvedValue([MOCK_COURSE_OUTCOME])
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseOutcomes(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.outcomes).toHaveLength(1)
  })

  it('HOD can view same dept', async () => {
    asHod()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseOutcome.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseOutcomes(req, ctx)
    expect(res.status).toBe(200)
  })

  it('unassigned teacher forbidden', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseOutcomes(req, ctx)
    expect(res.status).toBe(403)
  })

  it('assigned teacher can view', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.courseOutcome.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseOutcomes(req, ctx)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════════
// CO-PO MAPPINGS
// ═══════════════════════════════════════════════════════════════════
describe('CO-PO Mappings /api/courses/[courseId]/co-po-mappings', () => {
  describe('POST (create mapping)', () => {
    it('teacher creates mapping on unlocked semester', async () => {
      asTeacher()
      mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
      mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
      mockPrisma.coPoMapping.findFirst.mockResolvedValue(null)
      mockPrisma.coPoMapping.create.mockResolvedValue(MOCK_MAPPING)
      const req = jsonRequest('http://localhost/api/courses/course-1/co-po-mappings', {
        courseOutcomeId: 'co-1', programOutcomeId: 'po-1', value: 3,
      })
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await createMapping(req, ctx)
      expect(res.status).toBe(200)
    })

    it('returns 403 on locked semester', async () => {
      asTeacher()
      mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_LOCKED)
      mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
      const req = jsonRequest('http://localhost/api/courses/course-1/co-po-mappings', {
        courseOutcomeId: 'co-1', programOutcomeId: 'po-1', value: 2,
      })
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await createMapping(req, ctx)
      expect(res.status).toBe(403)
    })

    it('returns 409 for duplicate mapping', async () => {
      asTeacher()
      mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
      mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
      mockPrisma.coPoMapping.findFirst.mockResolvedValue(MOCK_MAPPING)
      const req = jsonRequest('http://localhost/api/courses/course-1/co-po-mappings', {
        courseOutcomeId: 'co-1', programOutcomeId: 'po-1', value: 2,
      })
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await createMapping(req, ctx)
      expect(res.status).toBe(409)
    })

    it('non-teacher forbidden', async () => {
      asAdmin()
      const req = jsonRequest('http://localhost/api/courses/course-1/co-po-mappings', {
        courseOutcomeId: 'co-1', programOutcomeId: 'po-1', value: 1,
      })
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await createMapping(req, ctx)
      expect(res.status).toBe(403)
    })

    it('unassigned teacher forbidden', async () => {
      asTeacher()
      mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
      mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
      const req = jsonRequest('http://localhost/api/courses/course-1/co-po-mappings', {
        courseOutcomeId: 'co-1', programOutcomeId: 'po-1', value: 1,
      })
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await createMapping(req, ctx)
      expect(res.status).toBe(403)
    })
  })

  describe('GET (list mappings)', () => {
    it('returns mappings for course', async () => {
      mockPrisma.coPoMapping.findMany.mockResolvedValue([MOCK_MAPPING])
      const req = mockRequest('http://localhost/api/courses/course-1/co-po-mappings')
      const ctx = mockContext({ courseId: 'course-1' })
      const res = await getMappings(req, ctx)
      expect(res.status).toBe(200)
      const json = await getJson(res)
      expect(json.mappings).toHaveLength(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// COURSE SURVEYS
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses/[courseId]/surveys', () => {
  it('admin can view surveys', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue({ ...MOCK_COURSE, outcomes: [], department: MOCK_DEPARTMENT })
    mockPrisma.cOSurveyAggregate.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/courses/course-1/surveys')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseSurveys(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 404 for missing course', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/bad/surveys')
    const ctx = mockContext({ courseId: 'bad' })
    const res = await courseSurveys(req, ctx)
    expect(res.status).toBe(404)
  })

  it('HOD from diff dept gets 403', async () => {
    asHod()
    mockPrisma.course.findUnique.mockResolvedValue({ ...MOCK_COURSE, departmentId: 'other', outcomes: [], department: { id: 'other', name: 'Other' } })
    const req = mockRequest('http://localhost/api/courses/course-1/surveys')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseSurveys(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// COURSE TEACHERS
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses/[courseId]/teachers', () => {
  it('admin can view teachers', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findMany.mockResolvedValue([{ teacher: TEACHER_USER }])
    const req = mockRequest('http://localhost/api/courses/course-1/teachers')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseTeachers(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.teachers).toHaveLength(1)
  })

  it('unassigned teacher gets 403', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/course-1/teachers')
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await courseTeachers(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// CO ATTAINMENT
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/courses/[courseId]/outcomes/[coId]/attainment', () => {
  it('admin sees CO attainment', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseOutcome.findFirst.mockResolvedValue(MOCK_COURSE_OUTCOME)
    mockPrisma.cOAttainment.findUnique.mockResolvedValue({ courseOutcomeId: 'co-1', level: 2 })
    mockPrisma.cOSurveyAggregate.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes/co-1/attainment')
    const ctx = mockContext({ courseId: 'course-1', coId: 'co-1' })
    const res = await coAttainment(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.courseOutcome.id).toBe('co-1')
    expect(json.attainment.level).toBe(2)
  })

  it('returns 404 when CO not found', async () => {
    asAdmin()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.courseOutcome.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/courses/course-1/outcomes/bad/attainment')
    const ctx = mockContext({ courseId: 'course-1', coId: 'bad' })
    const res = await coAttainment(req, ctx)
    expect(res.status).toBe(404)
  })
})
