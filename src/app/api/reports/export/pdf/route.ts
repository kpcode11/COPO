import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isHod } from '@/lib/auth/rbac'
import { getCourseCoAttainment, getProgramPoAttainment } from '@/lib/reports'
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

    // PDF generation requires optional dependency 'pdfkit'. Try dynamic import.
    let PDFDocument: any
    try {
      PDFDocument = (await import('pdfkit')).default
    } catch (e) {
      return NextResponse.json({ error: 'PDF export is not available (pdfkit not installed). Install pdfkit to enable this feature)' }, { status: 501 })
    }

    const doc = new PDFDocument({ autoFirstPage: false })
    const chunks: Uint8Array[] = []
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))

    if (type === 'course') {
      const courseId = url.searchParams.get('courseId')
      if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const cos = await getCourseCoAttainment(courseId)

      doc.addPage()
      doc.fontSize(16).text(`CO Attainment Report - ${course.code} ${course.name}`)
      doc.moveDown()
      cos.forEach((co: any) => {
        doc.fontSize(12).text(`${co.code}: ${co.description}`)
        doc.text(`Attainment: ${co.attainment ? JSON.stringify(co.attainment) : 'N/A'}`)
        doc.moveDown()
      })
    } else if (type === 'program') {
      const programId = url.searchParams.get('programId')
      if (!programId) return NextResponse.json({ error: 'programId required' }, { status: 400 })
      const program = await prisma.program.findUnique({ where: { id: programId } })
      if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      const po = await getProgramPoAttainment(programId)

      doc.addPage()
      doc.fontSize(16).text(`PO Attainment Report - ${program.name}`)
      doc.moveDown()
      po.forEach((p: any) => {
        doc.fontSize(12).text(`${p.code}: ${p.description}`)
        doc.text(`Attainment: ${p.attainment ? JSON.stringify(p.attainment) : 'N/A'}`)
        doc.moveDown()
      })
    } else {
      return NextResponse.json({ error: 'Unsupported type for PDF export' }, { status: 400 })
    }

    doc.end()
    const pdfBuffer = Buffer.concat(chunks)
    return new NextResponse(pdfBuffer, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="report.pdf"` } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}