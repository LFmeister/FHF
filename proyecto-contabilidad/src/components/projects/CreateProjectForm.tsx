'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations'
import { projectsService } from '@/lib/projects'

interface CreateProjectFormProps {
  onSuccess?: () => void
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      currency: 'COP'
    }
  })

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      setLoading(true)
      setError('')

      const project = await projectsService.createProject(data)
      
      reset()
      onSuccess?.()
      router.push(`/dashboard/project?id=${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-lg">
        <CardTitle className="text-xl">Crear Nuevo Proyecto</CardTitle>
        <CardDescription className="text-primary-100">
          Crea un proyecto para gestionar balances y gastos colaborativamente
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-primary-800 mb-2">
              Nombre del Proyecto
            </label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Ej: Viaje a Europa 2024"
              className="border-primary-200 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-primary-800 mb-2">
              Descripción (Opcional)
            </label>
            <Input
              id="description"
              type="text"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Descripción del proyecto..."
              className="border-primary-200 focus:border-primary-500"
            />
          </div>

          <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-700">
              <strong>Moneda:</strong> Peso Colombiano (COP) por defecto. Podrás cambiar a Dólar Australiano (AUD) desde la configuración del proyecto.
            </p>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Crear Proyecto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
