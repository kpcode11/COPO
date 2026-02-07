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
import { GraduationCap, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'

interface Department { id: string; name: string }
interface Program {
  id: string
  name: string
  departmentId: string
  department: Department
  createdAt: string
  _count: { courses: number; outcomes: number }
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deptFilter, setDeptFilter] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', departmentId: '' })

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Program | null>(null)
  const [editForm, setEditForm] = useState({ name: '' })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Program | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [progRes, deptRes] = await Promise.all([
        fetch('/api/admin/programs'),
        fetch('/api/admin/departments'),
      ])
      const progData = await progRes.json()
      const deptData = await deptRes.json()
      if (progRes.ok) setPrograms(progData.programs || [])
      else setError(progData.error || 'Failed to load programs')
      if (deptRes.ok) setDepartments(deptData.departments || [])
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); setCreating(false); return }
      setCreateOpen(false)
      setForm({ name: '', departmentId: '' })
      setSuccess(`Program "${data.program?.name}" created with default PO1–PO12 outcomes`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (prog: Program) => {
    setEditing(prog)
    setEditForm({ name: prog.name })
    setEditOpen(true)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/programs/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed'); return }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`Program "${editForm.name}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (prog: Program) => {
    setToDelete(prog)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/programs/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); setConfirmOpen(false); return }
      setConfirmOpen(false)
      setSuccess(`Program "${toDelete.name}" deleted successfully`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const filtered = programs.filter((p) => !deptFilter || p.departmentId === deptFilter)

  if (loading) return <PageLoader label="Loading programs…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Programs
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage academic programs and their program outcomes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Program
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Filters */}
      <div className="flex items-center gap-3">
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
          {filtered.length} of {programs.length} programs
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Program Outcomes</TableHeader>
              <TableHeader>Courses</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty columns={5} message="No programs found." />
            ) : (
              filtered.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{prog.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{prog.department.name}</Badge>
                  </TableCell>
                  <TableCell>{prog._count.outcomes}</TableCell>
                  <TableCell>{prog._count.courses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(prog)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(prog)}>
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
        title="Add Program"
        description="Create a new program. Default program outcomes (PO1–PO12) will be generated automatically."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating || !form.name || !form.departmentId}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Input
            label="Program Name"
            value={form.name}
            onChange={(v) => setForm((s) => ({ ...s, name: v }))}
            required
            placeholder="e.g. B.Tech Computer Science"
          />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(v) => setForm((s) => ({ ...s, departmentId: v }))}
            placeholder="Select department…"
            required
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit Program"
        description={editing ? `Editing ${editing.name} (${editing.department.name})` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditOpen(false); setEditing(null) }}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-1">
            <Input
              label="Program Name"
              value={editForm.name}
              onChange={(v) => setEditForm((s) => ({ ...s, name: v }))}
              required
              placeholder="e.g. B.Tech Computer Science"
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Program"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to delete <strong>{toDelete?.name}</strong>?
        {toDelete && toDelete._count.courses > 0 && (
          <span className="block mt-1 text-amber-600">
            This program has {toDelete._count.courses} course(s). It cannot be deleted until all courses are removed.
          </span>
        )}
        {toDelete && toDelete._count.outcomes > 0 && (
          <span className="block mt-1 text-xs text-gray-500">
            {toDelete._count.outcomes} program outcome(s) will also be deleted.
          </span>
        )}
      </ConfirmModal>
    </div>
  )
}
