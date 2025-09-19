'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackagePlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { inventoryService } from '@/lib/inventory'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  initial_quantity: z.coerce.number().min(0, 'La cantidad debe ser positiva').optional(),
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
      
      // Si se especifica cantidad inicial, crear movimiento a bodega
      if (data.initial_quantity && data.initial_quantity > 0) {
        await inventoryService.createMovement(item.id, projectId, {
          quantity: data.initial_quantity,
          from_state: 'externo',
          to_state: 'bodega',
          note: 'Ingreso inicial al inventario'
        })
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

          {/* Nombre, Cantidad a Bodega e Imagen en una fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-center block">Nombre *</label>
              <Input id="name" {...register('name')} error={errors.name?.message} className="text-center" />
            </div>

            <div className="space-y-2">
              <label htmlFor="initial_quantity" className="text-sm font-medium text-center block">Ingresar a Bodega (Opcional)</label>
              <Input 
                id="initial_quantity" 
                type="number" 
                placeholder="0" 
                className="text-center"
                min="0"
                {...register('initial_quantity')}
              />
              {errors.initial_quantity && (
                <p className="text-sm text-destructive text-center">{errors.initial_quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium text-center block">Imagen (Opcional)</label>
              <div className="relative">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('image')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imageFile ? imageFile.name : 'Seleccionar Imagen'}
                </Button>
              </div>
              {imageFile && (
                <p className="text-xs text-green-600 text-center">✓ {imageFile.name}</p>
              )}
            </div>
          </div>


          {/* Descripción en toda la anchura */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-center block">Descripción (Opcional)</label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm text-center ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="Detalles del producto, proveedor, especificaciones técnicas..."
              {...register('description')}
            />
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Agregar Producto
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
