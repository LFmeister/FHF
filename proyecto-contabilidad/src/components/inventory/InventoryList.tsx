'use client'

import { useMemo, useState } from 'react'
import { Upload, Image as ImageIcon, ChevronDown, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inventoryService, type InventoryItem, type InventoryFile } from '@/lib/inventory'
import { ImageModal } from './ImageModal'

interface InventoryItemWithQty extends InventoryItem {
  files?: InventoryFile[]
  qty_bodega: number
  qty_uso: number
  qty_gastado: number
}

interface InventoryListProps {
  projectId: string
  items: InventoryItemWithQty[]
  onUpdate?: () => void
}

export function InventoryList({ projectId, items, onUpdate }: InventoryListProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [qtyInputs, setQtyInputs] = useState<Record<string, { add: string; toUse: string; toSpent: string }>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movementsOpen, setMovementsOpen] = useState<Record<string, boolean>>({})
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    imageUrl: string
    itemName: string
    itemId: string
  }>({
    isOpen: false,
    imageUrl: '',
    itemName: '',
    itemId: ''
  })

  const totalByState = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.bodega += item.qty_bodega
        acc.uso += item.qty_uso
        acc.gastado += item.qty_gastado
        return acc
      },
      { bodega: 0, uso: 0, gastado: 0 }
    )
  }, [items])


  const triggerReplaceImage = (itemId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return
      setUploadingFor(itemId)
      try {
        await inventoryService.replaceItemImage(itemId, files[0])
        onUpdate?.()
      } finally {
        setUploadingFor(null)
      }
    }
    input.click()
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    setDeletingId(itemId)
    try {
      await inventoryService.deleteItem(itemId)
      onUpdate?.()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  const getThumbUrl = (item: InventoryItemWithQty) => {
    if (item.thumbnail_url) return item.thumbnail_url
    const firstImage = item.files?.find(f => (f.file_type || '').startsWith('image/'))
    if (firstImage) return inventoryService.getFileUrl(firstImage.file_path)
    return ''
  }

  const openImageModal = (item: InventoryItemWithQty) => {
    const imageUrl = getThumbUrl(item)
    if (imageUrl) {
      setImageModal({
        isOpen: true,
        imageUrl,
        itemName: item.name,
        itemId: item.id
      })
    }
  }

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      itemName: '',
      itemId: ''
    })
  }

  const ensureQtyState = (id: string) => {
    if (!qtyInputs[id]) {
      setQtyInputs(prev => ({ ...prev, [id]: { add: '', toUse: '', toSpent: '' } }))
    }
  }

  const updateQtyInput = (id: string, key: 'add' | 'toUse' | 'toSpent', value: string) => {
    setQtyInputs(prev => ({ ...prev, [id]: { ...(prev[id] || { add: '', toUse: '', toSpent: '' }), [key]: value } }))
  }

  const move = async (
    item: InventoryItemWithQty,
    kind: 'add' | 'toUse' | 'toSpent'
  ) => {
    ensureQtyState(item.id)
    const input = qtyInputs[item.id] || { add: '', toUse: '', toSpent: '' }
    const qtyStr = kind === 'add' ? input.add : kind === 'toUse' ? input.toUse : input.toSpent
    const qty = parseInt(qtyStr, 10)
    if (!qty || qty <= 0) return alert('Ingresa una cantidad válida')

    try {
      if (kind === 'add') {
        await inventoryService.createMovement(item.id, projectId, {
          quantity: qty,
          from_state: 'externo',
          to_state: 'bodega',
        })
      } else if (kind === 'toUse') {
        if (qty > item.qty_bodega) return alert('Cantidad supera lo disponible en bodega')
        await inventoryService.createMovement(item.id, projectId, {
          quantity: qty,
          from_state: 'bodega',
          to_state: 'uso',
        })
      } else {
        if (qty > item.qty_uso) return alert('Cantidad supera lo disponible en uso')
        await inventoryService.createMovement(item.id, projectId, {
          quantity: qty,
          from_state: 'uso',
          to_state: 'gastado',
        })
      }
      onUpdate?.()
      setQtyInputs(prev => ({ ...prev, [item.id]: { add: '', toUse: '', toSpent: '' } }))
    } catch (err: any) {
      alert(err.message || 'Error al registrar movimiento')
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          No hay productos en inventario.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Inventario</CardTitle>
          <CardDescription>Tabla por producto y cantidades por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-xs sm:text-sm border">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-center p-2 border">Producto</th>
                  <th className="text-center p-2 border">En bodega</th>
                  <th className="text-center p-2 border">En uso</th>
                  <th className="text-center p-2 border">Gastado</th>
                  <th className="text-center p-2 border">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const total = item.qty_bodega + item.qty_uso + item.qty_gastado
                  return (
                    <tr key={`sum-${item.id}`} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border text-center">{item.name}</td>
                      <td className="p-2 border text-center">{item.qty_bodega}</td>
                      <td className="p-2 border text-center">{item.qty_uso}</td>
                      <td className="p-2 border text-center">{item.qty_gastado}</td>
                      <td className="p-2 border text-center font-medium">{total}</td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td className="p-2 border text-center text-gray-500" colSpan={5}>Sin datos</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border text-center">Totales</td>
                  <td className="p-2 border text-center">{totalByState.bodega}</td>
                  <td className="p-2 border text-center">{totalByState.uso}</td>
                  <td className="p-2 border text-center">{totalByState.gastado}</td>
                  <td className="p-2 border text-center">{totalByState.bodega + totalByState.uso + totalByState.gastado}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>


      <div className="space-y-4">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div 
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden transition-colors flex-shrink-0 ${
                    getThumbUrl(item) ? 'cursor-pointer hover:border-gray-300' : ''
                  }`}
                  onClick={() => getThumbUrl(item) && openImageModal(item)}
                  title={getThumbUrl(item) ? "Click para ver imagen completa" : "Sin imagen"}
                >
                  {getThumbUrl(item) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getThumbUrl(item)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                        <span><strong>Bodega:</strong> {item.qty_bodega}</span>
                        <span><strong>En uso:</strong> {item.qty_uso}</span>
                        <span><strong>Gastado:</strong> {item.qty_gastado}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setMovementsOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                        <span className="hidden sm:inline">{movementsOpen[item.id] ? 'Ocultar movimientos' : 'Movimientos'}</span>
                        <span className="sm:hidden text-xs">{movementsOpen[item.id] ? 'Ocultar' : 'Movimientos'}</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => triggerReplaceImage(item.id)} disabled={uploadingFor === item.id}>
                        <Upload className="h-4 w-4 sm:mr-1" /> 
                        <span className="hidden sm:inline">{uploadingFor === item.id ? 'Subiendo...' : 'Reemplazar imagen'}</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded[item.id] ? 'rotate-180' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Movements (toggle) */}
                  {movementsOpen[item.id] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      <div className="p-3 rounded-lg border bg-gray-50">
                        <p className="text-xs font-medium text-gray-600 mb-2">Ingresar a bodega</p>
                        <div className="flex gap-2">
                          <Input type="number" min={1} placeholder="Cantidad" value={(qtyInputs[item.id]?.add) || ''} onChange={e => updateQtyInput(item.id, 'add', e.target.value)} />
                          <Button size="sm" onClick={() => move(item, 'add')}>Ingresar</Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border bg-gray-50">
                        <p className="text-xs font-medium text-gray-600 mb-2">Mover a En uso</p>
                        <div className="flex gap-2">
                          <Input type="number" min={1} max={item.qty_bodega} placeholder={`Max ${item.qty_bodega}`} value={(qtyInputs[item.id]?.toUse) || ''} onChange={e => updateQtyInput(item.id, 'toUse', e.target.value)} />
                          <Button size="sm" onClick={() => move(item, 'toUse')}>Mover</Button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border bg-gray-50">
                        <p className="text-xs font-medium text-gray-600 mb-2">Marcar Gastado</p>
                        <div className="flex gap-2">
                          <Input type="number" min={1} max={item.qty_uso} placeholder={`Max ${item.qty_uso}`} value={(qtyInputs[item.id]?.toSpent) || ''} onChange={e => updateQtyInput(item.id, 'toSpent', e.target.value)} />
                          <Button size="sm" onClick={() => move(item, 'toSpent')}>Gastar</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Files Preview */}
                  {expanded[item.id] && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {item.files?.map(file => (
                        <div key={file.id} className="border rounded-md overflow-hidden bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {file.file_type?.startsWith('image/') ? (
                            <img src={inventoryService.getFileUrl(file.file_path)} alt={file.file_name} className="w-full h-28 object-cover" />
                          ) : (
                            <div className="h-28 flex items-center justify-center text-xs text-gray-500 p-2">
                              {file.file_name}
                            </div>
                          )}
                          <div className="p-2 text-xs text-gray-600 truncate" title={file.file_name}>{file.file_name}</div>
                        </div>
                      ))}
                      {(!item.files || item.files.length === 0) && (
                        <div className="col-span-full text-xs text-gray-500">Sin archivos</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de imagen */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageUrl={imageModal.imageUrl}
        itemName={imageModal.itemName}
        itemId={imageModal.itemId}
        onImageUpdated={onUpdate}
      />
    </div>
  )
}
