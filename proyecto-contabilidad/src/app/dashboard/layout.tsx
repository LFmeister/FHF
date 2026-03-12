'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Settings, Menu, X, LayoutDashboard, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AccountSettingsModal } from '@/components/account/AccountSettingsModal'
import { auth } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isProjectPage = pathname?.includes('/project') || false
  const isDashboardRoot = pathname === '/dashboard'

  useEffect(() => {
    const checkUser = async () => {
      const { user, error } = await auth.getCurrentUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      } else if (session?.user) {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-140px] top-[60px] h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_55%)]" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-md">
                <span className="text-xs font-bold text-white">MM</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 sm:text-base">Meister Manager</p>
                <p className="hidden text-xs text-slate-500 sm:block">Panel financiero colaborativo</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Abrir menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isDashboardRoot
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isProjectPage
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="h-4 w-4" />
                Proyectos
              </Link>

              {isProjectPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('toggleProjectSettings')
                    window.dispatchEvent(event)
                  }}
                  className="text-primary-700 hover:text-primary-900"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuracion
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
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-slate-200 py-3 md:hidden">
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    isDashboardRoot ? 'bg-primary-100 text-primary-800' : 'text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    isProjectPage ? 'bg-primary-100 text-primary-800' : 'text-slate-700'
                  }`}
                >
                  <FolderKanban className="h-4 w-4" />
                  Proyectos
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAccountSettings(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Ajustes de cuenta
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
                {user && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="relative mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8">{children}</main>

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
