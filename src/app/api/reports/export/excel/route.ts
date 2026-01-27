import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import * as XLSX from 'xlsx'
import { getCourseCoAttainment, getProgramPoAttainment, getDepartmentSummary, getSemesterAttainment } from '@/lib/reports'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    if (!type) return NextResponse.json({ error: 'type query required' }, { status: 400 })

    // only Admin/HOD allowed for exports
    if (!(isAdmin(me) || isHod(me))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let workbook: XLSX.WorkBook = { Sheets: {}, SheetNames: [] }

    if (type === 'course') {
      const courseId = url.searchParams.get('courseId')
      if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const cos = await getCourseCoAttainment(courseId)
      const sheet = XLSX.utils.json_to_sheet(cos)
      workbook.SheetNames.push('CO_Attainment')
      workbook.Sheets['CO_Attainment'] = sheet
    } else if (type === 'program') {
      const programId = url.searchParams.get('programId')
      if (!programId) return NextResponse.json({ error: 'programId required' }, { status: 400 })
      const po = await getProgramPoAttainment(programId)
      const sheet = XLSX.utils.json_to_sheet(po)
      workbook.SheetNames.push('PO_Attainment')
      workbook.Sheets['PO_Attainment'] = sheet
    } else if (type === 'department') {
      const deptId = url.searchParams.get('deptId')
      if (!deptId) return NextResponse.json({ error: 'deptId required' }, { status: 400 })
      const summary = await getDepartmentSummary(deptId)
      const sheet = XLSX.utils.json_to_sheet(summary.programs.reduce((acc:any, p:any) => acc.concat(p.outcomes), []))
      workbook.SheetNames.push('Department_PO')
      workbook.Sheets['Department_PO'] = sheet
    } else if (type === 'semester') {
      const semesterId = url.searchParams.get('semesterId')
      if (!semesterId) return NextResponse.json({ error: 'semesterId required' }, { status: 400 })
      const data = await getSemesterAttainment(semesterId)
      const sheet = XLSX.utils.json_to_sheet(data.courses.map((c:any) => ({ courseId: c.course.id, courseCode: c.course.code, courseName: c.course.name, coCount: c.cos.length })))
      workbook.SheetNames.push('Semester_Attainment')
      workbook.Sheets['Semester_Attainment'] = sheet
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    return new NextResponse(xlsxBuffer, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="report.xlsx"` } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}