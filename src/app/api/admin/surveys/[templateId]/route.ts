import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, context: any) {
  try {
    const ctx: any = context
    let params = ctx.params
    if (params instanceof Promise) params = await params

    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const template = await prisma.surveyTemplate.findUnique({ where: { id: params.templateId } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    return NextResponse.json({ template })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const ctx: any = context
    let params = ctx.params
    if (params instanceof Promise) params = await params

    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const template = await prisma.surveyTemplate.findUnique({ where: { id: params.templateId } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    await prisma.surveyTemplate.delete({ where: { id: params.templateId } })

    await createAudit(me.id, 'DELETE_SURVEY_TEMPLATE', 'SurveyTemplate', params.templateId, `Deleted ${template.type} survey template`)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
