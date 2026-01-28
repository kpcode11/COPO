import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Minimal auth guard for dashboard pages: ensure a session cookie exists.
  // Detailed role checks are performed server-side in API handlers and page components to avoid
  // calling Prisma or other Node-only libraries from the Edge middleware runtime.
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('session')?.value
    if (!token) {
      const url = req.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware only to API and dashboard routes
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
