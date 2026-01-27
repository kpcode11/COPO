import { prisma } from '@/lib/db/prisma'

export type CoReport = { id: string; code: string; description: string; attainment: any | null }
export type PoReport = { id: string; code: string; description: string; attainment: any | null }

export const getCourseCoAttainment = async (courseId: string): Promise<CoReport[]> => {
  // Fetch COs for course with attainment
  const cos = await prisma.courseOutcome.findMany({ where: { courseId }, include: { attainment: true } })
  return cos.map((co: any) => ({
    id: co.id as string,
    code: co.code as string,
    description: co.description as string,
    attainment: co.attainment ?? null,
  }))
}

export const getProgramPoAttainment = async (programId: string): Promise<PoReport[]> => {
  // Fetch POs for program with POAttainment
  const pos = await prisma.programOutcome.findMany({ where: { programId }, include: { attainment: true } })
  return pos.map((po: any) => ({
    id: po.id as string,
    code: po.code as string,
    description: po.description as string,
    attainment: po.attainment ?? null,
  }))
}

export const getDepartmentSummary = async (deptId: string) => {
  // Summarize per program in department
  const programs = await prisma.program.findMany({ where: { departmentId: deptId }, include: { outcomes: true, courses: true } })
  const summaries: Array<any> = []
  for (const p of programs) {
    const poData = await getProgramPoAttainment(p.id)
    summaries.push({ program: { id: p.id, name: p.name }, outcomes: poData })
  }
  return { departmentId: deptId, programs: summaries }
}

export const getSemesterAttainment = async (semesterId: string) => {
  // For the semester, collect course-level CO and program PO where courses in semester
  const courses = await prisma.course.findMany({ where: { semesterId }, include: { outcomes: true, department: true, program: true } })
  const result: Array<any> = []
  for (const c of courses) {
    const coData = await getCourseCoAttainment(c.id)
    result.push({ course: { id: c.id, code: c.code, name: c.name }, department: c.department, program: c.program, cos: coData })
  }
  return { semesterId, courses: result }
}
