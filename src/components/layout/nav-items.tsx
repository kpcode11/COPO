import {
  LayoutDashboard,
  Users,
  Settings,
  BookOpen,
  GraduationCap,
  Calendar,
  Building2,
  FileText,
  Shield,
  Activity,
  ClipboardList,
  BarChart3,
  Target,
  ScrollText,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const adminNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'System Health', href: '/dashboard/admin/system-health', icon: Activity },
      { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ScrollText },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Academic Years', href: '/dashboard/admin/academic-years', icon: Calendar },
      { label: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
      { label: 'Programs', href: '/dashboard/admin/programs', icon: GraduationCap },
      { label: 'Semesters', href: '/dashboard/admin/semesters', icon: ClipboardList },
      { label: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/dashboard/admin/users', icon: Users },
      { label: 'Roles & Access', href: '/dashboard/admin/rbac', icon: Shield },
      { label: 'Teachers', href: '/dashboard/admin/teachers', icon: GraduationCap },
      { label: 'Surveys', href: '/dashboard/admin/surveys', icon: ClipboardList },
    ],
  },
  {
    title: 'Reports & Config',
    items: [
      { label: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
      { label: 'Attainment', href: '/dashboard/admin/attainment', icon: Target },
      { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    ],
  },
]

export const hodNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/hod', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Department',
    items: [
      { label: 'Courses', href: '/dashboard/hod/courses', icon: BookOpen },
      { label: 'Teachers', href: '/dashboard/hod/teachers', icon: Users },
      { label: 'Attainment', href: '/dashboard/hod/attainment', icon: Target },
    ],
  },
  {
    title: 'Review',
    items: [
      { label: 'CQI Review', href: '/dashboard/hod/cqi-review', icon: CheckSquare },
      { label: 'Reports', href: '/dashboard/hod/reports', icon: BarChart3 },
    ],
  },
]

export const teacherNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/teacher', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Teaching',
    items: [
      { label: 'My Courses', href: '/dashboard/teacher/courses', icon: BookOpen },
    ],
  },
]

export const getNavForRole = (role: string): NavSection[] => {
  switch (role) {
    case 'ADMIN':
      return adminNavSections
    case 'HOD':
      return hodNavSections
    case 'TEACHER':
      return teacherNavSections
    default:
      return []
  }
}
