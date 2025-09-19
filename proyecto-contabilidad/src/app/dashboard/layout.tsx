'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Settings, User, FolderOpen, Home, Crown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AccountSettingsModal } from '@/components/account/AccountSettingsModal'
import { auth } from '@/lib/auth'
import { adminService } from '@/lib/admin'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [isMaster, setIsMaster] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const isProjectPage = pathname?.includes('/projects/') && pathname !== '/dashboard/projects'

  useEffect(() => {
    const checkUser = async () => {
      const { user, error } = await auth.getCurrentUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      
      // Verificar si el usuario es master
      try {
        const masterStatus = await adminService.isMaster(user.id)
        setIsMaster(masterStatus)
      } catch (error) {
        console.error('Error checking master status:', error)
        setIsMaster(false)
      }
      
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      } else if (session?.user) {
        setUser(session.user)
        
        // Verificar si el usuario es master cuando cambia la sesión
        try {
          const masterStatus = await adminService.isMaster(session.user.id)
          setIsMaster(masterStatus)
        } catch (error) {
          console.error('Error checking master status:', error)
          setIsMaster(false)
        }
        
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push('/auth/login')
  }

  const refreshUser = async () => {
    try {
      const { user } = await auth.getCurrentUser()
      setUser(user)
    } catch (e) {
      console.error('Error refreshing user:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <nav className="bg-white shadow-lg border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">MM</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-primary-800 truncate">
                  Meister Manager
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              {user && (
                <>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-primary-800">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs text-primary-500">{user.email}</p>
                      </div>
                      {isMaster && (
                        <div className="flex items-center gap-1" title="Usuario Master">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-600">Master</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Enlace de administración para usuarios master */}
                  {isMaster && (
                    <>
                      {/* Versión desktop */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin')}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border border-yellow-200 hidden sm:flex"
                        title="Panel de Administración Master"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                      
                      {/* Versión móvil */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin')}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border border-yellow-200 sm:hidden"
                        title="Panel Master"
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isProjectPage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // This will be handled by the project page
                        const event = new CustomEvent('toggleProjectSettings');
                        window.dispatchEvent(event);
                      }}
                      className="text-primary-600 hover:text-primary-800 hidden sm:flex"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configuración
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Ajustes de cuenta"
                    onClick={() => setShowAccountSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center"
                  >
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        currentEmail={user?.email || ''}
        currentFullName={user?.user_metadata?.full_name || ''}
        onUpdated={refreshUser}
      />
    </div>
  )
}
