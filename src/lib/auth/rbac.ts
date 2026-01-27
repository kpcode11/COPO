type UserLike = { role?: string; departmentId?: string }

export const isAdmin = (user?: UserLike | null) => user?.role === 'ADMIN'
export const isHod = (user?: UserLike | null) => user?.role === 'HOD'
export const isTeacher = (user?: UserLike | null) => user?.role === 'TEACHER'

export const assertAdmin = (user?: UserLike | null) => {
  if (!isAdmin(user)) throw new Error('Forbidden: Admins only')
}

