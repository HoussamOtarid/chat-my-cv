import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const path = req.nextUrl.pathname

  // Allow login page
  if (path === '/admin/login') {
    return NextResponse.next()
  }

  // Protect admin routes
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!req.auth || req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ]
}