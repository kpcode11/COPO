/// <reference types="vitest" />
import React from 'react'
import { render, screen } from '@testing-library/react'
import DataTable from './data-table' 

test('DataTable renders headers and rows', () => {
  const columns = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]
  const rows = [{ a: 'row1a', b: 'row1b' }, { a: 'row2a', b: 'row2b' }]
  render(<DataTable columns={columns} rows={rows} />)
  expect(screen.getByText('A')).toBeInTheDocument()
  expect(screen.getByText('row1a')).toBeInTheDocument()
})
