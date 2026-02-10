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
import { CalendarDays, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'

import type { AcademicYear as AcademicYearType } from '@/types/academic.types'

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYearType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', isActive: false })

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicYearType | null>(null)
  const [editForm, setEditForm] = useState({ name: '', isActive: false })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<AcademicYearType | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/academic-years')
      const data = await res.json()
      if (res.ok) setYears(data.academicYears || [])
      else setError(data.error || 'Failed to load academic years')
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
      const res = await fetch('/api/admin/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); setCreating(false); return }
      setCreateOpen(false)
      setForm({ name: '', isActive: false })
      setSuccess(`Academic year "${data.academicYear?.name}" created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (year: AcademicYearType) => {
    setEditing(year)
    setEditForm({ name: year.name, isActive: year.isActive })
    setEditOpen(true)
    setSuccess(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/academic-years/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed'); return }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`Academic year "${editForm.name}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (year: AcademicYearType) => {
    setToDelete(year)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/academic-years/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); setConfirmOpen(false); return }
      setConfirmOpen(false)
      setSuccess(`Academic year "${toDelete.name}" deleted successfully`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  if (loading) return <PageLoader label="Loading academic years…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Academic Years
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage academic years and their semesters.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Academic Year
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
              <TableHeader>Status</TableHeader>
              <TableHeader>Semesters</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {years.length === 0 ? (
              <TableEmpty columns={5} message="No academic years found. Create one to get started." />
            ) : (
              years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{year.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={year.isActive ? 'success' : 'default'} dot>
                      {year.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(year.semesters?.length ?? 0) === 0 ? (
                        <span className="text-gray-400 text-xs">No semesters</span>
                      ) : (
                        year.semesters?.map((s) => (
                          <Badge key={s.id} variant={s.isLocked ? 'warning' : 'info'}>
                            Sem {s.number} ({s.type}){s.isLocked ? ' 🔒' : ''}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {year.createdAt ? new Date(year.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    }) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(year)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(year)}>
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
        title="Add Academic Year"
        description="Create a new academic year. Name must be in YYYY-YY format (e.g. 2024-25)."
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
            label="Name"
            value={form.name}
            onChange={(v) => setForm((s) => ({ ...s, name: v }))}
            required
            placeholder="e.g. 2024-25"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-active"
              checked={form.isActive}
              onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="create-active" className="text-sm text-gray-700">
              Set as active year
            </label>
          </div>
          {form.isActive && (
            <p className="text-xs text-amber-600 mt-1">
              Setting this as active will deactivate any currently active academic year.
            </p>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit Academic Year"
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
              label="Name"
              value={editForm.name}
              onChange={(v) => setEditForm((s) => ({ ...s, name: v }))}
              required
              placeholder="e.g. 2024-25"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit-active" className="text-sm text-gray-700">
                Set as active year
              </label>
            </div>
            {editForm.isActive && !editing.isActive && (
              <p className="text-xs text-amber-600 mt-1">
                Setting this as active will deactivate any currently active academic year.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Academic Year"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to delete <strong>{toDelete?.name}</strong>?
        {toDelete && (toDelete.semesters?.length ?? 0) > 0 && (
          <span className="block mt-1 text-amber-600">
            This will also delete {toDelete.semesters?.length} semester(s) associated with it.
          </span>
        )}
      </ConfirmModal>
    </div>
  )
}
