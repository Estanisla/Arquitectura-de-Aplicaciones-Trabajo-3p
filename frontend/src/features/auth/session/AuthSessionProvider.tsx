import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AuthRole } from '../types'
import { getVendorSession, logoutVendor } from '../api/sessionVendor'
import {
  AuthSessionContext,
  type AuthSessionContextValue,
} from './AuthSessionContext.tsx'

type AuthSessionStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthSessionSnapshot = {
  status: AuthSessionStatus
  userId: string | null
  role: AuthRole | null
}

const ANONYMOUS_SNAPSHOT: AuthSessionSnapshot = {
  status: 'anonymous',
  userId: null,
  role: null,
}

const loadSessionSnapshot = async (): Promise<AuthSessionSnapshot> => {
  try {
    const result = await getVendorSession()

    if (result.ok && result.authenticated) {
      return {
        status: 'authenticated',
        userId: result.user_id ?? null,
        role: result.role ?? null,
      }
    }
  } catch {
    // fall through to anonymous
  }

  return ANONYMOUS_SNAPSHOT
}

type AuthSessionProviderProps = {
  children: ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [status, setStatus] = useState<AuthSessionStatus>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<AuthRole | null>(null)

  const applySnapshot = useCallback((snapshot: AuthSessionSnapshot) => {
    setStatus(snapshot.status)
    setUserId(snapshot.userId)
    setRole(snapshot.role)
  }, [])

  const refreshSession = useCallback(async () => {
    applySnapshot(await loadSessionSnapshot())
  }, [applySnapshot])

  const logout = useCallback(async () => {
    try {
      await logoutVendor()
    } finally {
      applySnapshot(ANONYMOUS_SNAPSHOT)
    }
  }, [applySnapshot])

  useEffect(() => {
    let active = true

    void loadSessionSnapshot().then((snapshot) => {
      if (active) {
        applySnapshot(snapshot)
      }
    })

    return () => {
      active = false
    }
  }, [applySnapshot])

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      userId,
      role,
      refreshSession,
      logout,
    }),
    [status, userId, role, refreshSession, logout],
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}
