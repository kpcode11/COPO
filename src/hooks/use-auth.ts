'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import useSession from './useSession'
import { getDashboardForRole } from '@/constants/routes'
import type { Role } from '@/types/auth.types'
import { hasMinRole, hasPermission, type Permission } from '@/lib/auth/rbac'

/**
 * Provides authentication state and authorization helpers.
 * Wraps `useSession` and adds role / permission checks.
 */
export default function useAuth() {
  const { user, loading, refresh } = useSession()
  const router = useRouter()

  const isAuthenticated = !!user

  const role = (user?.role ?? null) as Role | null

  const checkRole = useCallback(
    (minRole: Role) => {
      if (!user) return false
      return hasMinRole(user, minRole)
    },
    [user],
  )

  const checkPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false
      return hasPermission(user, permission)
    },
    [user],
  )

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore – cookie will expire
    }
    router.push('/login')
  }, [router])

  const dashboardUrl = role ? getDashboardForRole(role) : '/login'

  return {
    user,
    role,
    loading,
    isAuthenticated,
    checkRole,
    checkPermission,
    signOut,
    dashboardUrl,
    refresh,
  }
}
