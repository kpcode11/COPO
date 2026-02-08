'use client'

import { useState, useCallback } from 'react'

type FileType = 'csv' | 'excel'

interface UseFileUploadReturn {
  file: File | null
  fileType: FileType | null
  headers: string[]
  rows: Record<string, string>[]
  error: string | null
  loading: boolean
  pickFile: (file: File) => Promise<void>
  reset: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<FileType | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickFile = useCallback(async (f: File) => {
    setLoading(true)
    setError(null)
    setFile(f)

    try {
      const ext = f.name.split('.').pop()?.toLowerCase()
      let parsed: { headers: string[]; rows: Record<string, string>[] }

      if (ext === 'csv') {
        setFileType('csv')
        const { parseCsvFile } = await import('@/lib/file-handlers/csv-parser')
        parsed = await parseCsvFile(f)
      } else if (ext === 'xlsx' || ext === 'xls') {
        setFileType('excel')
        const { parseExcelFile } = await import('@/lib/file-handlers/excel-parser')
        parsed = await parseExcelFile(f)
      } else {
        throw new Error('Unsupported file type. Please upload CSV or Excel file.')
      }

      if (parsed.rows.length === 0) {
        throw new Error('File is empty or has no data rows.')
      }

      setHeaders(parsed.headers)
      setRows(parsed.rows)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse file'
      setError(message)
      setHeaders([])
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setFile(null)
    setFileType(null)
    setHeaders([])
    setRows([])
    setError(null)
    setLoading(false)
  }, [])

  return { file, fileType, headers, rows, error, loading, pickFile, reset }
}
