import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { parseCsvFile } from '@/lib/file-handlers/csv-parser'
import { parseExcelFile } from '@/lib/file-handlers/excel-parser'
import { validateMarksRows } from '@/lib/validators/marks-validator'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, { params }: { params: { assessmentId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { assessmentId } = params
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: { include: { semester: true } } } })
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    if (assessment.course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: assessment.course.id, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can upload marks' }, { status: 403 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })

    let parsed
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      parsed = await parseCsvFile(file)
    } else {
      parsed = await parseExcelFile(file)
    }

    const { headers, rows } = parsed
    const validation = await validateMarksRows(assessmentId, headers, rows)
    if (!validation.valid) return NextResponse.json({ error: 'Validation failed', validation }, { status: 400 })

    // Save MarksUpload
    const upload = await prisma.marksUpload.create({ data: { assessmentId, fileName: file.name, uploadedBy: me.id, recordCount: rows.length } })

    // For each row and each question, save StudentMark with marksUploadId
    const qHeaders = headers.slice(1)

    for (const r of rows) {
      const roll = (r[headers[0]] || '').toString().trim()
      for (const qh of qHeaders) {
        const raw = r[qh]
        const val = raw === undefined || raw === null || raw === '' ? 0 : Number(raw)
        const question = await prisma.assessmentQuestion.findFirst({ where: { assessmentId, questionCode: qh } })
        if (!question) continue // Shouldn't happen after validation
        await prisma.studentMark.create({ data: { rollNo: roll, marks: val, questionId: question.id, marksUploadId: upload.id } })
      }
    }

    const audit = await createAudit(me.id, 'UPLOAD_MARKS', 'MarksUpload', upload.id, `Uploaded marks file ${upload.fileName}`)

    return NextResponse.json({ upload, auditId: audit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}