export type Role = 'ADMIN' | 'HOD' | 'TEACHER'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  departmentId?: string | null
}

export interface Session {
  user: SessionUser | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: SessionUser
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RoleChangeRequest {
  userId: string
  newRole: Role
  reason?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
  departmentId?: string | null
  isActive: boolean
  createdAt: string
  department?: {
    id: string
    name: string
  } | null
}
