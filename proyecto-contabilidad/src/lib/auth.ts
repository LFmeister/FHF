import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  full_name?: string
}

export const auth = {
  // Resolve the site base URL (production or local) and ensure it includes the basePath '/FHF'
  getBaseUrl(): string {
    const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    if (envUrl) return envUrl
    if (typeof window !== 'undefined') {
      // Ensure basePath '/FHF' for GitHub Pages
      const origin = window.location.origin.replace(/\/$/, '')
      return `${origin}/FHF`
    }
    return ''
  },
  // Sign up new user
  async signUp(email: string, password: string, fullName: string) {
    const redirect = `${this.getBaseUrl()}/auth/callback?email=${encodeURIComponent(email)}`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirect,
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
      redirectTo: `${this.getBaseUrl()}/auth/reset-password`,
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
    const redirect = `${this.getBaseUrl()}/auth/callback?email=${encodeURIComponent(email)}`
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirect,
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
  async setSessionFromHash() {
    if (typeof window === 'undefined') return { set: false, error: null as any }
    const hash = window.location.hash
    if (!hash || hash.length < 2) return { set: false, error: null as any }

    const params = new URLSearchParams(hash.substring(1))
    const hashError = params.get('error')
    const errorDescription = params.get('error_description')
    if (hashError) {
      return { set: false, error: { message: `${hashError}: ${errorDescription || ''}` } as any }
    }

    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) {
      return { set: false, error: null as any }
    }

    // Try to set session manually using tokens from hash
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (!error) {
      // Clean the URL hash for security/UX
      try {
        const url = window.location.pathname + window.location.search
        window.history.replaceState({}, document.title, url)
      } catch {}
      return { set: true, session: data?.session, error: null as any }
    }
    return { set: false, error }
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
