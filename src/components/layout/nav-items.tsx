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
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'System Health', href: '/admin/system-health', icon: Activity },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Academic Years', href: '/admin/academic-years', icon: Calendar },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
      { label: 'Programs', href: '/admin/programs', icon: GraduationCap },
      { label: 'Semesters', href: '/admin/semesters', icon: ClipboardList },
      { label: 'Courses', href: '/admin/courses', icon: BookOpen },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Roles & Access', href: '/admin/rbac', icon: Shield },
      { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
      { label: 'Surveys', href: '/admin/surveys', icon: ClipboardList },
    ],
  },
  {
    title: 'Reports & Config',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'Attainment', href: '/admin/attainment', icon: Target },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

export const hodNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/hod', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Department',
    items: [
      { label: 'Courses', href: '/hod/courses', icon: BookOpen },
      { label: 'Teachers', href: '/hod/teachers', icon: Users },
      { label: 'Attainment', href: '/hod/attainment', icon: Target },
    ],
  },
  {
    title: 'Review',
    items: [
      { label: 'CQI Review', href: '/hod/cqi-review', icon: CheckSquare },
      { label: 'Reports', href: '/hod/reports', icon: BarChart3 },
    ],
  },
]

export const teacherNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Teaching',
    items: [
      { label: 'My Courses', href: '/teacher/courses', icon: BookOpen },
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
