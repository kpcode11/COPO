import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/session',
  '/api/health',
  '/api/version',
]

// Role-based route prefixes
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/hod': ['ADMIN', 'HOD'],
  '/teacher': ['ADMIN', 'HOD', 'TEACHER'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname === '/') {
    return NextResponse.next()
  }

  // Allow static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check session cookie
  const sessionToken = req.cookies.get('session')?.value
  if (!sessionToken) {
    // API routes return 401, pages redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For role-scoped routes (/admin, /hod, /teacher), validate role via session API
  const roleMatch = pathname.match(/^\/(admin|hod|teacher)/)
  const apiRoleMatch = pathname.match(/^\/api\/(admin)/)

  if (roleMatch || apiRoleMatch) {
    try {
      const sessionUrl = new URL('/api/auth/session', req.url)
      const sessionRes = await fetch(sessionUrl.toString(), {
        headers: { cookie: `session=${sessionToken}` },
      })

      if (!sessionRes.ok) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }

      const data = await sessionRes.json()
      const userRole = data?.user?.role

      if (!userRole) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Check role access
      const segment = roleMatch?.[1] || apiRoleMatch?.[1]
      if (segment) {
        const prefix = `/${segment}`
        const allowedRoles = ROLE_ROUTES[prefix]
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }
    } catch {
      // If session check fails, let the server-side layout handle it
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
