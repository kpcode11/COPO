/// <reference types="vitest" />
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminUsersPage from './page'
import { vi } from 'vitest'

const users = [
  { id: 'u1', name: 'Alice', email: 'a@example.com', role: 'TEACHER', department: { name: 'CS' } },
]

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads users and allows editing role', async () => {
    const fetchMock = vi.fn((url, opts) => {
      if (url === '/api/users' && (!opts || opts.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => ({ users }) })
      }
      if (typeof url === 'string' && url.startsWith('/api/users/') && opts && opts.method === 'PATCH') {
        // assert payload
        const body = JSON.parse((opts as any).body)
        expect(body.role).toBe('HOD')
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: 'unexpected' }) })
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<AdminUsersPage />)

    // wait for the user row to appear
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())

    // click Edit on the row
    const editBtn = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editBtn)

    // modal should show
    await waitFor(() => expect(screen.getByText(/Edit user/i)).toBeInTheDocument())

    const roleSelect = screen.getByRole('combobox')
    await userEvent.selectOptions(roleSelect, 'HOD')

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveBtn)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/users/u1', expect.objectContaining({ method: 'PATCH' })))
  })
})