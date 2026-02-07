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
import { Users, Plus, RefreshCw, Search, Eye, EyeOff, Key, Copy, CheckCircle } from 'lucide-react'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  departmentId?: string | null
  isActive: boolean
  createdAt: string
}

interface Department {
  id: string
  name: string
}

const roleMeta: Record<string, { label: string; variant: 'danger' | 'primary' | 'success' }> = {
  ADMIN: { label: 'Admin', variant: 'danger' },
  HOD: { label: 'HOD', variant: 'primary' },
  TEACHER: { label: 'Teacher', variant: 'success' },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TEACHER', departmentId: '' })

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserRecord | null>(null)
  const [editForm, setEditForm] = useState({ role: '', departmentId: '' })

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<UserRecord | null>(null)

  // Password reset modal
  const [resetPwdOpen, setResetPwdOpen] = useState(false)
  const [resettingPwd, setResettingPwd] = useState(false)
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<UserRecord | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
      ])
      const usersData = await usersRes.json()
      const deptsData = await deptsRes.json()
      if (usersRes.ok) setUsers(usersData.users || [])
      else setError(usersData.error || 'Failed to load users')
      if (deptsRes.ok) setDepartments(deptsData.departments || [])
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const createUser = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Create failed')
        setCreating(false)
        return
      }
      setCreateOpen(false)
      setForm({ name: '', email: '', password: '', role: 'TEACHER', departmentId: '' })
      setShowCreatePwd(false)
      setSuccess(`User "${data.user?.name}" created successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (user: UserRecord) => {
    setEditing(user)
    setEditForm({ role: user.role, departmentId: user.departmentId || '' })
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
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Update failed')
        return
      }
      setEditOpen(false)
      setEditing(null)
      setSuccess(`User "${editing.name}" updated successfully`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const confirmDelete = (user: UserRecord) => {
    setToDelete(user)
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
      setSuccess(`User "${toDelete.name}" has been deactivated`)
      setToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const reactivateUser = async (user: UserRecord) => {
    setError(null)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Reactivation failed')
        return
      }
      setSuccess(`User "${user.name}" has been reactivated`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const openResetPassword = (user: UserRecord) => {
    setResetUser(user)
    setResetPwdOpen(true)
    setResetPassword(null)
    setPasswordCopied(false)
    setSuccess(null)
    setError(null)
  }

  const doResetPassword = async () => {
    if (!resetUser) return
    setResettingPwd(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${resetUser.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Password reset failed')
        setResettingPwd(false)
        return
      }
      setResetPassword(data.password)
      setSuccess(`Password reset for "${resetUser.name}"`)
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setResettingPwd(false)
    }
  }

  const closeResetModal = () => {
    setResetPwdOpen(false)
    setResetPassword(null)
    setResetUser(null)
    setPasswordCopied(false)
  }

  const copyPassword = () => {
    if (resetPassword) {
      navigator.clipboard.writeText(resetPassword)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getDeptName = (deptId?: string | null) => {
    if (!deptId) return '—'
    return departments.find((d) => d.id === deptId)?.name || '—'
  }

  if (loading) return <PageLoader label="Loading users…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Create, edit, and manage user accounts across the system.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => { setCreateOpen(true); setSuccess(null) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create User
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="HOD">HOD</option>
          <option value="TEACHER">Teacher</option>
        </select>
        <div className="text-sm text-gray-500">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Joined</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableEmpty columns={7} message="No users match your filters" />
            ) : (
              filteredUsers.map((user) => {
                const meta = roleMeta[user.role]
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={meta?.variant || 'default'} dot>
                        {meta?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDeptName(user.departmentId)}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openEdit(user)}>
                          Edit
                        </Button>
                        <Button variant="outline" className="text-xs px-2.5 py-1" onClick={() => openResetPassword(user)}>
                          <Key className="h-3 w-3 mr-1" />
                          Reset Pwd
                        </Button>
                        {user.isActive ? (
                          <Button variant="ghost" className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50" onClick={() => confirmDelete(user)}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button variant="ghost" className="text-xs px-2.5 py-1 text-green-600 hover:bg-green-50" onClick={() => reactivateUser(user)}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New User"
        description="Add a new user to the system with a role and optional department assignment."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createUser} disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Input label="Full Name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} required placeholder="e.g. Dr. Rajesh Kumar" />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} required placeholder="e.g. rajesh@example.com" />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password *</label>
            <div className="relative">
              <input
                type={showCreatePwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowCreatePwd(!showCreatePwd)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCreatePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Select
            label="Role"
            value={form.role}
            onChange={(v) => setForm((s) => ({ ...s, role: v }))}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'HOD', label: 'Head of Department' },
              { value: 'TEACHER', label: 'Teacher' },
            ]}
          />
          {(form.role === 'HOD' || form.role === 'TEACHER') && (
            <Select
              label="Department"
              value={form.departmentId}
              onChange={(v) => setForm((s) => ({ ...s, departmentId: v }))}
              placeholder="Select department…"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        title="Edit User"
        description={editing ? `Update role and department for ${editing.name}` : ''}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border text-gray-600 text-sm font-medium">
                {editing.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{editing.name}</div>
                <div className="text-xs text-gray-500">{editing.email}</div>
              </div>
            </div>
            <Select
              label="Role"
              value={editForm.role}
              onChange={(v) => setEditForm((s) => ({ ...s, role: v }))}
              options={[
                { value: 'ADMIN', label: 'Administrator' },
                { value: 'HOD', label: 'Head of Department' },
                { value: 'TEACHER', label: 'Teacher' },
              ]}
            />
            {(editForm.role === 'HOD' || editForm.role === 'TEACHER') && (
              <Select
                label="Department"
                value={editForm.departmentId}
                onChange={(v) => setEditForm((s) => ({ ...s, departmentId: v }))}
                placeholder="Select department…"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Deactivate User"
        onConfirm={doDelete}
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
      >
        Are you sure you want to deactivate <strong>{toDelete?.name}</strong>? They will not be able to log in until reactivated by an administrator.
      </ConfirmModal>

      {/* Password Reset Modal */}
      <Modal
        open={resetPwdOpen}
        onClose={closeResetModal}
        title="Reset User Password"
        description={resetUser ? `Generate a new password for ${resetUser.name}` : ''}
        footer={
          resetPassword ? (
            <Button variant="primary" onClick={closeResetModal}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeResetModal}>Cancel</Button>
              <Button variant="primary" onClick={doResetPassword} disabled={resettingPwd}>
                {resettingPwd ? 'Generating…' : 'Reset Password'}
              </Button>
            </>
          )
        }
      >
        {resetPassword ? (
          <div className="space-y-3">
            <Alert type="success">Password reset successfully!</Alert>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">New Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white rounded border text-sm font-mono select-all">
                  {resetPassword}
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
                Make sure to copy this password and share it securely with the user. It won't be shown again.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                {resetUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{resetUser?.name}</div>
                <div className="text-xs text-gray-500">{resetUser?.email}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              A new random password will be generated and the user's current password will be replaced. The new password will be displayed after generation.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
