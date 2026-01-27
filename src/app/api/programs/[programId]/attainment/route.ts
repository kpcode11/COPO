import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { computeCourseLevelPO } from '@/lib/attainment-engine/po-calculator'

export async function GET(req: Request, { params }: { params: { programId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { programId } = params
    const program = await prisma.program.findUnique({ where: { id: programId }, include: { outcomes: true, department: true } })
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

    // HODs can only access their department programs
    if (!(isAdmin(me) || (isHod(me) && me.departmentId === program.departmentId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result: Array<any> = []
    for (const po of program.outcomes) {
      const poAttainment = await prisma.pOAttainment.findUnique({ where: { programOutcomeId: po.id } })

      // Get contributing course-level PO breakdown
      const mappings = await prisma.coPoMapping.findMany({ where: { programOutcomeId: po.id }, include: { course: true } })
      const byCourse = new Map<string, { courseId: string; code: string; name: string; po?: number }>()
      for (const m of mappings) {
        // compute course-level PO (best effort) — ignoring semester filter here
        try {
          const value = await computeCourseLevelPO(po.id, m.courseId)
          byCourse.set(m.courseId, { courseId: m.courseId, code: m.course.code, name: m.course.name, po: value ?? undefined })
        } catch (e) {
          byCourse.set(m.courseId, { courseId: m.courseId, code: m.course.code, name: m.course.name, po: undefined })
        }
      }

      result.push({ programOutcome: po, attainment: poAttainment ?? null, courses: Array.from(byCourse.values()) })
    }

    return NextResponse.json({ program: { id: program.id, name: program.name }, outcomes: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}