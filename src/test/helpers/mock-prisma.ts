/**
 * Deep mock for PrismaClient used by all API route tests.
 * Every model method returns vi.fn() so individual tests can
 * `.mockResolvedValueOnce(...)` as needed.
 */
import { vi } from 'vitest'

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where?.id ?? 'mock-id', ...args.data })),
    upsert: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    delete: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
  }
}

export function buildMockPrisma() {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ now: new Date() }]),
    user: createModelMock(),
    session: createModelMock(),
    department: createModelMock(),
    program: createModelMock(),
    programOutcome: createModelMock(),
    course: createModelMock(),
    courseTeacher: createModelMock(),
    courseOutcome: createModelMock(),
    semester: createModelMock(),
    assessment: createModelMock(),
    assessmentQuestion: createModelMock(),
    marksUpload: createModelMock(),
    studentMark: createModelMock(),
    coPoMapping: createModelMock(),
    cOAttainment: createModelMock(),
    cOSurveyAggregate: createModelMock(),
    pOAttainment: createModelMock(),
    pOSurveyAggregate: createModelMock(),
    cQIAction: createModelMock(),
    courseSurveyUpload: createModelMock(),
    programSurveyUpload: createModelMock(),
    globalConfig: createModelMock(),
    globalConfigHistory: createModelMock(),
    auditLog: createModelMock(),
    surveyTemplate: createModelMock(),
  }
}

export type MockPrisma = ReturnType<typeof buildMockPrisma>
