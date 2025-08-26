import { NextRequest, NextResponse } from 'next/server'

function isJwtExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return true
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    const payload = JSON.parse(payloadJson) as { exp?: number }
    if (!payload.exp) return true
    const nowSeconds = Math.floor(Date.now() / 1000)
    return nowSeconds >= payload.exp
  } catch {
    return true
  }
}

function isPublicPath(pathname: string): boolean {
  // Allow Next internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    /\.[^/]+$/.test(pathname) // any file with an extension
  ) {
    return true
  }

  // Public pages
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') || // login/register
    pathname.startsWith('/categories') ||
    // Public recipe browsing (list and details)
    (pathname.startsWith('/recipes') &&
      !pathname.endsWith('/create') &&
      !pathname.includes('/my-recipes') &&
      !pathname.includes('/edit')) ||
    pathname.startsWith('/ingredients')
  ) {
    return true
  }

  return false
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Skip public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth_token')?.value

  if (!token || isJwtExpired(token)) {
    const redirectUrl = new URL('/auth/login', req.url)
    const target = pathname + (search || '')
    redirectUrl.searchParams.set('redirect', target)

    const res = NextResponse.redirect(redirectUrl)
    // Clear cookie if present/expired
    res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return res
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes; logic above skips public ones
  matcher: ['/((?!api).*)'],
}
