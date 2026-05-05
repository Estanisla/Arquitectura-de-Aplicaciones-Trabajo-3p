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

type AuthSessionProviderProps = {
  children: ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [status, setStatus] = useState<AuthSessionStatus>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<AuthRole | null>(null)

  const refreshSession = useCallback(async () => {
    try {
      const result = await getVendorSession()

      if (result.ok && result.authenticated) {
        setStatus('authenticated')
        setUserId(result.user_id ?? null)
        setRole(result.role ?? null)
        return
      }

      setStatus('anonymous')
      setUserId(null)
      setRole(null)
    } catch {
      setStatus('anonymous')
      setUserId(null)
      setRole(null)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutVendor()
    } finally {
      setStatus('anonymous')
      setUserId(null)
      setRole(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadInitialSession = async () => {
      try {
        const result = await getVendorSession()

        if (!active) {
          return
        }

        if (result.ok && result.authenticated) {
          setStatus('authenticated')
          setUserId(result.user_id ?? null)
          setRole(result.role ?? null)
          return
        }

        setStatus('anonymous')
        setUserId(null)
        setRole(null)
      } catch {
        if (!active) {
          return
        }

        setStatus('anonymous')
        setUserId(null)
        setRole(null)
      }
    }

    void loadInitialSession()

    return () => {
      active = false
    }
  }, [])

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

