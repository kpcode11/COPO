import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createAudit } from '@/lib/db/audit'

export async function DELETE(req: Request, { params }: { params: { assessmentId: string, uploadId: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me || (me.role !== 'ADMIN' && me.role !== 'HOD')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { assessmentId, uploadId } = params
    const body = await req.json()
    const { reason } = body || {}
    if (!reason) return NextResponse.json({ error: 'Audit reason required' }, { status: 400 })

    const upload = await prisma.marksUpload.findUnique({ where: { id: uploadId }, include: { assessment: true } })
    if (!upload || upload.assessmentId !== assessmentId) return NextResponse.json({ error: 'Upload not found' }, { status: 404 })

    // HOD only allowed within their department
    if (me.role === 'HOD') {
      const course = await prisma.course.findUnique({ where: { id: upload.assessment.courseId } })
      if (!course || course.departmentId !== me.departmentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete student marks linked to this upload
    await prisma.studentMark.deleteMany({ where: { marksUploadId: uploadId } })
    await prisma.marksUpload.delete({ where: { id: uploadId } })

    await createAudit(me.id, 'DELETE_MARKS_UPLOAD', 'MarksUpload', uploadId, `Deleted marks upload: ${reason}`)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
