// Navigation routes configuration

export const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
] as const

export const AUTH_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  logout: '/api/auth/logout',
  session: '/api/auth/session',
} as const

export const DASHBOARD_ROUTES = {
  admin: '/admin',
  hod: '/hod',
  teacher: '/teacher',
} as const

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  users: '/admin/users',
  rbac: '/admin/rbac',
  academicYears: '/admin/academic-years',
  departments: '/admin/departments',
  programs: '/admin/programs',
  semesters: '/admin/semesters',
  courses: '/admin/courses',
  teachers: '/admin/teachers',
  surveys: '/admin/surveys',
  reports: '/admin/reports',
  attainment: '/admin/attainment',
  settings: '/admin/settings',
  auditLogs: '/admin/audit-logs',
  systemHealth: '/admin/system-health',
} as const

export const HOD_ROUTES = {
  dashboard: '/hod',
  courses: '/hod/courses',
  teachers: '/hod/teachers',
  attainment: '/hod/attainment',
  cqiReview: '/hod/cqi-review',
  reports: '/hod/reports',
} as const

export const TEACHER_ROUTES = {
  dashboard: '/teacher',
  courses: '/teacher/courses',
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
