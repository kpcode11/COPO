'use client'
import { useParams } from 'next/navigation'
import { redirect } from 'next/navigation'

export default function AssessmentPage() {
  const params = useParams()
  const courseId = params.courseId as string
  redirect(`/teacher/courses/${courseId}/assessments`)
}
