import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { parseCsvFile } from '@/lib/file-handlers/csv-parser'
import { parseExcelFile } from '@/lib/file-handlers/excel-parser'
import { validateCourseSurveyCsv } from '@/lib/validators/survey-validator'
import { createAudit } from '@/lib/db/audit'

const LIKERT_MAP: Record<string, number> = { STRONGLY_AGREE: 3, AGREE: 2, NEUTRAL: 1, DISAGREE: 0 }

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { outcomes: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Teacher must be assigned or Admin
    if (me.role !== 'ADMIN') {
      const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
      if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as any // File type can be a Blob or platform-specific; cast to any for server-side handling
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })

    let parsed
    if ((file.type && file.type === 'text/csv') || (file.name && file.name.endsWith('.csv'))) parsed = await parseCsvFile(file as File)
    else parsed = await parseExcelFile(file as File)

    const { headers, rows } = parsed

    // headers are like CO1, CO2, ... (no RollNo here per prompt)
    const validation = await validateCourseSurveyCsv(courseId, headers, rows)
    if (!validation.valid) return NextResponse.json({ error: 'Validation failed', validation }, { status: 400 })

    // Aggregate per CO
    const counts: Record<string, number> = {}
    const sums: Record<string, number> = {}
    headers.forEach(h => { counts[h] = 0; sums[h] = 0 })

    rows.forEach(r => {
      headers.forEach(h => {
        const val = (r[h] || '').toString().trim()
        const score = LIKERT_MAP[val]
        counts[h] += 1
        sums[h] += score
      })
    })

    // Create upload record
    const upload = await prisma.courseSurveyUpload.create({ data: { courseId, fileName: file.name, uploadedBy: me.id, recordCount: rows.length } })

    // Upsert COSurveyAggregate per course outcome
    for (const h of headers) {
      const co = course.outcomes.find((c: { code: string }) => c.code === h)
      if (!co) continue // should not happen after validation
      const responses = counts[h]
      const averageScore = responses === 0 ? 0 : sums[h] / responses
      await prisma.cOSurveyAggregate.upsert({ where: { courseOutcomeId: co.id }, update: { responses, averageScore }, create: { courseOutcomeId: co.id, responses, averageScore } })
    }

    const audit = await createAudit(me.id, 'UPLOAD_COURSE_SURVEY', 'CourseSurveyUpload', upload.id, `Uploaded course survey for course ${courseId}`)

    return NextResponse.json({ upload, auditId: audit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}