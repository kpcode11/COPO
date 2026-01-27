import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { parseCsvFile } from '@/lib/file-handlers/csv-parser'
import { parseExcelFile } from '@/lib/file-handlers/excel-parser'
import { validateMarksRows } from '@/lib/validators/marks-validator'

export async function POST(req: Request, { params }: { params: { assessmentId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { assessmentId } = params

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: { include: { semester: true } } } })
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    // Prevent uploads if semester locked
    if (assessment.course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Teacher assigned to course?
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

    // Validate headers and rows
    const result = await validateMarksRows(assessmentId, headers, rows)

    return NextResponse.json({ validation: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
