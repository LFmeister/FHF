'use client'

import { useEffect, useState } from 'react'
import { Plus, Boxes } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { inventoryService } from '@/lib/inventory'
import { AddItemForm } from './AddItemForm'
import { InventoryList } from './InventoryList'
import { permissions, type UserRole } from '@/lib/permissions'

interface InventoryTabProps {
  projectId: string
  userRole: UserRole
}

export function InventoryTab({ projectId, userRole }: InventoryTabProps) {
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [items, setItems] = useState<any[]>([])

  const load = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getItemsWithQuantities(projectId)
      setItems(data)
    } catch (e) {
      console.error('Error loading inventory:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Boxes className="h-5 w-5" /> Inventario
        </h2>
        {permissions.canEdit(userRole) && (
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-2" />
            {showAdd ? 'Cancelar' : 'Agregar Producto'}
          </Button>
        )}
      </div>

      {showAdd && (
        <AddItemForm projectId={projectId} onSuccess={() => { setShowAdd(false); load() }} />
      )}

      <InventoryList projectId={projectId} items={items as any} onUpdate={load} />
    </div>
  )
}
