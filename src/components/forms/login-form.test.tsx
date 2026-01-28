/// <reference types="vitest" />
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm' 

// Mock next/navigation useRouter for tests
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))

// Prevent network fetch during validation tests
beforeEach(() => {
  global.fetch = vi.fn()
})

test('LoginForm shows validation errors and does not call fetch', async () => {
  const mockFetch = global.fetch as unknown as vi.Mock
  render(<LoginForm />)
  await userEvent.click(screen.getByRole('button', { name: /login/i }))
  // Should show client validation
  expect(await screen.findByText(/Email is required|Password is required/)).toBeInTheDocument()
  // and must not have attempted network call
  expect(mockFetch).not.toHaveBeenCalled()
})
