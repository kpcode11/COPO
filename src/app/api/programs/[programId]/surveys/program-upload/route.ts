import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { parseCsvFile } from '@/lib/file-handlers/csv-parser'
import { parseExcelFile } from '@/lib/file-handlers/excel-parser'
import { validateProgramSurveyCsv } from '@/lib/validators/survey-validator'
import { createAudit } from '@/lib/db/audit'

const LIKERT_MAP: Record<string, number> = { STRONGLY_AGREE: 3, AGREE: 2, NEUTRAL: 1, DISAGREE: 0 }

export async function POST(req: Request, { params }: { params: { programId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId } = params
    const program = await prisma.program.findUnique({ where: { id: programId }, include: { outcomes: true } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    // Only Admin or HOD of the program department
    if (me.role !== 'ADMIN') {
      if (!(me.role === 'HOD' && me.departmentId === program.departmentId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as any // File type can be a Blob or platform-specific; cast to any for server-side handling
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })

    let parsed
    if ((file.type && file.type === 'text/csv') || (file.name && file.name.endsWith('.csv'))) parsed = await parseCsvFile(file as File)
    else parsed = await parseExcelFile(file as File)

    const { headers, rows } = parsed

    const validation = await validateProgramSurveyCsv(programId, headers, rows)
    if (!validation.valid) return NextResponse.json({ error: 'Validation failed', validation }, { status: 400 })

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

    const upload = await prisma.programSurveyUpload.create({ data: { programId, fileName: file.name, uploadedBy: me.id, recordCount: rows.length } })

    for (const h of headers) {
      const po = program.outcomes.find((p: { code: string }) => p.code === h)
      if (!po) continue
      const responses = counts[h]
      const averageScore = responses === 0 ? 0 : sums[h] / responses
      await prisma.pOSurveyAggregate.upsert({ where: { programOutcomeId: po.id }, update: { responses, averageScore }, create: { programOutcomeId: po.id, responses, averageScore } })
    }

    await createAudit(me.id, 'UPLOAD_PROGRAM_SURVEY', 'ProgramSurveyUpload', upload.id, `Uploaded program survey for program ${programId}`)

    return NextResponse.json({ upload })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}