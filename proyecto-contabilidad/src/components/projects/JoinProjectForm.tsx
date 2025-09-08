'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { projectsService } from '@/lib/projects'
import { joinProjectSchema, type JoinProjectFormData } from '@/lib/validations'

interface JoinProjectFormProps {
  onSuccess?: () => void
}

export function JoinProjectForm({ onSuccess }: JoinProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinProjectFormData>({
    resolver: zodResolver(joinProjectSchema),
  })

  const onSubmit = async (data: JoinProjectFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const project = await projectsService.joinProject(data.inviteCode.toUpperCase())
      reset()
      onSuccess?.()
      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al unirse al proyecto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Unirse a Proyecto
        </CardTitle>
        <CardDescription>
          Ingresa el código de invitación para unirte a un proyecto existente
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
            <label htmlFor="inviteCode" className="text-sm font-medium">
              Código de Invitación
            </label>
            <Input
              id="inviteCode"
              placeholder="ABC12345"
              className="uppercase"
              maxLength={8}
              error={errors.inviteCode?.message}
              {...register('inviteCode')}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase()
              }}
            />
            <p className="text-xs text-muted-foreground">
              El código debe tener 8 caracteres (letras y números)
            </p>
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Unirse al Proyecto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
