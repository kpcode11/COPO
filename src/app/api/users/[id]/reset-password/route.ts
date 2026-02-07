import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hashPassword } from '@/lib/auth/password'
import { createAudit } from '@/lib/db/audit'
import crypto from 'crypto'

export async function POST(req: Request, context: any) {
  try {
    const ctx: any = context
    let params = ctx.params
    if (params instanceof Promise) params = await params
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Prevent admins from resetting their own password via this endpoint
    if (userId === me.id) {
      return NextResponse.json({ error: 'Use change password page to update your own password' }, { status: 400 })
    }

    // Generate new random password
    const newPassword = crypto.randomBytes(8).toString('base64').slice(0, 12)
    const hashed = await hashPassword(newPassword)

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    await createAudit(me.id, 'RESET_USER_PASSWORD', 'User', userId, `Reset password for user ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      password: newPassword,
      message: 'Password reset successfully' 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
