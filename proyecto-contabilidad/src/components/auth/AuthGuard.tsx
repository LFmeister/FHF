'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { EmailConfirmationPending } from './EmailConfirmationPending'

interface AuthGuardProps {
  children: React.ReactNode
  requireEmailConfirmation?: boolean
}

export function AuthGuard({ children, requireEmailConfirmation = true }: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, error } = await auth.getCurrentUser()
        
        if (error || !user) {
          router.push('/auth/login')
          return
        }

        setUser(user)
        
        if (requireEmailConfirmation) {
          const isConfirmed = await auth.isEmailConfirmed()
          setEmailConfirmed(isConfirmed)
          
          if (!isConfirmed) {
            setLoading(false)
            return
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (requireEmailConfirmation) {
          auth.isEmailConfirmed().then(setEmailConfirmed)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, requireEmailConfirmation])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (requireEmailConfirmation && user && !emailConfirmed) {
    return (
      <EmailConfirmationPending 
        email={user.email} 
        onSignOut={handleSignOut}
      />
    )
  }

  return <>{children}</>
}
