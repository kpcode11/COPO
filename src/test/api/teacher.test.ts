import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildMockPrisma, type MockPrisma } from '../helpers/mock-prisma'
import {
  jsonRequest,
  mockContext,
  getJson,
  ADMIN_USER,
  HOD_USER,
  TEACHER_USER,
  MOCK_COURSE,
  MOCK_COURSE_WITH_SEMESTER,
  MOCK_COURSE_LOCKED,
  MOCK_COURSE_OUTCOME,
  MOCK_ASSESSMENT,
  MOCK_QUESTION,
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
import { POST as createAssessment } from '@/app/api/teacher/courses/[courseId]/assessments/route'
import { POST as createOutcome } from '@/app/api/teacher/courses/[courseId]/outcomes/route'
import { POST as createQuestion } from '@/app/api/teacher/assessments/[assessmentId]/questions/route'
import { PATCH as updateOutcome } from '@/app/api/teacher/outcomes/[outcomeId]/route'
import { PATCH as updateQuestion } from '@/app/api/teacher/questions/[questionId]/route'
import { PATCH as updateMapping } from '@/app/api/co-po-mappings/[id]/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

const asTeacher = () => (getCurrentUser as any).mockResolvedValue(TEACHER_USER)
const asAdmin = () => (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
const asNone = () => (getCurrentUser as any).mockResolvedValue(null)

// ═══════════════════════════════════════════════════════════════════
// CREATE ASSESSMENT
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/teacher/courses/[courseId]/assessments', () => {
  it('creates assessment as assigned teacher', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessment.create.mockResolvedValue({ ...MOCK_ASSESSMENT, id: 'a-new' })
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/assessments', {
      type: 'IA1', date: '2025-01-15', totalMarks: 50,
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createAssessment(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.assessment).toBeDefined()
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_LOCKED)
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/assessments', {
      type: 'IA1', date: '2025-01-15', totalMarks: 50,
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createAssessment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 403 for unassigned teacher', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/assessments', {
      type: 'IA2', date: '2025-02-15', totalMarks: 50,
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createAssessment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 403 for admin (teacher-only)', async () => {
    asAdmin()
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/assessments', {
      type: 'IA1', date: '2025-01-15', totalMarks: 50,
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createAssessment(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent course', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/teacher/courses/bad/assessments', {
      type: 'IA1', date: '2025-01-15', totalMarks: 50,
    })
    const ctx = mockContext({ courseId: 'bad' })
    const res = await createAssessment(req, ctx)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════
// CREATE COURSE OUTCOME
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/teacher/courses/[courseId]/outcomes', () => {
  it('creates outcome as assigned teacher', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.courseOutcome.findFirst.mockResolvedValue(null)
    mockPrisma.courseOutcome.create.mockResolvedValue({ ...MOCK_COURSE_OUTCOME, id: 'co-new' })
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/outcomes', {
      code: 'CO1', description: 'Understand DS', bloomLevel: 'L2',
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createOutcome(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 400 for duplicate CO code', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.courseOutcome.findFirst.mockResolvedValue(MOCK_COURSE_OUTCOME)
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/outcomes', {
      code: 'CO1', description: 'X', bloomLevel: 'L2',
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createOutcome(req, ctx)
    expect(res.status).toBe(400)
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_LOCKED)
    const req = jsonRequest('http://localhost/api/teacher/courses/course-1/outcomes', {
      code: 'CO2', description: 'Y', bloomLevel: 'L3',
    })
    const ctx = mockContext({ courseId: 'course-1' })
    const res = await createOutcome(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// UPDATE COURSE OUTCOME
// ═══════════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/outcomes/[outcomeId]', () => {
  it('updates outcome as assigned teacher', async () => {
    asTeacher()
    mockPrisma.courseOutcome.findUnique.mockResolvedValue(MOCK_COURSE_OUTCOME)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.courseOutcome.update.mockResolvedValue({ ...MOCK_COURSE_OUTCOME, description: 'Updated' })
    const req = jsonRequest('http://localhost/api/teacher/outcomes/co-1', { description: 'Updated' }, { method: 'PATCH' })
    const ctx = mockContext({ outcomeId: 'co-1' })
    const res = await updateOutcome(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 404 for missing CO', async () => {
    asTeacher()
    mockPrisma.courseOutcome.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/teacher/outcomes/bad', { description: 'X' }, { method: 'PATCH' })
    const ctx = mockContext({ outcomeId: 'bad' })
    const res = await updateOutcome(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.courseOutcome.findUnique.mockResolvedValue(MOCK_COURSE_OUTCOME)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_LOCKED)
    const req = jsonRequest('http://localhost/api/teacher/outcomes/co-1', { description: 'X' }, { method: 'PATCH' })
    const ctx = mockContext({ outcomeId: 'co-1' })
    const res = await updateOutcome(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// CREATE QUESTION
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/teacher/assessments/[assessmentId]/questions', () => {
  const MOCK_ASSESSMENT_DEEP = {
    ...MOCK_ASSESSMENT,
    course: MOCK_COURSE_WITH_SEMESTER,
  }

  it('creates question as assigned teacher', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue(MOCK_ASSESSMENT_DEEP)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessmentQuestion.findFirst.mockResolvedValue(null)
    mockPrisma.courseOutcome.findUnique.mockResolvedValue(MOCK_COURSE_OUTCOME)
    mockPrisma.assessmentQuestion.create.mockResolvedValue(MOCK_QUESTION)
    const req = jsonRequest('http://localhost/api/teacher/assessments/assess-1/questions', {
      questionCode: 'Q1', maxMarks: 10, courseOutcomeId: 'co-1',
    })
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await createQuestion(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 400 for duplicate question code', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue(MOCK_ASSESSMENT_DEEP)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessmentQuestion.findFirst.mockResolvedValue(MOCK_QUESTION)
    const req = jsonRequest('http://localhost/api/teacher/assessments/assess-1/questions', {
      questionCode: 'Q1', maxMarks: 10, courseOutcomeId: 'co-1',
    })
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await createQuestion(req, ctx)
    expect(res.status).toBe(400)
  })

  it('returns 400 if CO belongs to different course', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue(MOCK_ASSESSMENT_DEEP)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessmentQuestion.findFirst.mockResolvedValue(null)
    mockPrisma.courseOutcome.findUnique.mockResolvedValue({ ...MOCK_COURSE_OUTCOME, courseId: 'other-course' })
    const req = jsonRequest('http://localhost/api/teacher/assessments/assess-1/questions', {
      questionCode: 'Q2', maxMarks: 15, courseOutcomeId: 'co-other',
    })
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await createQuestion(req, ctx)
    expect(res.status).toBe(400)
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue({
      ...MOCK_ASSESSMENT,
      course: MOCK_COURSE_LOCKED,
    })
    const req = jsonRequest('http://localhost/api/teacher/assessments/assess-1/questions', {
      questionCode: 'Q1', maxMarks: 10, courseOutcomeId: 'co-1',
    })
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await createQuestion(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// UPDATE QUESTION
// ═══════════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/questions/[questionId]', () => {
  const Q_WITH_DEEP = {
    ...MOCK_QUESTION,
    assessment: { ...MOCK_ASSESSMENT, course: MOCK_COURSE_WITH_SEMESTER },
  }

  it('updates question as assigned teacher', async () => {
    asTeacher()
    mockPrisma.assessmentQuestion.findUnique.mockResolvedValue(Q_WITH_DEEP)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessmentQuestion.update.mockResolvedValue({ ...MOCK_QUESTION, maxMarks: 20 })
    const req = jsonRequest('http://localhost/api/teacher/questions/q-1', { maxMarks: 20 }, { method: 'PATCH' })
    const ctx = mockContext({ questionId: 'q-1' })
    const res = await updateQuestion(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 404 for missing question', async () => {
    asTeacher()
    mockPrisma.assessmentQuestion.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/teacher/questions/bad', { maxMarks: 5 }, { method: 'PATCH' })
    const ctx = mockContext({ questionId: 'bad' })
    const res = await updateQuestion(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.assessmentQuestion.findUnique.mockResolvedValue({
      ...MOCK_QUESTION,
      assessment: { ...MOCK_ASSESSMENT, course: MOCK_COURSE_LOCKED },
    })
    const req = jsonRequest('http://localhost/api/teacher/questions/q-1', { maxMarks: 5 }, { method: 'PATCH' })
    const ctx = mockContext({ questionId: 'q-1' })
    const res = await updateQuestion(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// UPDATE CO-PO MAPPING
// ═══════════════════════════════════════════════════════════════════
describe('PATCH /api/co-po-mappings/[id]', () => {
  it('updates mapping as assigned teacher', async () => {
    asTeacher()
    mockPrisma.coPoMapping.findUnique.mockResolvedValue({ ...MOCK_MAPPING, course: MOCK_COURSE })
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.coPoMapping.update.mockResolvedValue({ ...MOCK_MAPPING, value: 2 })
    const req = jsonRequest('http://localhost/api/co-po-mappings/map-1', { value: 2 }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'map-1' })
    const res = await updateMapping(req, ctx)
    expect(res.status).toBe(200)
  })

  it('returns 404 for missing mapping', async () => {
    asTeacher()
    mockPrisma.coPoMapping.findUnique.mockResolvedValue(null)
    const req = jsonRequest('http://localhost/api/co-po-mappings/bad', { value: 1 }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'bad' })
    const res = await updateMapping(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 403 on locked semester', async () => {
    asTeacher()
    mockPrisma.coPoMapping.findUnique.mockResolvedValue({ ...MOCK_MAPPING, course: MOCK_COURSE })
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_LOCKED)
    const req = jsonRequest('http://localhost/api/co-po-mappings/map-1', { value: 1 }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'map-1' })
    const res = await updateMapping(req, ctx)
    expect(res.status).toBe(403)
  })

  it('admin can update without assignment', async () => {
    asAdmin()
    mockPrisma.coPoMapping.findUnique.mockResolvedValue({ ...MOCK_MAPPING, course: MOCK_COURSE })
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE_WITH_SEMESTER)
    mockPrisma.coPoMapping.update.mockResolvedValue({ ...MOCK_MAPPING, value: 1 })
    const req = jsonRequest('http://localhost/api/co-po-mappings/map-1', { value: 1 }, { method: 'PATCH' })
    const ctx = mockContext({ id: 'map-1' })
    const res = await updateMapping(req, ctx)
    expect(res.status).toBe(200)
  })
})
