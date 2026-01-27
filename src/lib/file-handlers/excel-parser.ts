import * as XLSX from 'xlsx'

export const parseExcelFile = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  const headers = json.length > 0 ? Object.keys(json[0]) : []
  return { headers, rows: json }
}
