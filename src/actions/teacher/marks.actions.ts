'use server'

import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { validateMarksRows } from '@/lib/validators/marks-validator'
import { calcCOAttainment } from '@/lib/attainment-engine/co-calculator'

async function getUser() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const req = new Request('http://localhost', { headers: { cookie: cookieHeader } })
  return getCurrentUser(req)
}

async function verifyCourseOwnership(userId: string, courseId: string) {
  const ct = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: userId } })
  if (!ct) throw new Error('You are not assigned to this course')
  return ct
}

async function checkSemesterLock(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
  if (!course) throw new Error('Course not found')
  if (course.semester.isLocked) throw new Error('Semester is locked. Cannot upload marks.')
  return course
}

export async function validateMarksUpload(
  courseId: string,
  assessmentId: string,
  headers: string[],
  rows: Record<string, string>[]
) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  // Verify assessment belongs to course
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, courseId } })
  if (!assessment) return { error: 'Assessment not found for this course' }

  // Verify questions are defined
  const questions = await prisma.assessmentQuestion.findMany({ where: { assessmentId } })
  if (questions.length === 0) return { error: 'No questions defined for this assessment. Define question mappings first.' }

  const result = await validateMarksRows(assessmentId, headers, rows)
  return result
}

export async function uploadMarks(
  courseId: string,
  assessmentId: string,
  fileName: string,
  headers: string[],
  rows: Record<string, string>[]
) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  const course = await checkSemesterLock(courseId)

  // Verify assessment
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, courseId } })
  if (!assessment) return { error: 'Assessment not found for this course' }

  // Validate first
  const validation = await validateMarksRows(assessmentId, headers, rows)
  if (!validation.valid) {
    return { error: 'Validation failed', errors: validation.errors, summary: validation.summary }
  }

  // Get questions map
  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    select: { id: true, questionCode: true, maxMarks: true },
  })
  const questionMap = new Map(questions.map(q => [q.questionCode, q]))

  // Transaction: delete old marks, insert new ones
  const qHeaders = headers.slice(1) // skip RollNo

  const result = await prisma.$transaction(async (tx) => {
    // Delete old StudentMark records for this assessment's questions
    const questionIds = questions.map(q => q.id)
    await tx.studentMark.deleteMany({ where: { questionId: { in: questionIds } } })

    // Delete old MarksUpload records for this assessment
    await tx.marksUpload.deleteMany({ where: { assessmentId } })

    // Create new upload record
    const upload = await tx.marksUpload.create({
      data: {
        assessmentId,
        fileName,
        uploadedBy: user.id,
        recordCount: rows.length,
      },
    })

    // Insert student marks
    const marksData: { rollNo: string; marks: number; questionId: string; marksUploadId: string }[] = []
    for (const row of rows) {
      const rollNo = row[headers[0]]?.toString().trim() || ''
      if (!rollNo) continue

      for (const qh of qHeaders) {
        const q = questionMap.get(qh)
        if (!q) continue

        const cell = row[qh]
        let marks = 0
        if (cell !== undefined && cell !== null && cell !== '') {
          const val = Number(cell)
          marks = Number.isNaN(val) ? 0 : Math.min(val, q.maxMarks)
        }

        marksData.push({
          rollNo,
          marks,
          questionId: q.id,
          marksUploadId: upload.id,
        })
      }
    }

    await tx.studentMark.createMany({ data: marksData })

    return upload
  })

  await createAudit(user.id, 'UPLOAD', 'StudentMark', result.id, `Uploaded ${rows.length} student marks for assessment ${assessment.type} in course ${courseId}`)

  // Trigger attainment calculation
  try {
    await calcCOAttainment(courseId, course.semesterId)
  } catch {
    // Non-blocking: attainment calculation errors shouldn't fail the upload
  }

  return { success: true, uploadId: result.id, recordCount: rows.length }
}

export async function getMarksUploadInfo(courseId: string, assessmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const upload = await prisma.marksUpload.findFirst({
    where: { assessmentId },
    orderBy: { uploadedAt: 'desc' },
  })

  const studentCount = upload
    ? await prisma.studentMark.groupBy({
        by: ['rollNo'],
        where: { marksUploadId: upload.id },
      }).then(r => r.length)
    : 0

  return { upload, studentCount }
}

export async function getStudentMarks(courseId: string, assessmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    orderBy: { questionCode: 'asc' },
    select: { id: true, questionCode: true, maxMarks: true },
  })

  const upload = await prisma.marksUpload.findFirst({
    where: { assessmentId },
    orderBy: { uploadedAt: 'desc' },
  })

  if (!upload) return { questions, marks: [], upload: null }

  const marks = await prisma.studentMark.findMany({
    where: { marksUploadId: upload.id },
    select: { rollNo: true, questionId: true, marks: true },
  })

  // Group by student
  const byStudent = new Map<string, Record<string, number>>()
  for (const m of marks) {
    if (!byStudent.has(m.rollNo)) byStudent.set(m.rollNo, {})
    const q = questions.find(q => q.id === m.questionId)
    if (q) byStudent.get(m.rollNo)![q.questionCode] = m.marks
  }

  const rows = Array.from(byStudent.entries()).map(([rollNo, questionMarks]) => ({
    rollNo,
    ...questionMarks,
  }))

  return { questions, marks: rows, upload }
}

export async function deleteMarks(courseId: string, assessmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  const questionIds = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    select: { id: true },
  })

  await prisma.$transaction(async (tx) => {
    await tx.studentMark.deleteMany({ where: { questionId: { in: questionIds.map(q => q.id) } } })
    await tx.marksUpload.deleteMany({ where: { assessmentId } })
  })

  await createAudit(user.id, 'DELETE', 'StudentMark', assessmentId, `Deleted all marks for assessment in course ${courseId}`)
  return { success: true }
}
