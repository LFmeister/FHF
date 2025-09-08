'use client'

import { useState, useEffect } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { expensesService } from '@/lib/expenses'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: {
    id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
  } | null
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (isOpen && file) {
      loadFileUrl()
    } else {
      setFileUrl(null)
      setError(null)
      setZoom(100)
      setRotation(0)
    }
  }, [isOpen, file])

  const loadFileUrl = async () => {
    if (!file) return
    
    setLoading(true)
    setError(null)
    
    try {
      const url = await expensesService.getFileUrl(file.file_path)
      setFileUrl(url)
    } catch (err) {
      setError('Error al cargar el archivo')
      console.error('Error loading file:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file || !fileUrl) return
    
    try {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const isImage = file?.file_type.startsWith('image/')
  const isPdf = file?.file_type.includes('pdf')
  const isVideo = file?.file_type.startsWith('video/')

  if (!isOpen || !file) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-6xl max-h-screen bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex-1">
            <h3 className="text-lg font-semibold truncate">{file.file_name}</h3>
            <p className="text-sm text-gray-500">
              {file.file_type} • {formatFileSize(file.file_size)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(300, zoom + 25))}
                  disabled={zoom >= 300}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 h-[calc(100vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando archivo...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadFileUrl}>Reintentar</Button>
              </div>
            </div>
          )}

          {fileUrl && !loading && !error && (
            <div className="flex items-center justify-center h-full">
              {isImage && (
                <img
                  src={fileUrl}
                  alt={file.file_name}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
              )}

              {isPdf && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={file.file_name}
                />
              )}

              {isVideo && (
                <video
                  src={fileUrl}
                  controls
                  className="max-w-full max-h-full"
                  style={{ maxHeight: '80vh' }}
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              )}

              {!isImage && !isPdf && !isVideo && (
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 mb-4">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
