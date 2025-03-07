import { supabase } from '../supabaseClient'
import { toast } from 'react-toastify'

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    toast.error('Failed to sign in. Please check your credentials.')
    return { data: null, error }
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    toast.success('Check your email for the confirmation link!')
    return { data, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    toast.error('Failed to sign up. Please try again.')
    return { data: null, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    toast.success('Signed out successfully')
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    toast.error('Failed to sign out')
    return { error }
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    return { session, error: null }
  } catch (error) {
    console.error('Error getting session:', error)
    return { session: null, error }
  }
}

// Hook to subscribe to auth changes
export function subscribeToAuthChanges(callback: (event: any, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
} 