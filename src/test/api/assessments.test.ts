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
  MOCK_ASSESSMENT,
  MOCK_QUESTION,
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

vi.mock('@/lib/file-handlers/csv-parser', () => ({
  parseCsvFile: vi.fn(),
}))

vi.mock('@/lib/file-handlers/excel-parser', () => ({
  parseExcelFile: vi.fn(),
}))

vi.mock('@/lib/validators/marks-validator', () => ({
  validateMarksRows: vi.fn(),
}))

import { getCurrentUser } from '@/lib/auth/get-current-user'

// ── Routes ──────────────────────────────────────────────────────────
import { GET as listQuestions } from '@/app/api/assessments/[assessmentId]/questions/route'
import { GET as listMarksUploads } from '@/app/api/assessments/[assessmentId]/marks/list/route'
import { POST as validateMarks } from '@/app/api/assessments/[assessmentId]/marks/validate/route'
import { DELETE as deleteMarksUpload } from '@/app/api/assessments/[assessmentId]/marks/[uploadId]/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma = buildMockPrisma()
})

const asAdmin = () => (getCurrentUser as any).mockResolvedValue(ADMIN_USER)
const asHod = () => (getCurrentUser as any).mockResolvedValue(HOD_USER)
const asTeacher = () => (getCurrentUser as any).mockResolvedValue(TEACHER_USER)
const asNone = () => (getCurrentUser as any).mockResolvedValue(null)

// ═══════════════════════════════════════════════════════════════════
// LIST QUESTIONS
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/assessments/[assessmentId]/questions', () => {
  const ASSESS_WITH_COURSE = { ...MOCK_ASSESSMENT, course: MOCK_COURSE }

  it('admin can view questions', async () => {
    asAdmin()
    mockPrisma.assessment.findUnique.mockResolvedValue(ASSESS_WITH_COURSE)
    mockPrisma.assessmentQuestion.findMany.mockResolvedValue([MOCK_QUESTION])
    const req = mockRequest('http://localhost/api/assessments/assess-1/questions')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listQuestions(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.questions).toHaveLength(1)
  })

  it('assigned teacher can view', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue(ASSESS_WITH_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.assessmentQuestion.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/assessments/assess-1/questions')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listQuestions(req, ctx)
    expect(res.status).toBe(200)
  })

  it('unassigned teacher gets 403', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue(ASSESS_WITH_COURSE)
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/assessments/assess-1/questions')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listQuestions(req, ctx)
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing assessment', async () => {
    asAdmin()
    mockPrisma.assessment.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/assessments/bad/questions')
    const ctx = mockContext({ assessmentId: 'bad' })
    const res = await listQuestions(req, ctx)
    expect(res.status).toBe(404)
  })

  it('HOD from different dept gets 403', async () => {
    asHod()
    mockPrisma.assessment.findUnique.mockResolvedValue({
      ...MOCK_ASSESSMENT,
      course: { ...MOCK_COURSE, departmentId: 'other' },
    })
    const req = mockRequest('http://localhost/api/assessments/assess-1/questions')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listQuestions(req, ctx)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════════
// MARKS LIST (uploads)
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/assessments/[assessmentId]/marks/list', () => {
  it('admin can list uploads', async () => {
    asAdmin()
    mockPrisma.assessment.findUnique.mockResolvedValue({ ...MOCK_ASSESSMENT, course: MOCK_COURSE })
    mockPrisma.marksUpload.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/assessments/assess-1/marks/list')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listMarksUploads(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.uploads).toEqual([])
  })

  it('returns 404 for bad assessment', async () => {
    asAdmin()
    mockPrisma.assessment.findUnique.mockResolvedValue(null)
    const req = mockRequest('http://localhost/api/assessments/bad/marks/list')
    const ctx = mockContext({ assessmentId: 'bad' })
    const res = await listMarksUploads(req, ctx)
    expect(res.status).toBe(404)
  })

  it('HOD from different dept gets 403', async () => {
    asHod()
    mockPrisma.assessment.findUnique.mockResolvedValue({
      ...MOCK_ASSESSMENT,
      course: { ...MOCK_COURSE, departmentId: 'other' },
    })
    const req = mockRequest('http://localhost/api/assessments/assess-1/marks/list')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listMarksUploads(req, ctx)
    expect(res.status).toBe(403)
  })

  it('teacher can view if assigned', async () => {
    asTeacher()
    mockPrisma.assessment.findUnique.mockResolvedValue({ ...MOCK_ASSESSMENT, course: MOCK_COURSE })
    mockPrisma.courseTeacher.findFirst.mockResolvedValue(MOCK_ASSIGNMENT)
    mockPrisma.marksUpload.findMany.mockResolvedValue([])
    const req = mockRequest('http://localhost/api/assessments/assess-1/marks/list')
    const ctx = mockContext({ assessmentId: 'assess-1' })
    const res = await listMarksUploads(req, ctx)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════════
// DELETE MARKS UPLOAD
// ═══════════════════════════════════════════════════════════════════
describe('DELETE /api/assessments/[assessmentId]/marks/[uploadId]', () => {
  const UPLOAD = { id: 'up-1', assessmentId: 'assess-1', assessment: MOCK_ASSESSMENT }

  it('admin can delete with reason', async () => {
    asAdmin()
    mockPrisma.marksUpload.findUnique.mockResolvedValue(UPLOAD)
    mockPrisma.studentMark.deleteMany.mockResolvedValue({ count: 5 })
    mockPrisma.marksUpload.delete.mockResolvedValue(UPLOAD)
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', { reason: 'Incorrect data' }, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(200)
    const json = await getJson(res)
    expect(json.ok).toBe(true)
  })

  it('returns 400 without reason', async () => {
    asAdmin()
    mockPrisma.marksUpload.findUnique.mockResolvedValue(UPLOAD)
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', {}, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(400)
  })

  it('returns 404 for wrong assessment', async () => {
    asAdmin()
    mockPrisma.marksUpload.findUnique.mockResolvedValue({ ...UPLOAD, assessmentId: 'other' })
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', { reason: 'x' }, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 403 for teacher', async () => {
    asTeacher()
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', { reason: 'x' }, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(403)
  })

  it('HOD can delete in own dept', async () => {
    asHod()
    mockPrisma.marksUpload.findUnique.mockResolvedValue(UPLOAD)
    mockPrisma.course.findUnique.mockResolvedValue(MOCK_COURSE)
    mockPrisma.studentMark.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.marksUpload.delete.mockResolvedValue(UPLOAD)
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', { reason: 'fix' }, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(200)
  })

  it('HOD blocked from other dept', async () => {
    asHod()
    mockPrisma.marksUpload.findUnique.mockResolvedValue(UPLOAD)
    mockPrisma.course.findUnique.mockResolvedValue({ ...MOCK_COURSE, departmentId: 'other' })
    const req = jsonRequest('http://localhost/api/assessments/assess-1/marks/up-1', { reason: 'fix' }, { method: 'DELETE' })
    const ctx = mockContext({ assessmentId: 'assess-1', uploadId: 'up-1' })
    const res = await deleteMarksUpload(req, ctx)
    expect(res.status).toBe(403)
  })
})
