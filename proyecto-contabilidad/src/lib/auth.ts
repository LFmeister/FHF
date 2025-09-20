import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  full_name?: string
}

export const auth = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/FHF/auth/callback`,
      },
    })
    return { data, error }
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/FHF/auth/reset-password`,
    })
    return { data, error }
  },

  // Update password
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  },

  // Update user's full name (in user metadata)
  async updateFullName(fullName: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    })
    return { data, error }
  },

  // Update user's email (may require email confirmation depending on project settings)
  async updateEmail(email: string) {
    const { data, error } = await supabase.auth.updateUser({
      email,
    })
    return { data, error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Check if user email is confirmed
  async isEmailConfirmed() {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email_confirmed_at !== null
  },

  // Resend confirmation email
  async resendConfirmation(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/FHF/auth/callback`,
      }
    })
    return { data, error }
  },

  // Get session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get session from URL (handles both query code and hash tokens)
  async getSessionFromUrl() {
    // Some versions of supabase-js typings may not expose getSessionFromUrl.
    // Cast to any to ensure runtime support while keeping TS happy.
    const authAny = supabase.auth as any
    const { data, error } = await authAny.getSessionFromUrl({ storeSession: true })
    return { data, error }
  },

  // Exchange code for session (for email confirmation)
  async exchangeCodeForSession(code: string) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    return { data, error }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
