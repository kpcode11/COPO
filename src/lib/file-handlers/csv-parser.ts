import Papa from 'papaparse'

export const parseCsvFile = async (file: File) => {
  const text = await file.text()
  return new Promise<{ headers: string[]; rows: Record<string, string>[] }>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || []
        resolve({ headers, rows: results.data })
      },
      error: (err: unknown) => reject(err),
    })
  })
}
