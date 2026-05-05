import { createContext } from 'react'
import type { AuthRole } from '../types'

type AuthSessionStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthSessionContextValue = {
  status: AuthSessionStatus
  isAuthenticated: boolean
  userId: string | null
  role: AuthRole | null
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(
  undefined,
)

