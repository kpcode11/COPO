import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { type Permission, getAllPermissions, getPermissionsForRole } from '@/lib/auth/rbac'
import { getPermissionsForRoleAsync } from '@/lib/auth/rbac-server'
import { createAudit } from '@/lib/db/audit'
import { z } from 'zod'

// Get all role permissions (merged with defaults)
export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build a map of role -> permissions
    const rolePermissions: Record<string, string[]> = {
      ADMIN: [],
      HOD: [],
      TEACHER: [],
    }

    // Get all available permissions
    const allPermissions = getAllPermissions()

    // For each role, build their effective permissions
    for (const role of ['ADMIN', 'HOD', 'TEACHER']) {
      rolePermissions[role] = await getPermissionsForRoleAsync(role)
    }

    return NextResponse.json({
      permissions: rolePermissions,
      allPermissions,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

const updatePermissionsSchema = z.object({
  role: z.enum(['ADMIN', 'HOD', 'TEACHER']),
  permissions: z.array(z.string()),
})

// Update role permissions
export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me || me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { role, permissions } = updatePermissionsSchema.parse(body)

    // Get all available permissions to validate
    const allPermissions = getAllPermissions()
    
    // Validate that all provided permissions are valid
    for (const perm of permissions) {
      if (!allPermissions.includes(perm as Permission)) {
        return NextResponse.json(
          { error: `Invalid permission: ${perm}` },
          { status: 400 }
        )
      }
    }

    // Delete existing custom permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role },
    })

    // Create new permission entries
    const permissionRecords = permissions.map((perm) => ({
      role,
      permission: perm,
      enabled: true,
    }))

    if (permissionRecords.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionRecords,
      })
    }

    await createAudit(
      me.id,
      'UPDATE_ROLE_PERMISSIONS',
      'RolePermission',
      role,
      `Updated permissions for ${role}: ${permissions.length} permissions`
    )

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${role}`,
      permissions,
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
