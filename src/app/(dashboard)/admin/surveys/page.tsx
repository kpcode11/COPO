'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import ConfirmModal from '@/components/modals/confirm-modal'
import { ClipboardList, Trash2, Eye, FileText, GraduationCap } from 'lucide-react'
import Link from 'next/link'

interface SurveyTemplate {
  id: string
  type: 'COURSE' | 'PROGRAM'
  template: any[]
  createdBy: string
  createdAt: string
}

export default function SurveysAdminPage() {
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [stats, setStats] = useState({ total: 0, course: 0, program: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/surveys')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTemplates(data.templates ?? [])
      setStats(data.stats ?? { total: 0, course: 0, program: 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/surveys/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Template deleted')
      setDeleteId(null)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">Survey Management</h1>
            <p className="text-sm text-gray-500">Create and manage course exit and program exit survey templates</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="text-sm text-gray-500">Total Templates</div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Link href="/admin/surveys/course-exit">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="h-4 w-4" /> Course Exit Surveys
              </div>
              <div className="text-2xl font-semibold mt-1">{stats.course}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/surveys/program-exit">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <GraduationCap className="h-4 w-4" /> Program Exit Surveys
              </div>
              <div className="text-2xl font-semibold mt-1">{stats.program}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Survey Templates</CardTitle>
          <CardDescription>Overview of all created survey templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Type</TableHeader>
                <TableHeader>Questions</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableEmpty columns={4} message="No survey templates created yet" />
              ) : (
                templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant={t.type === 'COURSE' ? 'primary' : 'success'}>
                        {t.type === 'COURSE' ? 'Course Exit' : 'Program Exit'}
                      </Badge>
                    </TableCell>
                    <TableCell>{Array.isArray(t.template) ? t.template.length : 0} questions</TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={t.type === 'COURSE' ? '/admin/surveys/course-exit' : '/admin/surveys/program-exit'}>
                          <Button variant="ghost" className="p-1"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" className="p-1 text-red-500" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Template"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      >
        Are you sure you want to delete this survey template? This cannot be undone.
      </ConfirmModal>
    </div>
  )
}
