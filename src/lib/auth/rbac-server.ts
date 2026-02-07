// Server-only RBAC functions that interact with the database
// These functions should NEVER be imported in client components

import { type Permission, getPermissionsForRole } from './rbac'
import { prisma } from '@/lib/db/prisma'

/**
 * Get permissions for a role, checking database first, then falling back to defaults
 * SERVER-ONLY - Do not import in client components
 */
export async function getPermissionsForRoleAsync(role: string): Promise<Permission[]> {
  try {
    // Validate role is a valid enum value
    if (!['ADMIN', 'HOD', 'TEACHER'].includes(role)) {
      return getPermissionsForRole(role)
    }

    // Check if there are custom permissions for this role in the database
    const customPerms = await prisma.rolePermission.findMany({
      where: { role: role as 'ADMIN' | 'HOD' | 'TEACHER', enabled: true },
      select: { permission: true },
    })

    // If custom permissions exist, use them
    if (customPerms.length > 0) {
      return customPerms.map((p) => p.permission as Permission)
    }
  } catch (error) {
    // If database query fails, fall back to defaults
    console.error('Failed to fetch role permissions from database:', error)
  }

  // Fall back to default permissions
  return getPermissionsForRole(role)
}

/**
 * Check if a user has a specific permission (asyncversion with database check)
 * SERVER-ONLY - Do not import in client components
 */
export async function hasPermissionAsync(
  user: { role?: string } | null | undefined,
  permission: Permission
): Promise<boolean> {
  if (!user?.role) return false
  const perms = await getPermissionsForRoleAsync(user.role)
  return perms.includes(permission)
}

/**
 * Assert user has permission (async version)
 * SERVER-ONLY - Do not import in client components
 */
export async function assertPermissionAsync(
  user: { role?: string } | null | undefined,
  permission: Permission
): Promise<void> {
  const hasPerm = await hasPermissionAsync(user, permission)
  if (!hasPerm) {
    throw new Error(`Forbidden: missing permission "${permission}"`)
  }
}
