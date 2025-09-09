'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, DollarSign, Receipt, Settings, ArrowLeft, BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AddBalanceForm } from '@/components/balances/AddBalanceForm'
import { BalancesList } from '@/components/balances/BalancesList'
import { AddIncomeForm } from '@/components/income/AddIncomeForm'
import { IncomeList } from '@/components/income/IncomeList'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { ExpenseChart } from '@/components/charts/ExpenseChart'
import { BalanceChart } from '@/components/charts/BalanceChart'
import { projectsService } from '@/lib/projects'
import { balancesService, type Balance } from '@/lib/balances'
import { incomeService, type Income } from '@/lib/income'
import { expensesService, type Expense } from '@/lib/expenses'
import { formatCurrency } from '@/lib/currency'
import { auth } from '@/lib/auth'

interface ProjectPageClientProps {
  projectId: string
  initialTab?: string
}

export default function ProjectPageClient({ projectId, initialTab }: ProjectPageClientProps) {
  const router = useRouter()

  const [project, setProject] = useState<any>(null)
  const [balances, setBalances] = useState<Balance[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab || 'overview')
  const [showAddBalance, setShowAddBalance] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  useEffect(() => {
    const handleSettingsToggle = () => {
      handleTabChange('settings')
    }
    window.addEventListener('toggleProjectSettings', handleSettingsToggle)
    return () => window.removeEventListener('toggleProjectSettings', handleSettingsToggle)
  }, [activeTab])

  const handleTabChange = (tab: string) => {
    if (activeTab === tab) {
      setActiveTab('overview')
    } else {
      setActiveTab(tab)
    }
    setShowAddBalance(false)
    setShowAddIncome(false)
    setShowAddExpense(false)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        setUser(user)

        const [projectData, balancesData, incomeData, expensesData] = await Promise.all([
          projectsService.getProject(projectId),
          balancesService.getProjectBalances(projectId),
          incomeService.getProjectIncome(projectId),
          expensesService.getProjectExpenses(projectId),
        ])

        setProject(projectData)
        setBalances(balancesData)
        setIncome(incomeData)
        setExpenses(expensesData)
      } catch (error) {
        console.error('Error loading project data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId])

  const handleBalanceUpdate = async () => {
    try {
      const balancesData = await balancesService.getProjectBalances(projectId)
      setBalances(balancesData)
      setShowAddBalance(false)
    } catch (error) {
      console.error('Error updating balances:', error)
    }
  }

  const handleIncomeUpdate = async () => {
    try {
      const incomeData = await incomeService.getProjectIncome(projectId)
      setIncome(incomeData)
      setShowAddIncome(false)
    } catch (error) {
      console.error('Error updating income:', error)
    }
  }

  const handleExpenseUpdate = async () => {
    try {
      const expensesData = await expensesService.getProjectExpenses(projectId)
      setExpenses(expensesData)
      setShowAddExpense(false)
    } catch (error) {
      console.error('Error updating expenses:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Proyecto no encontrado</h2>
        <p className="text-gray-600 mt-2">El proyecto que buscas no existe o no tienes acceso a él.</p>
      </div>
    )
  }

  const totalBalance = balances.reduce((sum, balance) => sum + balance.amount, 0)
  const totalIncome = income.filter(i => i.status === 'approved').reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const calculatedBalance = totalIncome - totalExpenses + totalBalance

  const formatAmount = (amount: number) => {
    const currency = project?.currency || 'COP'
    return formatCurrency(amount, currency as any)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-primary-600 hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Proyectos
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-800 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-primary-600 mb-3">{project.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-500">
            <span>
              Código: <span className="font-mono bg-primary-100 px-2 py-1 rounded">{project.invite_code}</span>
            </span>
            <span>
              Moneda: <span className="font-semibold">{project?.currency || 'COP'}</span>
            </span>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => handleTabChange('income')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'income'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Ingresos ({income.length})
            </button>
            <button
              onClick={() => handleTabChange('balances')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'balances'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Balance Base ({balances.length})
            </button>
            <button
              onClick={() => handleTabChange('expenses')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt className="h-4 w-4 inline mr-2" />
              Gastos ({expenses.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalIncome)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {income.length} ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gastos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {expenses.length} gastos
            </p>
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
            <p className="text-xs text-gray-500 mt-1">
              {calculatedBalance >= 0 ? 'Disponible' : 'Déficit'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {showAddBalance && (
              <AddBalanceForm
                projectId={projectId}
                onSuccess={handleBalanceUpdate}
              />
            )}
            {showAddIncome && (
              <AddIncomeForm
                projectId={projectId}
                onSuccess={handleIncomeUpdate}
              />
            )}
            {showAddExpense && (
              <AddExpenseForm
                projectId={projectId}
                onSuccess={handleExpenseUpdate}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BalanceChart balances={balances} expenses={expenses} />
              <ExpenseChart expenses={expenses} totalExpenses={totalExpenses} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Ingresos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {income.slice(0, 3).map((incomeItem) => (
                    <div key={incomeItem.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-green-600">
                          {formatAmount(incomeItem.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {incomeItem.title}
                        </p>
                        {incomeItem.category && (
                          <p className="text-xs text-gray-400">
                            {incomeItem.category}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(incomeItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {income.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hay ingresos registrados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Gastos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-red-600">
                          -{formatAmount(expense.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.description}
                        </p>
                        {expense.category && (
                          <p className="text-xs text-gray-400">
                            {expense.category}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(expense.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hay gastos registrados</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            {showAddIncome && (
              <AddIncomeForm
                projectId={projectId}
                onSuccess={handleIncomeUpdate}
              />
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Gestión de Ingresos</h2>
              <Button onClick={() => setShowAddIncome(!showAddIncome)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddIncome ? 'Cancelar' : 'Agregar Ingreso'}
              </Button>
            </div>
            <IncomeList
              income={income}
              currentUserId={user?.id || ''}
              onUpdate={handleIncomeUpdate}
            />
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            {showAddBalance && (
              <AddBalanceForm
                projectId={projectId}
                onSuccess={handleBalanceUpdate}
              />
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Balance Base del Proyecto</h2>
              <Button onClick={() => setShowAddBalance(!showAddBalance)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddBalance ? 'Cancelar' : 'Agregar Balance Base'}
              </Button>
            </div>
            <BalancesList
              balances={balances}
              currentUserId={user?.id || ''}
              onUpdate={handleBalanceUpdate}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {showAddExpense && (
              <AddExpenseForm
                projectId={projectId}
                onSuccess={handleExpenseUpdate}
              />
            )}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Gestión de Gastos</h2>
              <Button onClick={() => setShowAddExpense(!showAddExpense)}>
                <Plus className="h-4 w-4 mr-2" />
                {showAddExpense ? 'Cancelar' : 'Agregar Gasto'}
              </Button>
            </div>
            <ExpensesList
              expenses={expenses}
              currentUserId={user?.id || ''}
              onUpdate={handleExpenseUpdate}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración del Proyecto
                </CardTitle>
                <CardDescription>
                  Administra la configuración y opciones del proyecto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Proyecto
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        {project?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código de Invitación
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md font-mono">
                        {project?.invite_code}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Configuración de Moneda</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moneda Actual
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 rounded-md font-semibold text-primary-700">
                          {project?.currency === 'COP' ? 'Peso Colombiano (COP)' : 'Dólar Australiano (AUD)'}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newCurrency = project?.currency === 'COP' ? 'AUD' : 'COP'
                            alert(`Función pendiente: Cambiar a ${newCurrency}`)
                          }}
                        >
                          Cambiar a {project?.currency === 'COP' ? 'AUD' : 'COP'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Cambiar la moneda afectará cómo se muestran los montos en el proyecto
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-red-600">Zona de Peligro</h3>
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <p className="text-sm text-red-700 mb-4">
                      Las siguientes acciones son irreversibles y eliminarán permanentemente los datos.
                    </p>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
                          alert('Función pendiente: Eliminar proyecto')
                        }
                      }}
                    >
                      Eliminar Proyecto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
