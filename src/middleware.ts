import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Minimal middleware: allow all requests. Add RBAC or redirects here.
  return NextResponse.next()
}

export const config = {
  // Apply middleware only to API and dashboard routes
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
