'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  projectName: string
  loading?: boolean
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  projectName, 
  loading = false 
}: ConfirmDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (confirmText === 'ELIMINAR') {
      onConfirm()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  const isConfirmValid = confirmText === 'ELIMINAR'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Estás a punto de eliminar el proyecto <strong>"{projectName}"</strong>.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">Esta acción:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Eliminará TODOS los datos del proyecto</li>
                <li>• No se puede deshacer</li>
                <li>• Eliminará ingresos, gastos e inventario</li>
                <li>• Eliminará todos los miembros del proyecto</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700">
                Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
              </label>
              <Input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={!isConfirmValid || loading}
              loading={loading}
              className="sm:order-2"
            >
              {loading ? 'Eliminando...' : 'Eliminar Proyecto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
