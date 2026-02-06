// Navigation routes configuration

export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
] as const

export const AUTH_ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  logout: '/api/auth/logout',
  session: '/api/auth/session',
} as const

export const DASHBOARD_ROUTES = {
  admin: '/dashboard/admin',
  hod: '/dashboard/hod',
  teacher: '/dashboard/teacher',
} as const

export const ADMIN_ROUTES = {
  dashboard: '/dashboard/admin',
  users: '/dashboard/admin/users',
  rbac: '/dashboard/admin/rbac',
  academicYears: '/dashboard/admin/academic-years',
  departments: '/dashboard/admin/departments',
  programs: '/dashboard/admin/programs',
  semesters: '/dashboard/admin/semesters',
  courses: '/dashboard/admin/courses',
  teachers: '/dashboard/admin/teachers',
  surveys: '/dashboard/admin/surveys',
  reports: '/dashboard/admin/reports',
  attainment: '/dashboard/admin/attainment',
  settings: '/dashboard/admin/settings',
  auditLogs: '/dashboard/admin/audit-logs',
  systemHealth: '/dashboard/admin/system-health',
} as const

export const HOD_ROUTES = {
  dashboard: '/dashboard/hod',
  courses: '/dashboard/hod/courses',
  teachers: '/dashboard/hod/teachers',
  attainment: '/dashboard/hod/attainment',
  cqiReview: '/dashboard/hod/cqi-review',
  reports: '/dashboard/hod/reports',
} as const

export const TEACHER_ROUTES = {
  dashboard: '/dashboard/teacher',
  courses: '/dashboard/teacher/courses',
} as const

// Get the appropriate dashboard route based on role
export function getDashboardForRole(role: string): string {
  switch (role) {
    case 'ADMIN': return DASHBOARD_ROUTES.admin
    case 'HOD': return DASHBOARD_ROUTES.hod
    case 'TEACHER': return DASHBOARD_ROUTES.teacher
    default: return '/login'
  }
}
