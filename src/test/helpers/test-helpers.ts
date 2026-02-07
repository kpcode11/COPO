/**
 * Shared helpers for API route tests.
 *
 * - `mockRequest` builds a `Request` object suitable for Next.js route handlers
 * - `mockFormDataRequest` builds a multipart form-data request
 * - `mockContext` builds a Next.js 16-style context with async params
 * - User fixtures for ADMIN / HOD / TEACHER
 */
import { vi } from 'vitest'

// ---------- User fixtures ----------

export const ADMIN_USER = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN',
  departmentId: null,
  password: '$2a$10$hashedpassword',
  isActive: true,
  createdAt: new Date(),
  deletedAt: null,
}

export const HOD_USER = {
  id: 'hod-1',
  name: 'HOD User',
  email: 'hod@test.com',
  role: 'HOD',
  departmentId: 'dept-1',
  password: '$2a$10$hashedpassword',
  isActive: true,
  createdAt: new Date(),
  deletedAt: null,
}

export const TEACHER_USER = {
  id: 'teacher-1',
  name: 'Teacher User',
  email: 'teacher@test.com',
  role: 'TEACHER',
  departmentId: 'dept-1',
  password: '$2a$10$hashedpassword',
  isActive: true,
  createdAt: new Date(),
  deletedAt: null,
}

// ---------- Entity fixtures ----------

export const MOCK_DEPARTMENT = { id: 'dept-1', name: 'Computer Science', isFirstYear: false }
export const MOCK_DEPARTMENT_2 = { id: 'dept-2', name: 'Mechanical', isFirstYear: false }

export const MOCK_SEMESTER = { id: 'sem-1', number: 1, academicYearId: 'ay-1', isLocked: false }
export const MOCK_LOCKED_SEMESTER = { id: 'sem-locked', number: 2, academicYearId: 'ay-1', isLocked: true }

export const MOCK_PROGRAM = { id: 'prog-1', name: 'B.Tech CS', departmentId: 'dept-1' }

export const MOCK_COURSE = {
  id: 'course-1',
  code: 'CS101',
  name: 'Data Structures',
  semesterId: 'sem-1',
  departmentId: 'dept-1',
  programId: 'prog-1',
}

export const MOCK_COURSE_WITH_SEMESTER = {
  ...MOCK_COURSE,
  semester: MOCK_SEMESTER,
}

export const MOCK_COURSE_LOCKED = {
  ...MOCK_COURSE,
  semester: MOCK_LOCKED_SEMESTER,
}

export const MOCK_COURSE_OUTCOME = {
  id: 'co-1',
  code: 'CO1',
  description: 'Understand data structures',
  bloomLevel: 'L2',
  courseId: 'course-1',
}

export const MOCK_PROGRAM_OUTCOME = {
  id: 'po-1',
  code: 'PO1',
  description: 'Program Outcome PO1',
  programId: 'prog-1',
}

export const MOCK_ASSESSMENT = {
  id: 'assess-1',
  type: 'CIE1',
  date: new Date(),
  totalMarks: 50,
  courseId: 'course-1',
}

export const MOCK_ASSESSMENT_WITH_COURSE = {
  ...MOCK_ASSESSMENT,
  course: MOCK_COURSE_WITH_SEMESTER,
}

export const MOCK_QUESTION = {
  id: 'q-1',
  questionCode: 'Q1',
  maxMarks: 10,
  assessmentId: 'assess-1',
  courseOutcomeId: 'co-1',
}

export const MOCK_ASSIGNMENT = { id: 'ct-1', courseId: 'course-1', teacherId: 'teacher-1' }

export const MOCK_MAPPING = {
  id: 'map-1',
  courseId: 'course-1',
  courseOutcomeId: 'co-1',
  programOutcomeId: 'po-1',
  value: 3,
}

// ---------- Request helpers ----------

export function mockRequest(
  url = 'http://localhost:3000/api/test',
  options: RequestInit & { cookie?: string } = {}
): Request {
  const { cookie, ...init } = options
  const headers: Record<string, string> = {}
  if (cookie) headers['cookie'] = cookie
  if (init.headers) Object.assign(headers, init.headers)

  return new Request(url, {
    ...init,
    headers,
  })
}

export function jsonRequest(
  url: string,
  body: any,
  options: { method?: string; cookie?: string } = {}
): Request {
  return mockRequest(url, {
    method: options.method ?? 'POST',
    cookie: options.cookie,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function mockContext<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) } as { params: Promise<T> }
}

export async function getJson(res: Response) {
  return res.json()
}
