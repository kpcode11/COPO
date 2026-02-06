import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createMappingSchema } from '@/schemas/teacher/mapping.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can create mappings' }, { status: 403 })

    const body = await req.json()
    const parsed = createMappingSchema.parse(body)

    // Ensure mapping doesn't already exist (courseOutcomeId + programOutcomeId unique)
    const existing = await prisma.coPoMapping.findFirst({ where: { courseOutcomeId: parsed.courseOutcomeId, programOutcomeId: parsed.programOutcomeId } })
    if (existing) return NextResponse.json({ error: 'Mapping already exists. Use PATCH to update.' }, { status: 409 })

    const mapping = await prisma.coPoMapping.create({ data: { courseId, courseOutcomeId: parsed.courseOutcomeId, programOutcomeId: parsed.programOutcomeId, value: parsed.value } })

    const audit = await createAudit(me.id, 'CREATE_CO_PO_MAPPING', 'CoPoMapping', mapping.id, `Created mapping CO:${parsed.courseOutcomeId} -> PO:${parsed.programOutcomeId} value:${parsed.value}`)

    return NextResponse.json({ mapping, auditId: audit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const { courseId } = params
    const mappings = await prisma.coPoMapping.findMany({ where: { courseId }, include: { courseOutcome: true, programOutcome: true } })
    return NextResponse.json({ mappings })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}