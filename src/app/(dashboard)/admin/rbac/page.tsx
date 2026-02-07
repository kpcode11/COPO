'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Alert from '@/components/ui/alert'
import Tabs from '@/components/ui/tabs'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { Shield, Users, Eye, ChevronRight } from 'lucide-react'
import { getPermissionsForRole, type Permission } from '@/lib/auth/rbac'

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

const ROLES = ['ADMIN', 'HOD', 'TEACHER'] as const

const roleMeta: Record<string, { label: string; variant: 'danger' | 'primary' | 'success'; desc: string }> = {
  ADMIN: {
    label: 'Administrator',
    variant: 'danger',
    desc: 'Full system access. Manage users, roles, academic data, configuration, and all reports.',
  },
  HOD: {
    label: 'Head of Department',
    variant: 'primary',
    desc: 'Department-scoped access. View teachers, courses, attainments, and review CQI actions within their department.',
  },
  TEACHER: {
    label: 'Teacher',
    variant: 'success',
    desc: 'Course-level access. Manage assessments, upload marks, view attainment, and create CQI actions for assigned courses.',
  },
}

// Group permissions by domain for display
function groupPermissions(perms: Permission[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const p of perms) {
    const [domain, action] = p.split('.')
    if (!groups[domain]) groups[domain] = []
    groups[domain].push(action)
  }
  return groups
}

function PermissionBadge({ domain, action }: { domain: string; action: string }) {
  return (
    <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 font-mono">
      {domain}.<span className="text-gray-900 font-medium">{action}</span>
    </span>
  )
}

