import { DefaultSession } from 'next-auth'

// ============================================
// NextAuth Type Extensions
// ============================================

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      role: 'admin'
    }
  }

  interface User {
    id: string
    email: string
    role: 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    role: 'admin'
  }
}

// ============================================
// Auth Types
// ============================================

export interface AdminCredentials {
  email: string
  password: string
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR'
  message: string
}