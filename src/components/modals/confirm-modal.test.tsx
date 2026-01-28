/// <reference types="vitest" />
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from './confirm-modal' 
import { vi } from 'vitest'

test('ConfirmModal calls onConfirm and onCancel appropriately', async () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<ConfirmModal open={true} title="Confirm" onConfirm={onConfirm} onCancel={onCancel}>Are you sure?</ConfirmModal>)

  // click the Confirm button specifically
  const confirmBtn = screen.getByRole('button', { name: /confirm/i })
  expect(confirmBtn).toBeInTheDocument()
  await userEvent.click(confirmBtn)
  expect(onConfirm).toHaveBeenCalled()

  // click Cancel button
  const cancelBtn = screen.getByRole('button', { name: /cancel/i })
  await userEvent.click(cancelBtn)
  expect(onCancel).toHaveBeenCalled()
})
