import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // hồ sơ (profiles) của người đang đăng nhập
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await authService.getCurrentUser()
    setUser(data ?? null)
    setReady(true)
    return data ?? null
  }, [])

  useEffect(() => {
    refresh()
    const { data } = authService.onAuthChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') refresh()
    })
    return () => data?.subscription?.unsubscribe()
  }, [refresh])

  const value = useMemo(() => ({
    user, ready, isAdmin: user?.role === 'admin', refresh,
    logout: async () => { await authService.logout(); setUser(null) },
  }), [user, ready, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
