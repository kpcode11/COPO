'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { getCourseOverview } from '@/actions/teacher/co-po-mapping.actions'
import {
  BookOpen, Target, ClipboardList, Upload, FileText,
  CheckCircle2, Circle, Lock, ArrowRight, AlertTriangle
} from 'lucide-react'

const STEPS = [
  { key: 'cosDefined', label: 'Course Outcomes defined', href: 'outcomes' },
  { key: 'ia1Created', label: 'IA-1 assessment created', href: 'assessments' },
  { key: 'ia2Created', label: 'IA-2 assessment created', href: 'assessments' },
  { key: 'endSemCreated', label: 'End-Sem assessment created', href: 'assessments' },
  { key: 'questionsMapped', label: 'Questions mapped to COs', href: 'assessments' },
  { key: 'marksUploaded', label: 'Marks uploaded', href: 'assessments' },
  { key: 'attainmentCalculated', label: 'CO Attainment calculated', href: 'attainment' },
  { key: 'actionTakenSubmitted', label: 'Action taken submitted', href: 'cqi' },
] as const

export default function CoursePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCourseOverview(courseId)
      .then(res => {
        if ('error' in res) setError(res.error as string)
        else setData(res)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <PageLoader label="Loading course..." />
  if (error) return <Alert type="error">{error}</Alert>
  if (!data) return null

  const { course, progress } = data
  const isLocked = course.semester?.isLocked
  const completedSteps = Object.values(progress).filter(Boolean).length
  const totalSteps = STEPS.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/teacher/courses" className="text-sm text-gray-400 hover:text-gray-600">Courses</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">{course.code}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">{course.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {course.semester?.academicYear?.name} &middot; Semester {course.semester?.number} ({course.semester?.type})
            &middot; {course.department?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Badge variant="warning" dot><Lock className="h-3 w-3 mr-0.5" />Semester Locked</Badge>
          ) : (
            <Badge variant="success" dot>Active</Badge>
          )}
        </div>
      </div>

      {isLocked && (
        <Alert type="info">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            This semester is locked. You can view data but cannot create or edit COs, assessments, question mappings, or marks.
          </span>
        </Alert>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: `/teacher/courses/${courseId}/outcomes`, icon: BookOpen, label: 'Course Outcomes', color: 'blue' },
          { href: `/teacher/courses/${courseId}/assessments`, icon: ClipboardList, label: 'Assessments', color: 'amber' },
          { href: `/teacher/courses/${courseId}/attainment`, icon: Target, label: 'CO Attainment', color: 'emerald' },
          { href: `/teacher/courses/${courseId}/cqi`, icon: FileText, label: 'CQI / Action', color: 'purple' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-blue-200 hover:shadow transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${item.color}-50`}>
                  <item.icon className={`h-4 w-4 text-${item.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Progress Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress Checklist</CardTitle>
            <Badge variant={completedSteps === totalSteps ? 'success' : 'default'}>
              {completedSteps}/{totalSteps} complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {STEPS.map(step => {
              const done = progress[step.key]
              return (
                <Link
                  key={step.key}
                  href={`/teacher/courses/${courseId}/${step.href}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                  )}
                  <span className={done ? 'text-gray-700' : 'text-gray-500'}>{step.label}</span>
                  {!done && step.key !== 'actionTakenSubmitted' && (
                    <Badge variant="warning" className="ml-auto">Pending</Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
