import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setIsGuest(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data?.user && username) {
      // Save username to profiles table (created automatically by Supabase trigger)
      await supabase.from('profiles').update({ username: username.trim().toLowerCase() }).eq('id', data.user.id)
    }
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' }
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsGuest(false)
  }

  const enterAsGuest = () => { setIsGuest(true) }
  const isAuthenticated = !!user && !isGuest

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, isAuthenticated, signUp, signIn, signInWithGoogle, signOut, enterAsGuest }}>
      {children}
    </AuthContext.Provider>
  )
}
