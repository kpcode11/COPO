import { User } from '@prisma/client'

export const isAdmin = (user?: Pick<User, 'role'> | null) => user?.role === 'ADMIN'
export const isHod = (user?: Pick<User, 'role'> | null) => user?.role === 'HOD'
export const isTeacher = (user?: Pick<User, 'role'> | null) => user?.role === 'TEACHER'

export const assertAdmin = (user?: Pick<User, 'role'> | null) => {
  if (!isAdmin(user)) throw new Error('Forbidden: Admins only')
}

