'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { balancesService } from '@/lib/balances'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { balanceSchema, type BalanceFormData } from '@/lib/validations'
import { useLanguage } from '@/context/LanguageContext'

interface AddBalanceFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddBalanceForm({ projectId, onSuccess }: AddBalanceFormProps) {
  const { t } = useLanguage()
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
  } = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
  })

  // Set current user as default when data loads
  const performedBy = watch('performed_by')
  useEffect(() => {
    if (!performedBy && currentUser) {
      setValue('performed_by', currentUser)
    }
  }, [currentUser, performedBy, setValue, members])

  const onSubmit = async (data: BalanceFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await balancesService.createBalance(projectId, {
        amount: Number(data.amount),
        description: data.description,
        date: data.date,
        performed_by: data.performed_by
      })

      reset()
      // Keep current user selected after reset
      if (currentUser) {
        setValue('performed_by', currentUser)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.balances.createError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t.balances.addTitle}
        </CardTitle>
        <CardDescription>
          {t.balances.addDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Monto, Fecha y Usuario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                {t.balances.amount}
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
                {t.balances.amountHint}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                {t.balances.dateLabel}
              </label>
              <Input
                id="date"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="performed_by" className="text-sm font-medium">
                {t.balances.performedBy}
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
                    <option value="">{t.balances.selectUser}</option>
                    {currentUser && !members.some(m => m.user_id === currentUser) && (
                      <option value={currentUser}>{t.common.you}</option>
                    )}
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.user?.full_name || member.user?.email || t.common.noName}
                        {member.user_id === currentUser && ` (${t.common.you})`}
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
              <span className="font-medium">{t.balances.registeredBy}</span>
              <span>
                {members.find(m => m.user_id === currentUser)?.user?.full_name ||
                 members.find(m => m.user_id === currentUser)?.user?.email ||
                 t.common.currentUser}
              </span>
            </div>
          </div>

          {/* Descripción mejorada */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              {t.balances.descLabel}
            </label>
            <textarea
              id="description"
              placeholder={t.balances.descPlaceholder}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              {...register('description')}
            />
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            {t.balances.addBtn}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
