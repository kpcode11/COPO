'use server'

import { cookies } from 'next/headers'
import { getSessionByToken } from '@/lib/auth/session'
import type { SessionUser } from '@/types/auth.types'
import type { Role } from '@/types/auth.types'
import { hasMinRole, hasPermission, type Permission } from '@/lib/auth/rbac'

/**
 * Get the current authenticated user from the session cookie.
 * Returns null when there is no valid session.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null

  const session = await getSessionByToken(token)
  if (!session) return null

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    departmentId: session.user.departmentId ?? undefined,
  }
}

/**
 * Assert the caller has at least the given minimum role.
 * Throws if not authenticated or insufficient role.
 */
export async function requireRole(minRole: Role): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  if (!hasMinRole(user, minRole)) throw new Error('Insufficient role')
  return user
}

/**
 * Assert the caller has a specific permission.
 * Throws if not authenticated or lacking the permission.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  if (!hasPermission(user, permission)) throw new Error('Insufficient permissions')
  return user
}
