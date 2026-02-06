// ─── Role hierarchy ────────────────────────────────────────────────────────────
// ADMIN > HOD > TEACHER
const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  HOD: 2,
  TEACHER: 1,
}

type UserLike = {
  id?: string
  role?: string
  departmentId?: string | null
}

// ─── Role checks ───────────────────────────────────────────────────────────────

export const isAdmin = (user?: UserLike | null): boolean =>
  user?.role === 'ADMIN'

export const isHod = (user?: UserLike | null): boolean =>
  user?.role === 'HOD'

export const isTeacher = (user?: UserLike | null): boolean =>
  user?.role === 'TEACHER'

export const hasMinRole = (user: UserLike | null | undefined, minRole: string): boolean => {
  if (!user?.role) return false
  return (ROLE_HIERARCHY[user.role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 99)
}

// ─── Assertion helpers (throw on failure) ───────────────────────────────────────

export const assertAdmin = (user?: UserLike | null) => {
  if (!isAdmin(user)) throw new Error('Forbidden: Admins only')
}

export const assertHod = (user?: UserLike | null) => {
  if (!isHod(user)) throw new Error('Forbidden: HODs only')
}

export const assertTeacher = (user?: UserLike | null) => {
  if (!isTeacher(user)) throw new Error('Forbidden: Teachers only')
}

export const assertMinRole = (user: UserLike | null | undefined, minRole: string) => {
  if (!hasMinRole(user, minRole))
    throw new Error(`Forbidden: requires at least ${minRole} role`)
}

// ─── Permission definitions ─────────────────────────────────────────────────────

export type Permission =
  | 'users.list'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.changeRole'
  | 'users.activate'
  | 'courses.create'
  | 'courses.update'
  | 'courses.delete'
  | 'courses.view'
  | 'assessments.manage'
  | 'marks.upload'
  | 'marks.view'
  | 'attainment.calculate'
  | 'attainment.view'
  | 'reports.view'
  | 'reports.generate'
  | 'departments.manage'
  | 'programs.manage'
  | 'semesters.manage'
  | 'academicYears.manage'
  | 'config.manage'
  | 'audit.view'
  | 'cqi.create'
  | 'cqi.review'
  | 'surveys.manage'
  | 'rbac.manage'

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'users.list', 'users.create', 'users.update', 'users.delete',
    'users.changeRole', 'users.activate',
    'courses.create', 'courses.update', 'courses.delete', 'courses.view',
    'assessments.manage', 'marks.upload', 'marks.view',
    'attainment.calculate', 'attainment.view',
    'reports.view', 'reports.generate',
    'departments.manage', 'programs.manage', 'semesters.manage', 'academicYears.manage',
    'config.manage', 'audit.view',
    'cqi.create', 'cqi.review', 'surveys.manage', 'rbac.manage',
  ],
  HOD: [
    'users.list',
    'courses.view', 'courses.create', 'courses.update',
    'assessments.manage', 'marks.upload', 'marks.view',
    'attainment.calculate', 'attainment.view',
    'reports.view', 'reports.generate',
    'cqi.create', 'cqi.review', 'surveys.manage',
  ],
  TEACHER: [
    'courses.view',
    'assessments.manage', 'marks.upload', 'marks.view',
    'attainment.view', 'reports.view', 'cqi.create',
  ],
}

export const hasPermission = (
  user: UserLike | null | undefined,
  permission: Permission
): boolean => {
  if (!user?.role) return false
  const perms = ROLE_PERMISSIONS[user.role]
  return perms?.includes(permission) ?? false
}

export const assertPermission = (
  user: UserLike | null | undefined,
  permission: Permission
) => {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`)
  }
}

export const getPermissionsForRole = (role: string): Permission[] => {
  return ROLE_PERMISSIONS[role] ?? []
}

export const getAllPermissions = (): Permission[] => {
  return ROLE_PERMISSIONS.ADMIN
}

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrator',
    HOD: 'Head of Department',
    TEACHER: 'Teacher',
  }
  return labels[role] || role
}

// ─── Department-scoped access ───────────────────────────────────────────────────

export const canAccessDepartment = (
  user: UserLike | null | undefined,
  departmentId: string
): boolean => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (isHod(user) && user.departmentId === departmentId) return true
  return false
}

export const canAccessUser = (
  currentUser: UserLike | null | undefined,
  targetUser: UserLike
): boolean => {
  if (!currentUser) return false
  if (isAdmin(currentUser)) return true
  if (currentUser.id === targetUser.id) return true
  if (
    isHod(currentUser) &&
    currentUser.departmentId &&
    currentUser.departmentId === targetUser.departmentId
  ) return true
  return false
}

