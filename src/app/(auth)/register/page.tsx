import React from 'react'
import RegisterForm from '@/components/forms/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">Register</h1>
        <RegisterForm />
        <div className="mt-4 text-sm">
          <a href="/login" className="text-blue-600">Have an account? Login</a>
        </div>
      </div>
    </div>
  )
}