export default function AdminRBACPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Role change modal
  const [editUser, setEditUser] = useState<UserRecord | null>(null)
  const [newRole, setNewRole] = useState('')
  const [newDeptId, setNewDeptId] = useState('')
  const [saving, setSaving] = useState(false)

  // Permission viewer
  const [viewRole, setViewRole] = useState<string | null>(null)

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

  const openRoleChange = (user: UserRecord) => {
    setEditUser(user)
    setNewRole(user.role)
    setNewDeptId(user.departmentId || '')
    setSuccess(null)
  }

  const saveRoleChange = async () => {
    if (!editUser) return
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, string> = { role: newRole }
      if (newRole === 'HOD' || newRole === 'TEACHER') {
        body.departmentId = newDeptId
      }
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update role')
        setSaving(false)
        return
      }
      setEditUser(null)
      setSuccess(`${editUser.name}'s role updated to ${roleMeta[newRole]?.label || newRole}`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: UserRecord) => {
    setError(null)
    try {
      if (user.isActive) {
        const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to deactivate')
          return
        }
        setSuccess(`${user.name} has been deactivated`)
      } else {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: user.name }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to reactivate')
          return
        }
        setSuccess(`${user.name} has been reactivated`)
      }
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    hods: users.filter((u) => u.role === 'HOD').length,
    teachers: users.filter((u) => u.role === 'TEACHER').length,
    inactive: users.filter((u) => !u.isActive).length,
  }

  const tabs = [
    { id: 'overview', label: 'Role Overview' },
    { id: 'users', label: 'User Roles', count: stats.total },
    { id: 'permissions', label: 'Permissions Matrix' },
  ]

  if (loading) return <PageLoader label="Loading RBAC data…" />

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Roles & Access Control
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user roles, view permissions, and control access across the system.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Admins</div>
            <Badge variant="danger" dot>{stats.admins}</Badge>
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.admins}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">HODs</div>
            <Badge variant="primary" dot>{stats.hods}</Badge>
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.hods}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Teachers</div>
            <Badge variant="success" dot>{stats.teachers}</Badge>
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.teachers}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Inactive</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.inactive}</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="overview">
        {(activeTab) => {
          if (activeTab === 'overview') {
            return (
              <div className="grid grid-cols-3 gap-5">
                {ROLES.map((role) => {
                  const meta = roleMeta[role]
                  const perms = getPermissionsForRole(role)
                  const grouped = groupPermissions(perms)

                  return (
                    <Card key={role} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{meta.label}</CardTitle>
                          <Badge variant={meta.variant} dot>
                            {users.filter((u) => u.role === role).length} users
                          </Badge>
                        </div>
                        <CardDescription>{meta.desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Permissions ({perms.length})
                          </div>
                          {Object.entries(grouped).map(([domain, actions]) => (
                            <div key={domain}>
                              <div className="text-xs font-semibold text-gray-700 capitalize mb-1">{domain}</div>
                              <div className="flex flex-wrap gap-1">
                                {actions.map((action) => (
                                  <PermissionBadge key={`${domain}.${action}`} domain={domain} action={action} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          }

          if (activeTab === 'users') {
            return (
              <Card padding={false}>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">All users and their roles</span>
                  </div>
                  <Button variant="outline" onClick={fetchData}>Refresh</Button>
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Email</TableHeader>
                      <TableHeader>Role</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Joined</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableEmpty columns={6} />
                    ) : (
                      users.map((user) => {
                        const meta = roleMeta[user.role]
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <span className="font-medium text-gray-900">{user.name}</span>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={meta?.variant || 'default'} dot>
                                {meta?.label || user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'success' : 'default'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  className="text-xs px-2.5 py-1"
                                  onClick={() => openRoleChange(user)}
                                >
                                  Change Role
                                </Button>
                                <Button
                                  variant={user.isActive ? 'ghost' : 'secondary'}
                                  className="text-xs px-2.5 py-1"
                                  onClick={() => toggleActive(user)}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            )
          }

          if (activeTab === 'permissions') {
            const allPerms = getPermissionsForRole('ADMIN')
            const grouped = groupPermissions(allPerms)

            return (
              <Card padding={false}>
                <div className="px-5 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Permission matrix across roles</span>
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Permission</TableHeader>
                      {ROLES.map((r) => (
                        <TableHeader key={r} className="text-center">{roleMeta[r].label}</TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(grouped).map(([domain, actions]) =>
                      actions.map((action, i) => {
                        const perm = `${domain}.${action}` as Permission
                        return (
                          <TableRow key={perm}>
                            <TableCell>
                              <PermissionBadge domain={domain} action={action} />
                            </TableCell>
                            {ROLES.map((role) => {
                              const has = getPermissionsForRole(role).includes(perm)
                              return (
                                <TableCell key={role} className="text-center">
                                  {has ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                                  ) : (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-300 text-xs">—</span>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            )
          }

          return null
        }}
      </Tabs>

      {/* Role change modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Change User Role"
        description={editUser ? `Update the role for ${editUser.name} (${editUser.email})` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveRoleChange} disabled={saving}>
              {saving ? 'Saving…' : 'Update Role'}
            </Button>
          </>
        }
      >
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium">
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{editUser.name}</div>
                <div className="text-xs text-gray-500">{editUser.email}</div>
              </div>
              <div className="ml-auto">
                <Badge variant={roleMeta[editUser.role]?.variant || 'default'} dot>
                  {roleMeta[editUser.role]?.label || editUser.role}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="block text-xs text-gray-500 mb-1">Current Role</span>
                <Badge variant={roleMeta[editUser.role]?.variant || 'default'}>
                  {roleMeta[editUser.role]?.label || editUser.role}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 mt-4" />
              <div className="flex-1">
                <Select
                  label="New Role"
                  value={newRole}
                  onChange={setNewRole}
                  options={ROLES.map((r) => ({ value: r, label: roleMeta[r].label }))}
                />
              </div>
            </div>

            {(newRole === 'HOD' || newRole === 'TEACHER') && (
              <Select
                label="Department"
                value={newDeptId}
                onChange={setNewDeptId}
                placeholder="Select department…"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            )}

            {newRole && newRole !== editUser.role && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-medium text-amber-800 mb-1">Permission changes</div>
                <div className="text-xs text-amber-700">
                  This user will go from <strong>{getPermissionsForRole(editUser.role).length}</strong> permissions
                  to <strong>{getPermissionsForRole(newRole).length}</strong> permissions.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}