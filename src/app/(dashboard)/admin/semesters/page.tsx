'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Select from '@/components/ui/select'
import Alert from '@/components/ui/alert'
import Card from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import ConfirmModal from '@/components/modals/confirm-modal'
import { BookOpen, Plus, RefreshCw, Lock, Unlock, Trash2 } from 'lucide-react'

interface AcademicYear { id: string; name: string; isActive: boolean }
interface Semester {
  id: string
  number: number
  type: string
  isLocked: boolean
  academicYearId: string
  academicYear: AcademicYear
  createdAt: string
  _count: { courses: number }
}

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ number: '', academicYearId: '' })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Semester | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [semRes, ayRes] = await Promise.all([
        fetch(`/api/admin/semesters${yearFilter ? `?academicYearId=${yearFilter}` : ''}`),
        fetch('/api/admin/academic-years'),
      ])
      const semData = await semRes.json()
      const ayData = await ayRes.json()
      if (semRes.ok) setSemesters(semData.semesters || [])
      else setError(semData.error || 'Failed to load semesters')
      if (ayRes.ok) setAcademicYears(ayData.academicYears || [])
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [yearFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: parseInt(form.number), academicYearId: form.academicYearId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); setCreating(false); return }
      setCreateOpen(false)
      setForm({ number: '', academicYearId: '' })
      setSuccess(`Semester ${data.semester?.number} created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const toggleLock = async (sem: Semester) => {
    setError(null)
    setSuccess(null)
    const action = sem.isLocked ? 'unlock' : 'lock'
    const body: any = {}
    if (action === 'unlock') {
      const reason = prompt('Enter reason for unlocking this semester:')
      if (!reason) return
      body.reason = reason
    }
    try {
      const res = await fetch(`/api/admin/semesters/${sem.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || `${action} failed`); return }
      setSuccess(`Semester ${sem.number} ${action}ed successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (sem: Semester) => {
    setToDelete(sem)
    setConfirmOpen(true)
    setSuccess(null)
  }

  const doDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/semesters/${toDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delete failed'); setConfirmOpen(false); return }
      setConfirmOpen(false)
      setSuccess(`Semester ${toDelete.number} deleted successfully`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  if (loading) return <PageLoader label="Loading semesters…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Semesters
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage semesters within academic years. Lock semesters to prevent data modifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Semester
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All academic years</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>
          ))}
        </select>
        <div className="text-sm text-gray-500">
          {semesters.length} semester(s)
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Semester</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Academic Year</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Courses</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {semesters.length === 0 ? (
              <TableEmpty columns={6} message="No semesters found. Create one to get started." />
            ) : (
              semesters.map((sem) => (
                <TableRow key={sem.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">Semester {sem.number}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sem.type === 'ODD' ? 'info' : 'primary'}>
                      {sem.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span>{sem.academicYear.name}</span>
                    {sem.academicYear.isActive && (
                      <Badge variant="success" className="ml-2">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sem.isLocked ? 'warning' : 'success'} dot>
                      {sem.isLocked ? 'Locked' : 'Open'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sem._count.courses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        className="text-xs px-2.5 py-1"
                        onClick={() => toggleLock(sem)}
                      >
                        {sem.isLocked ? (
                          <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</>
                        ) : (
                          <><Lock className="h-3.5 w-3.5 mr-1" /> Lock</>
                        )}
                      </Button>
                      <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(sem)}>
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
        title="Add Semester"
        description="Create a new semester. Type (ODD/EVEN) is automatically derived from the semester number."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating || !form.number || !form.academicYearId}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Select
            label="Academic Year"
            value={form.academicYearId}
            onChange={(v) => setForm((s) => ({ ...s, academicYearId: v }))}
            placeholder="Select academic year…"
            required
            options={academicYears.map((y) => ({ value: y.id, label: `${y.name}${y.isActive ? ' (Active)' : ''}` }))}
          />
          <Select
            label="Semester Number"
            value={form.number}
            onChange={(v) => setForm((s) => ({ ...s, number: v }))}
            placeholder="Select semester number…"
            required
            options={[1,2,3,4,5,6,7,8].map((n) => ({
              value: String(n),
              label: `Semester ${n} (${n % 2 === 1 ? 'ODD' : 'EVEN'})`,
            }))}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Semester"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to delete <strong>Semester {toDelete?.number}</strong> ({toDelete?.academicYear.name})?
        {toDelete && toDelete._count.courses > 0 && (
          <span className="block mt-1 text-amber-600">
            This semester has {toDelete._count.courses} course(s). It cannot be deleted until all courses are removed.
          </span>
        )}
      </ConfirmModal>
    </div>
  )
}
