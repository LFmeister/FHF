'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { expensesService } from '@/lib/expenses'
import { expenseSchema, type ExpenseFormData } from '@/lib/validations'

interface AddExpenseFormProps {
  projectId: string
  onSuccess?: () => void
}

const EXPENSE_CATEGORIES = [
  'Materiales',
  'Mano de obra',
  'Transporte',
  'Servicios',
  'Equipos',
  'Alimentación',
  'Hospedaje',
  'Combustible',
  'Otros'
]

export function AddExpenseForm({ projectId, onSuccess }: AddExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create expense
      const expense = await expensesService.createExpense(
        projectId,
        {
          amount: Number(data.amount),
          description: data.description,
          category: data.category
        }
      )

      // Upload files if any
      if (files.length > 0) {
        setUploadingFiles(true)
        for (const file of files) {
          await expensesService.uploadExpenseFile(expense.id, file)
        }
      }

      reset()
      setFiles([])
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Error al agregar el gasto')
    } finally {
      setIsLoading(false)
      setUploadingFiles(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Agregar Gasto
        </CardTitle>
        <CardDescription>
          Registra un nuevo gasto con documentos de respaldo
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
              <label htmlFor="category" className="text-sm font-medium">
                Categoría
              </label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('category')}
              >
                <option value="">Seleccionar categoría</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción *
            </label>
            <textarea
              id="description"
              placeholder="Describe el gasto realizado..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Documentos de respaldo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="files" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      Seleccionar archivos
                    </span>
                    <input
                      id="files"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Imágenes, videos, PDF, Word, Excel
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Archivos seleccionados:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading || uploadingFiles}
          >
            {uploadingFiles ? 'Subiendo archivos...' : 'Agregar Gasto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
