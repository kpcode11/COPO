export type SemesterType = 'ODD' | 'EVEN'

export interface AcademicYear {
  id: string
  name: string
  isActive: boolean
  createdAt?: string
  semesters?: Semester[]
}

export interface Semester {
  id: string
  number: number
  type: SemesterType
  academicYearId: string
  isLocked: boolean
  courses?: Course[]
  academicYear?: AcademicYear
}

export interface Department {
  id: string
  name: string
  isFirstYear: boolean
  courses?: Course[]
  programs?: Program[]
}

export interface Program {
  id: string
  name: string
  departmentId: string
  department?: Department
}

export interface Course {
  id: string
  code: string
  name: string
  semesterId: string
  departmentId: string
  programId: string
  semester?: Semester
  department?: Department
  program?: Program
}
