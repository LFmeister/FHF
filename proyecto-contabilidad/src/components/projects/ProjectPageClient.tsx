'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Receipt, Settings, ArrowLeft, BarChart3, TrendingUp, Users, Boxes, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AddIncomeForm } from '@/components/income/AddIncomeForm'
import { IncomeList } from '@/components/income/IncomeList'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { InventoryTab } from '@/components/inventory/InventoryTab'
import { ExpenseChart } from '@/components/charts/ExpenseChart'
import { IncomeChart } from '@/components/charts/IncomeChart'
import { InventoryChart } from '@/components/charts/InventoryChart'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { PopupModal } from '@/components/ui/PopupModal'
import { projectsService } from '@/lib/projects'
import { incomeService, type Income } from '@/lib/income'
import { expensesService, type Expense } from '@/lib/expenses'
import { inventoryService } from '@/lib/inventory'
import { formatCurrency } from '@/lib/currency'
import { auth } from '@/lib/auth'
import { permissions, type UserRole } from '@/lib/permissions'
import { ProjectMembers } from '@/components/projects/ProjectMembers'
import { useToast } from '@/components/ui/Toast'
import { AddLogbookEntryForm } from '@/components/logbook/AddLogbookEntryForm'
import { LogbookList } from '@/components/logbook/LogbookList'
import { logbookService, type LogbookEntry } from '@/lib/logbook'

interface ProjectPageClientProps {
  projectId: string
  initialTab?: string
}

