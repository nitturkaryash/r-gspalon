import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { getSession, subscribeToAuthChanges } from '../lib/auth'

interface AuthContextType {
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getSession().then(({ session }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = subscribeToAuthChanges((event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 