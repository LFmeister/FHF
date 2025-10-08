'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inventoryService, type InventoryItem } from '@/lib/inventory'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit_value: z
    .preprocess((v) => {
      if (v === '' || v === null || v === undefined) return undefined
      const s = typeof v === 'string' ? v : String(v)
      const digits = s.replace(/[^0-9]/g, '')
      return digits === '' ? undefined : Number(digits)
    },
      z.number().min(0, 'El valor debe ser positivo').optional()
    ),
})

type FormData = z.infer<typeof schema>

interface EditItemModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditItemModal({ item, isOpen, onClose, onSuccess }: EditItemModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayUnitValue, setDisplayUnitValue] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Format number with thousands separator
  const formatNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length > 3) {
      return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    return numbers
  }

  // Handle unit value input change
  const handleUnitValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formattedValue = formatNumber(inputValue)
    setDisplayUnitValue(formattedValue)
    
    const numericValue = parseInt(formattedValue.replace(/\./g, '')) || 0
    setValue('unit_value', numericValue, { shouldValidate: true })
  }

  // Reset form when item changes
  useEffect(() => {
    if (item && isOpen) {
      reset({
        name: item.name,
        description: item.description || '',
        unit_value: item.unit_value || undefined,
      })
      setDisplayUnitValue(
        item.unit_value ? new Intl.NumberFormat('es-CO').format(item.unit_value) : ''
      )
      setError(null)
    }
  }, [item, isOpen, reset])

  const onSubmit = async (data: FormData) => {
    if (!item) return
    
    setIsLoading(true)
    setError(null)
    try {
      await inventoryService.updateItem(item.id, {
        name: data.name,
        description: data.description,
        unit_value: data.unit_value,
      })
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Editar Producto</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium block">
                  Nombre *
                </label>
                <Input
                  id="edit-name"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-unit-value" className="text-sm font-medium block">
                  Valor Unitario (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                  <input
                    id="edit-unit-value"
                    type="text"
                    placeholder="100.000"
                    className="flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      textAlign: 'center',
                      paddingLeft: '32px',
                      paddingRight: '32px'
                    }}
                    value={displayUnitValue}
                    onChange={handleUnitValueChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato automático (ej: 100.000)
                </p>
                {errors.unit_value && (
                  <p className="text-sm text-destructive">{errors.unit_value.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium block">
                Descripción (Opcional)
              </label>
              <textarea
                id="edit-description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Detalles del producto, proveedor, especificaciones técnicas..."
                {...register('description')}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isLoading}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
