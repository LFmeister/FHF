'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { inventoryService } from '@/lib/inventory'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddItemFormProps {
  projectId: string
  onSuccess?: () => void
}

export function AddItemForm({ projectId, onSuccess }: AddItemFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const item = await inventoryService.createItem(projectId, {
        name: data.name,
        description: data.description,
      })
      if (imageFile) {
        await inventoryService.replaceItemImage(item.id, imageFile)
      }
      reset()
      setImageFile(null)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al crear el producto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5" />
          Agregar Producto
        </CardTitle>
        <CardDescription>
          Crea un nuevo producto en el inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nombre *</label>
              <Input id="name" {...register('name')} error={errors.name?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium">Descripción (opcional)</label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Detalles del producto, proveedor, etc."
                {...register('description')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="image" className="text-sm font-medium">Imagen (opcional)</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500">Solo se guardará una imagen y se usará como miniatura.</p>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Agregar Producto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
