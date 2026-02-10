'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Alert from '@/components/ui/alert'
import Card from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import ConfirmModal from '@/components/modals/confirm-modal'
import { GraduationCap, Plus, RefreshCw, Search, Copy, CheckCircle, BookOpen, X } from 'lucide-react'

interface TeacherRecord {
  id: string
  name: string
  email: string
  departmentId?: string | null
  isActive: boolean
}

interface Department {
  id: string
  name: string
}

interface Course {
  id: string
  code: string
  name: string
  departmentId: string
  programId: string
  semester: {
    id: string
    number: number
    academicYear?: {
      name: string
    }
  }
}

interface AssignedCourse extends Course {
  assignmentId?: string
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentId: '' })
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherRecord | null>(null)
  const [editForm, setEditForm] = useState({ departmentId: '' })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<TeacherRecord | null>(null)

  // Assign courses modal
  const [assignCoursesOpen, setAssignCoursesOpen] = useState(false)
  const [assigningTeacher, setAssigningTeacher] = useState<TeacherRecord | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [assigningCourse, setAssigningCourse] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teachersRes, deptsRes] = await Promise.all([
        fetch('/api/admin/teachers'),
        fetch('/api/departments'),
      ])
      const teachersData = await teachersRes.json()
      const deptsData = await deptsRes.json()
      if (teachersRes.ok) setTeachers(teachersData.teachers || [])
      else setError(teachersData.error || 'Failed to load teachers')
      if (deptsRes.ok) setDepartments(deptsData.departments || [])
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const createTeacher = async () => {
    setCreating(true)
    setError(null)
    setGeneratedPassword(null)
    setPasswordCopied(false)
    try {
      // Only include password in payload if it has a value
      const payload: any = {
        name: form.name,
        email: form.email,
        departmentId: form.departmentId,
      }
      if (form.password) {
        payload.password = form.password
      }
      
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Create failed')
        setCreating(false)
        return
      }
      
      // Teacher created successfully - show generated password
      setGeneratedPassword(data.password)
      setForm({ name: '', email: '', password: '', departmentId: '' })
      setSuccess(`Teacher "${data.user?.name}" created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const closeCreateModal = () => {
    setCreateOpen(false)
    setGeneratedPassword(null)
    setPasswordCopied(false)
    setForm({ name: '', email: '', password: '', departmentId: '' })
  }

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const openEdit = (teacher: TeacherRecord) => {
    setEditing(teacher)
    setEditForm({ departmentId: teacher.departmentId || '' })
    setEditOpen(true)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'TEACHER', ...editForm }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Update failed')
        return
      }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`Teacher "${editing.name}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (teacher: TeacherRecord) => {
    setToDelete(teacher)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/users/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Delete failed')
        setConfirmOpen(false)
        return
      }
      setConfirmOpen(false)
      setSuccess(`Teacher "${toDelete.name}" has been deactivated`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = !deptFilter || t.departmentId === deptFilter
    return matchesSearch && matchesDept
  })

  const getDeptName = (deptId?: string | null) => {
    if (!deptId) return '—'
    return departments.find((d) => d.id === deptId)?.name || '—'
  }

  const openAssignCourses = async (teacher: TeacherRecord) => {
    setAssigningTeacher(teacher)
    setAssignCoursesOpen(true)
    setSuccess(null)
    setError(null)
    setCourseSearch('')
    setLoadingCourses(true)
    
    try {
      const [coursesRes, teacherCoursesRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/admin/teachers/' + teacher.id + '/courses'),
      ])
      
      const coursesData = await coursesRes.json()
      const teacherCoursesData = await teacherCoursesRes.json()
      
      if (coursesRes.ok) setCourses(coursesData.courses || [])
      if (teacherCoursesRes.ok) setAssignedCourses(teacherCoursesData.courses || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const assignCourse = async (courseId: string) => {
    if (!assigningTeacher) return
    setAssigningCourse(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/assign-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: assigningTeacher.id }),
      })
      
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to assign course')
        return
      }
      
      // Refresh assigned courses
      const teacherCoursesRes = await fetch('/api/admin/teachers/' + assigningTeacher.id + '/courses')
      const teacherCoursesData = await teacherCoursesRes.json()
      if (teacherCoursesRes.ok) setAssignedCourses(teacherCoursesData.courses || [])
      
      setSuccess('Course assigned successfully')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setAssigningCourse(false)
    }
  }

  const unassignCourse = async (courseId: string) => {
    if (!assigningTeacher) return
    setAssigningCourse(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/assign-teacher`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: assigningTeacher.id }),
      })
      
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to unassign course')
        return
      }
      
      // Refresh assigned courses
      const teacherCoursesRes = await fetch('/api/admin/teachers/' + assigningTeacher.id + '/courses')
      const teacherCoursesData = await teacherCoursesRes.json()
      if (teacherCoursesRes.ok) setAssignedCourses(teacherCoursesData.courses || [])
      
      setSuccess('Course unassigned successfully')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setAssigningCourse(false)
    }
  }

  const closeAssignCoursesModal = () => {
    setAssignCoursesOpen(false)
    setAssigningTeacher(null)
    setCourses([])
    setAssignedCourses([])
    setCourseSearch('')
  }

  const isAssigned = (courseId: string) => {
    return assignedCourses.some((c) => c.id === courseId)
  }

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      !courseSearch ||
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(courseSearch.toLowerCase())
    return matchesSearch
  })

  if (loading) return <PageLoader label="Loading teachers…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Teacher Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage teacher accounts and department assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Teacher
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div className="text-sm text-gray-500">
          {filteredTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeachers.length === 0 ? (
              <TableEmpty columns={5} message="No teachers match your filters" />
            ) : (
              filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{teacher.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{getDeptName(teacher.departmentId)}</TableCell>
                  <TableCell>
                    <Badge variant={teacher.isActive ? 'success' : 'default'}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openAssignCourses(teacher)}>
                        <BookOpen className="h-3 w-3 mr-1" />
                        Courses
                      </Button>
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(teacher)}>
                        Edit
                      </Button>
                      {teacher.isActive && (
                        <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(teacher)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Teacher Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title="Add New Teacher"
        description="Create a teacher account with optional password generation."
        footer={
          generatedPassword ? (
            <Button variant="primary" onClick={closeCreateModal}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeCreateModal}>Cancel</Button>
              <Button variant="primary" onClick={createTeacher} disabled={creating}>
                {creating ? 'Creating…' : 'Create Teacher'}
              </Button>
            </>
          )
        }
      >
        {generatedPassword ? (
          <div className="space-y-3">
            <Alert type="success">Teacher account created successfully!</Alert>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Generated Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white rounded border text-sm font-mono select-all">
                  {generatedPassword}
                </code>
                <Button
                  variant={passwordCopied ? 'primary' : 'outline'}
                  onClick={copyPassword}
                  className="text-xs px-3 py-2"
                >
                  {passwordCopied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Make sure to copy this password and share it securely with the teacher. It won't be shown again.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Input 
              label="Full Name" 
              value={form.name} 
              onChange={(v) => setForm((s) => ({ ...s, name: v }))} 
              required 
              placeholder="e.g. Dr. Rajesh Kumar" 
            />
            <Input 
              label="Email" 
              type="email" 
              value={form.email} 
              onChange={(v) => setForm((s) => ({ ...s, email: v }))} 
              required 
              placeholder="e.g. rajesh@example.com" 
            />
            <div className="space-y-1">
              <Input 
                label="Password (optional)" 
                type="password"
                value={form.password} 
                onChange={(v) => setForm((s) => ({ ...s, password: v }))} 
                placeholder="Leave empty to auto-generate" 
              />
              <p className="text-xs text-gray-500 -mt-0.5">If left empty, a random password will be generated and displayed after creation.</p>
            </div>
            <Select
              label="Department"
              value={form.departmentId}
              onChange={(v) => setForm((s) => ({ ...s, departmentId: v }))}
              placeholder="Select department…"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>
        )}
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit Teacher"
        description={editing ? `Update department assignment for ${editing.name}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditOpen(false); setEditing(null) }}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                {editing.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{editing.name}</div>
                <div className="text-xs text-gray-500">{editing.email}</div>
              </div>
            </div>
            <Select
              label="Department"
              value={editForm.departmentId}
              onChange={(v) => setEditForm((s) => ({ ...s, departmentId: v }))}
              placeholder="Select department…"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Deactivate Teacher"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to deactivate <strong>{toDelete?.name}</strong>? They will not be able to log in until reactivated by an administrator.
      </ConfirmModal>

      {/* Assign Courses Modal */}
      <Modal
        open={assignCoursesOpen}
        onClose={closeAssignCoursesModal}
        title="Assign Courses"
        description={assigningTeacher ? `Manage course assignments for ${assigningTeacher.name}` : ''}
        size="xl"
        footer={
          <Button variant="primary" onClick={closeAssignCoursesModal}>Done</Button>
        }
      >
        {assigningTeacher && (
          <div className="space-y-4">
            {/* Teacher Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                {assigningTeacher.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{assigningTeacher.name}</div>
                <div className="text-xs text-gray-500">{assigningTeacher.email}</div>
              </div>
            </div>

            {/* Assigned Courses */}
            {assignedCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Assigned Courses ({assignedCourses.length})</h3>
                <div className="space-y-1.5">
                  {assignedCourses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{course.code} - {course.name}</div>
                        <div className="text-xs text-gray-500">
                          Semester {course.semester.number}{course.semester.academicYear ? ` • ${course.semester.academicYear.name}` : ''}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                        onClick={() => unassignCourse(course.id)}
                        disabled={assigningCourse}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Available Courses</h3>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              
              {loadingCourses ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading courses...</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {filteredCourses.filter((c) => !isAssigned(c.id)).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{course.code} - {course.name}</div>
                        <div className="text-xs text-gray-500">
                          Semester {course.semester.number}{course.semester.academicYear ? ` • ${course.semester.academicYear.name}` : ''}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="text-xs px-2.5 py-1"
                        onClick={() => assignCourse(course.id)}
                        disabled={assigningCourse}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                  {filteredCourses.filter((c) => !isAssigned(c.id)).length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {courseSearch ? 'No matching courses found' : 'All courses have been assigned'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
