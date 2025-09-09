'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { incomeService } from '@/lib/income'
import { z } from 'zod'

const incomeSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  category: z.string().optional(),
  income_date: z.string().min(1, 'La fecha es requerida'),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface AddIncomeFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddIncomeForm({ projectId, onSuccess }: AddIncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_date: new Date().toISOString().split('T')[0],
    },
  })

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
      })
      
      reset({
        income_date: new Date().toISOString().split('T')[0],
      })
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

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
              Ingresa el monto sin decimales (ej: 100000 se mostrará como $100,000 COP)
            </p>
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
            <label htmlFor="description" className="text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Describe el ingreso..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
