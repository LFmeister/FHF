'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { balancesService } from '@/lib/balances'
import { balanceSchema, type BalanceFormData } from '@/lib/validations'

interface AddBalanceFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddBalanceForm({ projectId, onSuccess }: AddBalanceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
  })

  const onSubmit = async (data: BalanceFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await balancesService.createBalance(projectId, {
        amount: Number(data.amount),
        description: data.description
      })
      
      reset()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el balance')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Agregar Balance
        </CardTitle>
        <CardDescription>
          Registra un nuevo balance inicial o ajuste al proyecto
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
            <label htmlFor="amount" className="text-sm font-medium">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-8"
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Ej: Balance inicial del proyecto, Aporte adicional..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
            />
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Agregar Balance
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