export default function ProjectPageClient({ projectId, initialTab }: ProjectPageClientProps) {
  const router = useRouter()
  const { success: showSuccess } = useToast()

  const [project, setProject] = useState<any>(null)
  const [income, setIncome] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole>('view')
  const [deletingProject, setDeletingProject] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab || 'overview')
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddLogbookEntry, setShowAddLogbookEntry] = useState(false)

  useEffect(() => {
    const handleSettingsToggle = () => {
      setActiveTab('settings')
    }
    window.addEventListener('toggleProjectSettings', handleSettingsToggle)
    return () => window.removeEventListener('toggleProjectSettings', handleSettingsToggle)
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab((prev) => (prev === tab ? 'overview' : tab))
    setShowAddIncome(false)
    setShowAddExpense(false)
    setShowAddLogbookEntry(false)
  }

  const openIncomeModal = () => {
    setShowAddExpense(false)
    setShowAddLogbookEntry(false)
    setShowAddIncome(true)
  }

  const openExpenseModal = () => {
    setShowAddIncome(false)
    setShowAddLogbookEntry(false)
    setShowAddExpense(true)
  }

  const openLogbookModal = () => {
    setShowAddIncome(false)
    setShowAddExpense(false)
    setShowAddLogbookEntry(true)
  }

  const handleDeleteProject = () => {
    if (!permissions.canManageProject(userRole)) {
      alert('No tienes permisos para eliminar este proyecto')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDeleteProject = async () => {
    setDeletingProject(true)

    try {
      await projectsService.deleteProject(projectId)
      setShowDeleteModal(false)
      alert('Proyecto eliminado exitosamente')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error al eliminar proyecto:', error)
      alert('Error al eliminar el proyecto. Intenta nuevamente.')
    } finally {
      setDeletingProject(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const [projectData, incomeData, expensesData, role] = await Promise.all([
          projectsService.getProject(projectId),
          incomeService.getProjectIncome(projectId),
          expensesService.getProjectExpenses(projectId),
          projectsService.getUserRole(projectId, user.id),
        ])

        const inventoryData = await inventoryService.getItemsWithQuantities(projectId)
        const logbookData = await logbookService.getProjectEntries(projectId)

        setProject(projectData)
        setIncome(incomeData)
        setExpenses(expensesData)
        setInventoryItems(inventoryData)
        setLogbookEntries(logbookData)
        setUserRole(role as UserRole)
      } catch (error) {
        console.error('Error loading project data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) loadData()
  }, [projectId, router])

  const handleIncomeUpdate = async () => {
    try {
      const incomeData = await incomeService.getProjectIncome(projectId)
      setIncome(incomeData)
      setShowAddIncome(false)
      showSuccess('Ingreso agregado exitosamente')
    } catch (error) {
      console.error('Error updating income:', error)
    }
  }

  const handleExpenseUpdate = async () => {
    try {
      const expensesData = await expensesService.getProjectExpenses(projectId)
      setExpenses(expensesData)
      setShowAddExpense(false)
      showSuccess('Gasto agregado exitosamente')
    } catch (error) {
      console.error('Error updating expenses:', error)
    }
  }

  const handleLogbookUpdate = async () => {
    try {
      const logbookData = await logbookService.getProjectEntries(projectId)
      setLogbookEntries(logbookData)
      setShowAddLogbookEntry(false)
      showSuccess('Entrada de bitacora agregada')
    } catch (error) {
      console.error('Error updating logbook entries:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-14 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Proyecto no encontrado</h2>
        <p className="mt-2 text-slate-600">El proyecto no existe o no tienes acceso.</p>
      </div>
    )
  }

  const totalIncome = income.filter((i) => i.status === 'approved').reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const calculatedBalance = totalIncome - totalExpenses

  const formatAmount = (amount: number) => {
    const currency = project?.currency || 'COP'
    return formatCurrency(amount, currency as any)
  }

  const tabButtonClass = (tab: string) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
      activeTab === tab
        ? 'bg-primary-100 text-primary-800 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-100/90 via-slate-50/95 to-slate-100/70 shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-primary-900 to-emerald-900 p-4 sm:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mb-4 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a proyectos
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">{project.name}</h1>
              {project.description && <p className="mt-2 text-sm text-slate-100 sm:text-base">{project.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-100">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                  Codigo:
                  <span className="ml-1.5 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900">
                    {project.invite_code}
                  </span>
                </span>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                  Moneda: <span className="ml-1 font-semibold">{project?.currency || 'COP'}</span>
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${permissions.getRoleColor(
                    userRole
                  )}`}
                >
                  Tu rol: {permissions.getRoleDisplayName(userRole)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Ingresos aprobados</p>
              <p className="mt-1 text-lg font-bold text-white">{formatAmount(totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Gastos registrados</p>
              <p className="mt-1 text-lg font-bold text-white">{formatAmount(totalExpenses)}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Balance estimado</p>
              <p className="mt-1 text-lg font-bold text-white">{formatAmount(calculatedBalance)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/70 bg-slate-100/70 p-3 sm:p-4">
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleTabChange('overview')} className={tabButtonClass('overview')}>
              <BarChart3 className="h-4 w-4" />
              Resumen
            </button>

            {permissions.canEdit(userRole) && (
              <button onClick={() => handleTabChange('income')} className={tabButtonClass('income')}>
                <TrendingUp className="h-4 w-4" />
                Ingresos ({income.length})
              </button>
            )}

            {permissions.canEdit(userRole) && (
              <button onClick={() => handleTabChange('expenses')} className={tabButtonClass('expenses')}>
                <Receipt className="h-4 w-4" />
                Gastos ({expenses.length})
              </button>
            )}

            {permissions.canEdit(userRole) && (
              <button onClick={() => handleTabChange('inventory')} className={tabButtonClass('inventory')}>
                <Boxes className="h-4 w-4" />
                Inventario
              </button>
            )}

            <button onClick={() => handleTabChange('logbook')} className={tabButtonClass('logbook')}>
              <BookOpen className="h-4 w-4" />
              Bitacora ({logbookEntries.length})
            </button>

            {permissions.canManageMembers(userRole) && (
              <button onClick={() => handleTabChange('members')} className={tabButtonClass('members')}>
                <Users className="h-4 w-4" />
                Miembros
              </button>
            )}

            {permissions.canManageProject(userRole) && (
              <button onClick={() => handleTabChange('settings')} className={tabButtonClass('settings')}>
                <Settings className="h-4 w-4" />
                Configuracion
              </button>
            )}
          </nav>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-200/55 via-slate-100/75 to-primary-100/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {(userRole === 'admin' || userRole === 'owner') && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</div>
                    <p className="mt-1 text-xs text-gray-500">{income.length} ingresos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Gastos Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)}</div>
                    <p className="mt-1 text-xs text-gray-500">{expenses.length} gastos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Balance Final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${calculatedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(calculatedBalance)}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{calculatedBalance >= 0 ? 'Disponible' : 'Deficit'}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className={`grid gap-4 sm:gap-6 ${userRole === 'view' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              <IncomeChart income={income} totalIncome={totalIncome} />
              <ExpenseChart expenses={expenses} totalExpenses={totalExpenses} />
            </div>

            {inventoryItems.length > 0 && (
              <div className="mt-6">
                <InventoryChart items={inventoryItems} showSummary={false} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Gestion de ingresos</h2>
              {permissions.canEdit(userRole) && (
                <Button onClick={openIncomeModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar ingreso
                </Button>
              )}
            </div>

            <IncomeList income={income} currentUserId={user?.id || ''} userRole={userRole} onUpdate={handleIncomeUpdate} />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Gestion de gastos</h2>
              {permissions.canEdit(userRole) && (
                <Button onClick={openExpenseModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar gasto
                </Button>
              )}
            </div>

            <ExpensesList
              expenses={expenses}
              currentUserId={user?.id || ''}
              userRole={userRole}
              onUpdate={handleExpenseUpdate}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <InventoryTab projectId={projectId} userRole={userRole} />
          </div>
        )}

        {activeTab === 'logbook' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bitacora del proyecto</h2>
                  <p className="text-sm text-slate-600">
                    Seguimiento visual de avances, novedades e imagenes de respaldo.
                  </p>
                </div>
                <Button onClick={openLogbookModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar bitacora
                </Button>
              </div>
            </div>

            <LogbookList
              entries={logbookEntries}
              currentUserId={user?.id || ''}
              userRole={userRole}
              onUpdate={handleLogbookUpdate}
            />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <ProjectMembers projectId={projectId} currentUserId={user?.id || ''} userRole={userRole} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuracion del proyecto
                </CardTitle>
                <CardDescription>Administra configuracion y acciones criticas del proyecto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-medium">Informacion general</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Nombre del proyecto</label>
                      <div className="rounded-md bg-gray-50 p-3">{project?.name}</div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Codigo de invitacion</label>
                      <div className="rounded-md bg-gray-50 p-3 font-mono">{project?.invite_code}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-medium">Configuracion de moneda</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Moneda actual</label>
                      <div className="flex items-center gap-4">
                        <div className="rounded-md bg-primary-50 p-3 font-semibold text-primary-700">
                          {project?.currency === 'COP' ? 'Peso Colombiano (COP)' : 'Dolar Australiano (AUD)'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCurrency = project?.currency === 'COP' ? 'AUD' : 'COP'
                            alert(`Funcion pendiente: cambiar a ${newCurrency}`)
                          }}
                        >
                          Cambiar a {project?.currency === 'COP' ? 'AUD' : 'COP'}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Este cambio impacta la forma en que se muestran montos dentro del proyecto.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-medium text-red-600">Zona de peligro</h3>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-4 text-sm text-red-700">
                      Esta accion es irreversible y eliminara permanentemente los datos del proyecto.
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteProject}
                      loading={deletingProject}
                      disabled={deletingProject}
                    >
                      {deletingProject ? 'Eliminando...' : 'Eliminar proyecto'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <PopupModal isOpen={showAddIncome} onClose={() => setShowAddIncome(false)} maxWidth="3xl">
        <AddIncomeForm projectId={projectId} onSuccess={handleIncomeUpdate} />
      </PopupModal>

      <PopupModal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} maxWidth="3xl">
        <AddExpenseForm projectId={projectId} onSuccess={handleExpenseUpdate} />
      </PopupModal>

      <PopupModal isOpen={showAddLogbookEntry} onClose={() => setShowAddLogbookEntry(false)} maxWidth="xl">
        <AddLogbookEntryForm projectId={projectId} onSuccess={handleLogbookUpdate} />
      </PopupModal>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteProject}
        title="Eliminar proyecto"
        projectName={project?.name || ''}
        loading={deletingProject}
      />
    </div>
  )
}
