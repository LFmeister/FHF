'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { logbookService } from '@/lib/logbook'
import { ImagePlus, X, Upload } from 'lucide-react'

const logbookSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  entry_date: z.string().optional()
})

type LogbookFormData = z.infer<typeof logbookSchema>

interface AddLogbookEntryFormProps {
  projectId: string
  onSuccess: () => void
}

export function AddLogbookEntryForm({ projectId, onSuccess }: AddLogbookEntryFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const { success: showSuccess, error: showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LogbookFormData>({
    resolver: zodResolver(logbookSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0]
    }
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/')
      if (!isValid) {
        showError(`${file.name} no es una imagen válida`)
      }
      return isValid
    })

    // Create previews
    const newPreviews: string[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setSelectedImages(prev => [...prev, ...validFiles])
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: LogbookFormData) => {
    setLoading(true)
    try {
      await logbookService.createEntry({
        project_id: projectId,
        title: data.title,
        description: data.description,
        entry_date: data.entry_date,
        images: selectedImages
      })

      reset()
      setSelectedImages([])
      setImagePreviews([])
      onSuccess()
    } catch (error) {
      console.error('Error creating logbook entry:', error)
      showError('Error al crear la entrada de bitácora')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5" />
          Nueva Entrada de Bitácora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title, Date, and Image Upload in one row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {/* Title */}
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-center mb-1">
                Título *
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                placeholder="Ej: Avance en construcción"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1 text-center">{errors.title.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-center mb-1">
                Fecha
              </label>
              <input
                type="date"
                {...register('entry_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                style={{ 
                  paddingLeft: '40px',
                  paddingRight: '40px'
                }}
              />
            </div>

            {/* Image Upload Button */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-center mb-1">
                Imágenes (Opcional)
              </label>
              <input
                id="logbook-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('logbook-images')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedImages.length > 0 
                  ? `${selectedImages.length} seleccionada(s)` 
                  : 'Seleccionar Imágenes'}
              </Button>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 sm:h-28 object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-center mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-center"
              placeholder="Describe los avances, observaciones o detalles importantes..."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Guardando...' : 'Guardar Entrada'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
