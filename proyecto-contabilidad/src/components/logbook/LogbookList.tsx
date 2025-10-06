'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { logbookService, type LogbookEntry } from '@/lib/logbook'
import { Calendar, User, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { permissions, type UserRole } from '@/lib/permissions'
import { useConfirm } from '@/hooks/useConfirm'

interface LogbookListProps {
  entries: LogbookEntry[]
  currentUserId: string
  userRole: UserRole
  onUpdate: () => void
}

export function LogbookList({ entries, currentUserId, userRole, onUpdate }: LogbookListProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { success, error: showError } = useToast()
  const confirmDialog = useConfirm()

  const handleDelete = async (entryId: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Entrada de Bitácora',
      message: '¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })

    if (!confirmed) return

    setDeletingId(entryId)
    try {
      await logbookService.deleteEntry(entryId)
      success('Entrada eliminada exitosamente')
      onUpdate()
    } catch (err) {
      console.error('Error deleting entry:', err)
      showError('Error al eliminar la entrada')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const canDelete = (entry: LogbookEntry) => {
    return entry.user_id === currentUserId || permissions.canManageProject(userRole)
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No hay entradas en la bitácora</p>
            <p className="text-sm mt-1">Comienza a documentar el progreso del proyecto</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const isExpanded = expandedEntry === entry.id
        const hasImages = entry.images && entry.images.length > 0

        return (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 break-words">
                    {entry.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.entry_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {entry.user_name}
                    </span>
                    {hasImages && (
                      <span className="flex items-center gap-1 text-primary-600">
                        <ImageIcon className="h-4 w-4" />
                        {entry.images!.length} imagen(es)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasImages && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {canDelete(entry) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              {entry.description && (
                <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                  {entry.description}
                </div>
              )}

              {/* Images */}
              {hasImages && isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {entry.images!.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(image.image_url)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.caption || 'Imagen de bitácora'}
                          className="w-full h-32 object-contain rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors bg-gray-50"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
      
    </div>
  )
}
