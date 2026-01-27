import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createCourseSurveyTemplateSchema } from '@/schemas/admin/survey.schema'
import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createCourseSurveyTemplateSchema.parse(body)

    // Save global course template
    const template = await prisma.surveyTemplate.create({ data: { type: 'COURSE', template: parsed.questions as any, createdBy: me.id } })

    await createAudit(me.id, 'CREATE_COURSE_SURVEY_TEMPLATE', 'SurveyTemplate', template.id, `Created course survey template`)

    return NextResponse.json({ template })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}