'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Alert from '@/components/ui/alert'
import Card from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import ConfirmModal from '@/components/modals/confirm-modal'
import { Building2, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'

interface Department {
  id: string
  name: string
  isFirstYear: boolean
  createdAt: string
  _count: { programs: number; courses: number; users: number }
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', isFirstYear: false })

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [editForm, setEditForm] = useState({ name: '', isFirstYear: false })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Department | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/departments')
      const data = await res.json()
      if (res.ok) setDepartments(data.departments || [])
      else setError(data.error || 'Failed to load departments')
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
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); setCreating(false); return }
      setCreateOpen(false)
      setForm({ name: '', isFirstYear: false })
      setSuccess(`Department "${data.department?.name}" created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (dept: Department) => {
    setEditing(dept)
    setEditForm({ name: dept.name, isFirstYear: dept.isFirstYear })
    setEditOpen(true)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/departments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed'); return }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`Department "${editForm.name}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (dept: Department) => {
    setToDelete(dept)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/departments/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); setConfirmOpen(false); return }
      setConfirmOpen(false)
      setSuccess(`Department "${toDelete.name}" deleted successfully`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  if (loading) return <PageLoader label="Loading departments…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Departments
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage academic departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Department
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Programs</TableHeader>
              <TableHeader>Courses</TableHeader>
              <TableHeader>Users</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableEmpty columns={6} message="No departments found. Create one to get started." />
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{dept.name}</span>
                  </TableCell>
                  <TableCell>
                    {dept.isFirstYear ? (
                      <Badge variant="warning" dot>First Year</Badge>
                    ) : (
                      <Badge variant="default">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell>{dept._count.programs}</TableCell>
                  <TableCell>{dept._count.courses}</TableCell>
                  <TableCell>{dept._count.users}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(dept)}>
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
        title="Add Department"
        description="Create a new academic department."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Input
            label="Department Name"
            value={form.name}
            onChange={(v) => setForm((s) => ({ ...s, name: v }))}
            required
            placeholder="e.g. Computer Science"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-fy"
              checked={form.isFirstYear}
              onChange={(e) => setForm((s) => ({ ...s, isFirstYear: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="create-fy" className="text-sm text-gray-700">
              First Year Department
            </label>
          </div>
          {form.isFirstYear && (
            <p className="text-xs text-amber-600 mt-1">
              Only one department can be the First Year department. If another already exists, creation will fail.
            </p>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit Department"
        description={editing ? `Editing ${editing.name}` : ''}
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
              label="Department Name"
              value={editForm.name}
              onChange={(v) => setEditForm((s) => ({ ...s, name: v }))}
              required
              placeholder="e.g. Computer Science"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-fy"
                checked={editForm.isFirstYear}
                onChange={(e) => setEditForm((s) => ({ ...s, isFirstYear: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit-fy" className="text-sm text-gray-700">
                First Year Department
              </label>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Department"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to delete <strong>{toDelete?.name}</strong>?
        {toDelete && (toDelete._count.programs > 0 || toDelete._count.courses > 0 || toDelete._count.users > 0) && (
          <span className="block mt-1 text-amber-600">
            This department has {toDelete._count.programs} program(s), {toDelete._count.courses} course(s), and {toDelete._count.users} user(s). It cannot be deleted until all are removed.
          </span>
        )}
      </ConfirmModal>
    </div>
  )
}
