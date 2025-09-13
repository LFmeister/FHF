'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { incomeService } from '@/lib/income'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const incomeSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  category: z.string().optional(),
  income_date: z.string().min(1, 'La fecha es requerida'),
  performed_by: z.string().min(1, 'El usuario que realizó la transacción es requerido'),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface AddIncomeFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddIncomeForm({ projectId, onSuccess }: AddIncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user.id)
        }

        // Get project members
        const membersData = await projectsService.getProjectMembers(projectId)
        setMembers(membersData)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [projectId])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_date: new Date().toISOString().split('T')[0],
    },
  })

  // Set current user as default when data loads
  const performedBy = watch('performed_by')
  useEffect(() => {
    if (!performedBy && currentUser) {
      setValue('performed_by', currentUser)
    }
  }, [currentUser, performedBy, setValue, members])

  const onSubmit = async (data: IncomeFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await incomeService.createIncome(projectId, {
        title: data.title,
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        income_date: data.income_date,
        performed_by: data.performed_by,
      })
      
      reset({
        income_date: new Date().toISOString().split('T')[0],
      })
      // Keep current user as default after reset
      if (currentUser) {
        setValue('performed_by', currentUser)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el ingreso')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Agregar Ingreso
        </CardTitle>
        <CardDescription>
          Registra un nuevo ingreso para el proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Título y Categoría lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título *
              </label>
              <Input
                id="title"
                placeholder="Ej: Pago de cliente, Venta de producto..."
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Categoría (Opcional)
              </label>
              <Input
                id="category"
                placeholder="Ej: Ventas, Servicios, Inversión..."
                {...register('category')}
              />
            </div>
          </div>

          {/* Monto, Fecha y Usuario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="100000"
                  className="pl-8"
                  error={errors.amount?.message}
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sin decimales (ej: 100000)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="income_date" className="text-sm font-medium">
                Fecha *
              </label>
              <Input
                id="income_date"
                type="date"
                error={errors.income_date?.message}
                {...register('income_date')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="performed_by" className="text-sm font-medium">
                Realizado por *
              </label>
              <Controller
                name="performed_by"
                control={control}
                render={({ field }) => (
                  <select
                    id="performed_by"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={(field.value && field.value !== '') ? field.value : (currentUser || '')}
                    onChange={field.onChange}
                  >
                    <option value="">Seleccionar usuario</option>
                    {currentUser && !members.some(m => m.user_id === currentUser) && (
                      <option value={currentUser}>Tú</option>
                    )}
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.user?.full_name || member.user?.email || 'Sin nombre'}
                        {member.user_id === currentUser && ' (Tú)'}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.performed_by && (
                <p className="text-sm text-destructive">{errors.performed_by.message}</p>
              )}
            </div>
          </div>

          {/* Registrado por */}
          <div className="bg-gray-50 p-3 rounded-md border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Registrado por:</span>
              <span>
                {members.find(m => m.user_id === currentUser)?.user?.full_name || 
                 members.find(m => m.user_id === currentUser)?.user?.email || 
                 'Usuario actual'}
              </span>
            </div>
          </div>

          {/* Descripción en toda la anchura */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Describe el ingreso, fuente, detalles adicionales..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              {...register('description')}
            />
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Agregar Ingreso
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
