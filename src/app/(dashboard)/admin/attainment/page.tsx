'use client'
import React from 'react'
import Card, { CardContent } from '@/components/ui/card'
import { Target, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function AdminAttainmentPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-xl font-semibold">Attainment Overview</h1>
          <p className="text-sm text-gray-500">View Course Outcome (CO) and Program Outcome (PO) attainment levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/attainment/co">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">CO Attainment</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    View course outcome attainment levels per course. See IA1, IA2, End Sem scores,
                    direct and indirect assessments, and final attainment levels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/attainment/po">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">PO Attainment</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    View program outcome attainment levels per program. See direct scores,
                    indirect scores, and final attainment for PO1–PO12.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
