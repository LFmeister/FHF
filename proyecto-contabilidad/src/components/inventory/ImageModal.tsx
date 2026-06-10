'use client'

import { useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { inventoryService } from '@/lib/inventory'
import { useConfirm } from '@/hooks/useConfirm'
import { useLanguage } from '@/context/LanguageContext'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  itemName: string
  itemId: string
  onImageUpdated?: () => void
}

export function ImageModal({ isOpen, onClose, imageUrl, itemName, itemId, onImageUpdated }: ImageModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const confirmDialog = useConfirm()
  const { error: showError } = useToast()
  const { t } = useLanguage()
  const ti = t.inventory

  if (!isOpen) return null

  const handleReplaceImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return
      
      setIsUploading(true)
      try {
        await inventoryService.replaceItemImage(itemId, files[0])
        onImageUpdated?.()
        onClose()
      } catch (error) {
        console.error('Error al reemplazar imagen:', error)
        showError(ti.imgReplaceError)
      } finally {
        setIsUploading(false)
      }
    }
    input.click()
  }

  const handleDeleteImage = async () => {
    const confirmed = await confirmDialog.confirm({
      title: ti.imgDeleteTitle,
      message: ti.imgDeleteMessage,
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      variant: 'danger'
    })

    if (!confirmed) return
    
    setIsDeleting(true)
    try {
      await inventoryService.deleteItemImage(itemId)
      onImageUpdated?.()
      onClose()
    } catch (error) {
      console.error('Error al eliminar imagen:', error)
      showError(ti.imgDeleteError)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[95vh] sm:max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={imageUrl}
            alt={itemName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleReplaceImage}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? t.common.uploading : ti.replaceImageBtn}
          </Button>
          
          <Button
            variant="danger"
            onClick={handleDeleteImage}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t.common.deleting : ti.deleteImageBtn}
          </Button>
        </div>
      </div>
      
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
