import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateUserSchema } from '@/schemas/common/user.schema'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, departmentId: true, isActive: true, createdAt: true } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Admin can view all
    if (me.role === 'ADMIN') return NextResponse.json({ user })

    // HOD can view if same department
    if (me.role === 'HOD' && me.departmentId && me.departmentId === user.departmentId) return NextResponse.json({ user })

    // Self
    if (me.id === id) return NextResponse.json({ user })

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function PATCH(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const body = await req.json()
    const parsed = updateUserSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Admin can update any
    if (me.role !== 'ADMIN' && me.id !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // If changing password as self, require currentPassword
    if (parsed.newPassword) {
      if (me.id === id) {
        if (!parsed.currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 })
        const ok = await verifyPassword(parsed.currentPassword, user.password)
        if (!ok) return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 })

        const hashed = await hashPassword(parsed.newPassword)
        await prisma.user.update({ where: { id }, data: { password: hashed } })
        await createAudit(me.id, 'UPDATE_USER_PASSWORD', 'User', id, 'User changed password')
        return NextResponse.json({ ok: true })
      } else {
        // Admin changing another user's password
        const hashed = await hashPassword(parsed.newPassword)
        await prisma.user.update({ where: { id }, data: { password: hashed } })
        await createAudit(me.id, 'ADMIN_UPDATE_USER_PASSWORD', 'User', id, 'Admin changed user password')
        return NextResponse.json({ ok: true })
      }
    }

    const updateData: any = {}
    if (parsed.name) updateData.name = parsed.name
    if (parsed.email) updateData.email = parsed.email
    if (parsed.departmentId && me.role === 'ADMIN') updateData.departmentId = parsed.departmentId
    if (parsed.role && me.role === 'ADMIN') {
      updateData.role = parsed.role
      await createAudit(me.id, 'UPDATE_USER_ROLE', 'User', id, `Changed role to ${parsed.role}`)
    }

    await prisma.user.update({ where: { id }, data: updateData })
    await createAudit(me.id, 'UPDATE_USER', 'User', id, 'User profile updated')

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.user.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } })
    await createAudit(me.id, 'DELETE_USER', 'User', id, 'User deactivated')

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
