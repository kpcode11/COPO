import React from 'react'
import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">Login</h1>
        <LoginForm />
        <div className="mt-4 text-sm">
          <a href="/register" className="text-blue-600">Create an account</a>
        </div>
      </div>
    </div>
  )
}
