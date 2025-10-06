'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackagePlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// import { useToast } from '@/components/ui/Toast'
import { inventoryService } from '@/lib/inventory'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  // Valor unitario directo (modo por unidad)
  unit_value: z
    .preprocess((v) => {
      if (v === '' || v === null || v === undefined) return undefined
      const s = typeof v === 'string' ? v : String(v)
      const digits = s.replace(/[^0-9]/g, '')
      return digits === '' ? undefined : Number(digits)
    },
      z.number().min(0, 'El valor debe ser positivo').optional()
    ),
  // Valor total del paquete (modo por paquete)
  package_value: z
    .preprocess((v) => {
      if (v === '' || v === null || v === undefined) return undefined
      const s = typeof v === 'string' ? v : String(v)
      const digits = s.replace(/[^0-9]/g, '')
      return digits === '' ? undefined : Number(digits)
    },
      z.number().min(0, 'El valor del paquete debe ser positivo').optional()
    ),
  // Toggle de modo paquete
  use_package: z.boolean().optional(),
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
  const [displayUnitValue, setDisplayUnitValue] = useState('')
  const [displayPackageValue, setDisplayPackageValue] = useState('')
  // Success toast is handled by parent after closing the form

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const usePackage = watch('use_package')
  const initialQty = watch('initial_quantity')
  const packageValue = watch('package_value')
  const computedUnit = usePackage && initialQty && initialQty > 0 && packageValue && packageValue > 0
    ? Math.round(packageValue / initialQty)
    : undefined
  const usePackageReg = register('use_package')
  const unitValueReg = register('unit_value')
  const packageValueReg = register('package_value')

  // Format number with thousands separator (same as income form)
  const formatNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')
    
    // Add thousands separator (dot) for Colombian peso format
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
    
    // Convert back to number for form validation
    const numericValue = parseInt(formattedValue.replace(/\./g, '')) || 0
    setValue('unit_value', numericValue, { shouldValidate: true })
  }

  // Handle package value input change
  const handlePackageValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formattedValue = formatNumber(inputValue)
    setDisplayPackageValue(formattedValue)
    
    // Convert back to number for form validation
    const numericValue = parseInt(formattedValue.replace(/\./g, '')) || 0
    setValue('package_value', numericValue, { shouldValidate: true })
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      // Determinar valor unitario a guardar
      let unitValueToSave: number | null | undefined = data.unit_value
      if (data.use_package) {
        if (!data.initial_quantity || data.initial_quantity <= 0) {
          throw new Error('Para calcular valor unitario desde paquete, ingresa "Ingresar Cantidad inicial" mayor a 0.')
        }
        if (!data.package_value || data.package_value <= 0) {
          throw new Error('Ingresa un "Valor del paquete" mayor a 0 o desactiva el modo paquete.')
        }
        unitValueToSave = data.package_value / data.initial_quantity
      }

      const item = await inventoryService.createItem(projectId, {
        name: data.name,
        description: data.description,
        unit_value: unitValueToSave,
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
      setDisplayUnitValue('')
      setDisplayPackageValue('')
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

          {/* Nombre, Valor (unitario o por paquete), Cantidad a Bodega e Imagen en una fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-center block">Nombre *</label>
              <Input id="name" {...register('name')} error={errors.name?.message} className="text-center" />
            </div>

            <div className="space-y-2">
              {!usePackage ? (
                <>
                  <label htmlFor="unit_value" className="text-sm font-medium text-center block">Valor Unitario (Opcional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                    <input
                      id="unit_value"
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
                  <p className="text-xs text-muted-foreground text-center">
                    Formato automático (ej: 100.000)
                  </p>
                  {errors.unit_value && (
                    <p className="text-sm text-destructive text-center">{errors.unit_value.message}</p>
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="package_value" className="text-sm font-medium text-center block">Valor del paquete</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                    <input
                      id="package_value"
                      type="text"
                      placeholder="100.000"
                      className="flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        textAlign: 'center',
                        paddingLeft: '32px',
                        paddingRight: '32px'
                      }}
                      value={displayPackageValue}
                      onChange={handlePackageValueChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Formato automático (ej: 100.000)
                  </p>
                  {errors.package_value && (
                    <p className="text-sm text-destructive text-center">{errors.package_value.message}</p>
                  )}
                  {computedUnit !== undefined && (
                    <p className="text-xs text-center text-gray-500">Se guardará unitario: ${new Intl.NumberFormat('es-CO').format(computedUnit)}</p>
                  )}
                </>
              )}
              <div className="flex items-center justify-center gap-2 pt-1">
                <input
                  id="use_package"
                  type="checkbox"
                  {...usePackageReg}
                  onChange={(e) => {
                    usePackageReg.onChange(e)
                    // limpiar errores de UI al alternar
                    setError(null)
                    // manejar intercambio de valores entre modos
                    const checked = e.target.checked
                    if (checked) {
                      // Al activar modo paquete: mover valor unitario a valor de paquete
                      const currentUnitValue = watch('unit_value')
                      if (currentUnitValue && currentUnitValue > 0) {
                        setValue('package_value', currentUnitValue)
                        setDisplayPackageValue(displayUnitValue)
                        setValue('unit_value', undefined as any)
                        setDisplayUnitValue('')
                      }
                    } else {
                      // Al desactivar modo paquete: mover valor de paquete a valor unitario
                      const currentPackageValue = watch('package_value')
                      if (currentPackageValue && currentPackageValue > 0) {
                        setValue('unit_value', currentPackageValue)
                        setDisplayUnitValue(displayPackageValue)
                      }
                      setValue('package_value', undefined as any)
                      setDisplayPackageValue('')
                    }
                  }}
                />
                <label htmlFor="use_package" className="text-xs text-gray-600">Usar valor por paquete</label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="initial_quantity" className="text-sm font-medium text-center block">Ingresar Cantidad inicial (Opcional)</label>
              <Input 
                id="initial_quantity" 
                type="number" 
                placeholder="0" 
                className="text-center"
                min="0"
                {...register('initial_quantity')}
              />
              <p className="text-xs text-muted-foreground text-center">
                Esta cantidad se ingresará automáticamente a bodega
              </p>
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
