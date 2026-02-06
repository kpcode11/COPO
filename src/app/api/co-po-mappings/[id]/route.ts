import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateMappingSchema } from '@/schemas/teacher/mapping.schema'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const mapping = await prisma.coPoMapping.findUnique({ where: { id }, include: { course: true } })
    if (!mapping) return NextResponse.json({ error: 'Mapping not found' }, { status: 404 })

    // Check permission: assigned teacher for the course or Admin
    const isAssignedTeacher = await prisma.courseTeacher.findFirst({ where: { courseId: mapping.courseId, teacherId: me.id } })
    if (!isAssignedTeacher && me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Prevent writes if semester is locked
    const course = await prisma.course.findUnique({ where: { id: mapping.courseId }, include: { semester: true } })
    if (course && course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    const body = await req.json()
    const parsed = updateMappingSchema.parse(body)

    const updated = await prisma.coPoMapping.update({ where: { id }, data: { value: parsed.value } })

    const audit = await createAudit(me.id, 'UPDATE_CO_PO_MAPPING', 'CoPoMapping', id, `Updated mapping value to ${parsed.value}`)

    return NextResponse.json({ mapping: updated, auditId: audit.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}