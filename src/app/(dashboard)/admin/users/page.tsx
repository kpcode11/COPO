'use client'
import React, { useEffect, useState } from 'react'
import TeachersTable from '@/components/tables/teachers-table'
import Button from '@/components/ui/button'
import ConfirmModal from '@/components/modals/confirm-modal'
import Input from '@/components/ui/input'
import Alert from '@/components/ui/alert'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TEACHER', departmentId: '' })
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [departments, setDepartments] = useState<any[]>([])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok && data.users) setUsers(data.users)
      else setError(data.error || 'Failed to load users')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      const data = await res.json()
      if (res.ok && data.departments) setDepartments(data.departments)
    } catch (err) { /* ignore */ }
  }

  useEffect(() => { fetchUsers(); fetchDepartments() }, [])

  const createUser = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Create failed')
      setOpenCreate(false)
      setForm({ name: '', email: '', password: '', role: 'TEACHER', departmentId: '' })
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally { setCreating(false) }
  }

  const confirmDelete = (id: string) => { setToDelete(id); setConfirmOpen(true) }
  const doDelete = async () => {
    if (!toDelete) return setConfirmOpen(false)
    try {
      const res = await fetch(`/api/users/${toDelete}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Delete failed')
      setConfirmOpen(false)
      setToDelete(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const openEdit = (user: any) => {
    setEditing(user)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    setError(null)
    try {
      const res = await fetch(`/api/users/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: editing.role, departmentId: editing.departmentId }) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Update failed')
      setEditOpen(false)
      setEditing(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => fetchUsers()}>Refresh</Button>
          <Button variant="primary" onClick={() => setOpenCreate(true)}>Create user</Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? <div>Loading...</div> : <TeachersTable teachers={users} onEdit={openEdit} onDelete={confirmDelete} />}

      {openCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg mb-3">Create user</h3>
            <Input label="Name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} required />
            <Input label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} required />
            <Input label="Password" type="password" value={form.password} onChange={(v) => setForm((s) => ({ ...s, password: v }))} required />
            <div className="mt-2">
              <label className="block text-sm mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="w-full border p-2 rounded">
                <option value="ADMIN">ADMIN</option>
                <option value="HOD">HOD</option>
                <option value="TEACHER">TEACHER</option>
              </select>
            </div>
            <div className="mt-2">
              <label className="block text-sm mb-1">Department</label>
              <select value={form.departmentId} onChange={(e) => setForm((s) => ({ ...s, departmentId: e.target.value }))} className="w-full border p-2 rounded">
                <option value="">(none)</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => createUser()} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg mb-3">Edit user</h3>
            <div className="mb-2"><strong>Name:</strong> {editing.name}</div>
            <div className="mb-2"><strong>Email:</strong> {editing.email}</div>
            <div className="mb-2">
              <label className="block text-sm mb-1">Role</label>
              <select value={editing.role} onChange={(e) => setEditing((s: any) => ({ ...s, role: e.target.value }))} className="w-full border p-2 rounded">
                <option value="ADMIN">ADMIN</option>
                <option value="HOD">HOD</option>
                <option value="TEACHER">TEACHER</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setEditOpen(false); setEditing(null) }}>Cancel</Button>
              <Button variant="primary" onClick={() => saveEdit()}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmOpen} title="Delete user" onConfirm={doDelete} onCancel={() => setConfirmOpen(false)}>
        Are you sure you want to deactivate this user?
      </ConfirmModal>
    </div>
  )
}
