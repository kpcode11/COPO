import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ user: null }, { status: 200 })
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
