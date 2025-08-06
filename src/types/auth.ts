import { DefaultSession } from 'next-auth'

// ============================================
// NextAuth Type Extensions
// ============================================

declare module 'next-auth' {
  interface User {
    role?: 'admin'
  }
  
  interface Session {
    user: {
      id: string
      role: 'admin'
    } & DefaultSession['user']
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