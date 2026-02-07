import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createProgramSurveyTemplateSchema } from '@/schemas/admin/survey.schema'
import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const templates = await prisma.surveyTemplate.findMany({
      where: { type: 'PROGRAM' },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ templates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createProgramSurveyTemplateSchema.parse(body)

    const template = await prisma.surveyTemplate.create({
      data: { type: 'PROGRAM', template: parsed.questions as any, createdBy: me.id },
    })

    await createAudit(me.id, 'CREATE_PROGRAM_SURVEY_TEMPLATE', 'SurveyTemplate', template.id, `Created program survey template`)

    return NextResponse.json({ template })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
