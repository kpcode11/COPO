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
import { BookMarked, Plus, RefreshCw, Pencil, Trash2, Search } from 'lucide-react'

interface AcademicYear { id: string; name: string; isActive: boolean }
interface Semester { id: string; number: number; type: string; academicYear: AcademicYear }
interface Department { id: string; name: string }
interface Program { id: string; name: string; departmentId: string }
interface Course {
  id: string
  code: string
  name: string
  semesterId: string
  departmentId: string
  programId: string
  semester: Semester & { academicYear: AcademicYear }
  department: Department
  program: Program
  createdAt: string
  _count: { teachers: number; outcomes: number }
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Filters
  const [yearFilter, setYearFilter] = useState('')
  const [semFilter, setSemFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [progFilter, setProgFilter] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', semesterId: '', departmentId: '', programId: '' })

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [editForm, setEditForm] = useState({ code: '', name: '', semesterId: '', departmentId: '', programId: '' })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Course | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (yearFilter) params.set('academicYearId', yearFilter)
      if (semFilter) params.set('semesterId', semFilter)
      if (deptFilter) params.set('departmentId', deptFilter)
      if (progFilter) params.set('programId', progFilter)

      const [courseRes, ayRes, semRes, deptRes, progRes] = await Promise.all([
        fetch(`/api/admin/courses?${params.toString()}`),
        fetch('/api/admin/academic-years'),
        fetch('/api/admin/semesters'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/programs'),
      ])
      const courseData = await courseRes.json()
      const ayData = await ayRes.json()
      const semData = await semRes.json()
      const deptData = await deptRes.json()
      const progData = await progRes.json()

      if (courseRes.ok) setCourses(courseData.courses || [])
      else setError(courseData.error || 'Failed to load courses')
      if (ayRes.ok) setAcademicYears(ayData.academicYears || [])
      if (semRes.ok) setSemesters(semData.semesters || [])
      if (deptRes.ok) setDepartments(deptData.departments || [])
      if (progRes.ok) setPrograms(progData.programs || [])
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [yearFilter, semFilter, deptFilter, progFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); setCreating(false); return }
      setCreateOpen(false)
      setForm({ code: '', name: '', semesterId: '', departmentId: '', programId: '' })
      setSuccess(`Course "${data.course?.code} - ${data.course?.name}" created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setEditForm({
      code: course.code,
      name: course.name,
      semesterId: course.semesterId,
      departmentId: course.departmentId,
      programId: course.programId,
    })
    setEditOpen(true)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/courses/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed'); return }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`Course "${editForm.code}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (course: Course) => {
    setToDelete(course)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/courses/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); setConfirmOpen(false); return }
      setConfirmOpen(false)
      setSuccess(`Course "${toDelete.code}" deleted successfully`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const filteredCourses = courses.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  })

  // Filter form semesters by selected academic year in create/edit
  const getFormSemesters = (ayId?: string) => {
    if (!ayId) return semesters
    return semesters.filter((s: any) =>
      s.academicYearId === ayId || s.academicYear?.id === ayId
    )
  }

  // Filter form programs by selected department in create/edit
  const getFormPrograms = (dId?: string) => {
    if (!dId) return programs
    return programs.filter((p) => p.departmentId === dId)
  }

  if (loading) return <PageLoader label="Loading courses…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-blue-600" />
            Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage courses across semesters, departments and programs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Course
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">All years</option>
          {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={progFilter} onChange={(e) => setProgFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="text-sm text-gray-500">
          {filteredCourses.length} course(s)
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Code</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Academic Year</TableHeader>
              <TableHeader>Semester</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Program</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableEmpty columns={7} message="No courses found." />
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <span className="font-mono font-medium text-gray-900">{course.code}</span>
                  </TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>
                    <Badge variant={course.semester.academicYear.isActive ? 'success' : 'default'}>
                      {course.semester.academicYear.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">Sem {course.semester.number}</Badge>
                  </TableCell>
                  <TableCell>{course.department.name}</TableCell>
                  <TableCell>{course.program.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(course)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(course)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Course"
        description="Create a new course under a semester, department, and program."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating || !form.code || !form.name || !form.semesterId || !form.departmentId || !form.programId}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course Code" value={form.code} onChange={(v) => setForm((s) => ({ ...s, code: v }))} required placeholder="e.g. CS301" />
            <Input label="Course Name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} required placeholder="e.g. Data Structures" />
          </div>
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(v) => setForm((s) => ({ ...s, departmentId: v, programId: '' }))}
            placeholder="Select department…"
            required
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select
            label="Program"
            value={form.programId}
            onChange={(v) => setForm((s) => ({ ...s, programId: v }))}
            placeholder="Select program…"
            required
            options={getFormPrograms(form.departmentId).map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select
            label="Semester"
            value={form.semesterId}
            onChange={(v) => setForm((s) => ({ ...s, semesterId: v }))}
            placeholder="Select semester…"
            required
            options={semesters.map((s: any) => ({
              value: s.id,
              label: `Sem ${s.number} (${s.type}) – ${s.academicYear?.name || ''}`,
            }))}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit Course"
        description={editing ? `Editing ${editing.code} - ${editing.name}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditOpen(false); setEditing(null) }}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Course Code" value={editForm.code} onChange={(v) => setEditForm((s) => ({ ...s, code: v }))} required />
              <Input label="Course Name" value={editForm.name} onChange={(v) => setEditForm((s) => ({ ...s, name: v }))} required />
            </div>
            <Select
              label="Department"
              value={editForm.departmentId}
              onChange={(v) => setEditForm((s) => ({ ...s, departmentId: v, programId: '' }))}
              placeholder="Select department…"
              required
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Program"
              value={editForm.programId}
              onChange={(v) => setEditForm((s) => ({ ...s, programId: v }))}
              placeholder="Select program…"
              required
              options={getFormPrograms(editForm.departmentId).map((p) => ({ value: p.id, label: p.name }))}
            />
            <Select
              label="Semester"
              value={editForm.semesterId}
              onChange={(v) => setEditForm((s) => ({ ...s, semesterId: v }))}
              placeholder="Select semester…"
              required
              options={semesters.map((s: any) => ({
                value: s.id,
                label: `Sem ${s.number} (${s.type}) – ${s.academicYear?.name || ''}`,
              }))}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Course"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to delete <strong>{toDelete?.code} - {toDelete?.name}</strong>?
        {toDelete && (toDelete._count.teachers > 0 || toDelete._count.outcomes > 0) && (
          <span className="block mt-1 text-amber-600">
            This course has {toDelete._count.teachers} teacher(s) and {toDelete._count.outcomes} outcome(s). It cannot be deleted until all are removed.
          </span>
        )}
      </ConfirmModal>
    </div>
  )
}
