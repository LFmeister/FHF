'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { logbookService } from '@/lib/logbook'
import { ImagePlus, X, UploadCloud, CalendarDays, FileText } from 'lucide-react'

const logbookSchema = z.object({
  title: z.string().min(3, 'El titulo debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  entry_date: z.string().optional(),
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
  const { error: showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LogbookFormData>({
    resolver: zodResolver(logbookSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const valid = file.type.startsWith('image/')
      if (!valid) showError(`${file.name} no es una imagen valida`)
      return valid
    })

    const newPreviews: string[] = []
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setSelectedImages((prev) => [...prev, ...validFiles])
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: LogbookFormData) => {
    setLoading(true)
    try {
      await logbookService.createEntry({
        project_id: projectId,
        title: data.title,
        description: data.description,
        entry_date: data.entry_date,
        images: selectedImages,
      })

      reset()
      setSelectedImages([])
      setImagePreviews([])
      onSuccess()
    } catch (error) {
      console.error('Error creating logbook entry:', error)
      showError('Error al crear la entrada de bitacora')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50 px-5 py-4 sm:px-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          <ImagePlus className="h-3.5 w-3.5" />
          Nueva entrada
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">Registrar avance en bitacora</h3>
        <p className="mt-1 text-sm text-slate-600">Documenta hitos, observaciones y evidencias fotograficas.</p>
      </div>

      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Titulo *</label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('title')}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  placeholder="Ej: avance de instalacion, entrega parcial, visita tecnica"
                />
              </div>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Fecha</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  {...register('entry_date')}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Descripcion</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              placeholder="Describe lo realizado, problemas encontrados, proximo paso, responsables..."
            />
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-slate-700">Imagenes de respaldo (opcional)</label>
              <input id="logbook-images" type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logbook-images')?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Cargar imagenes
              </Button>
            </div>
            <p className="text-xs text-slate-500">Formatos recomendados: JPG, PNG, WEBP.</p>

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover sm:h-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-rose-600 p-1 text-white opacity-0 shadow transition group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={loading} className="min-w-[180px]">
              {loading ? 'Guardando...' : 'Guardar entrada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
