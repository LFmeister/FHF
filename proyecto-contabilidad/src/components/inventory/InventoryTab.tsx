'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Plus, Boxes } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

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

  // Sugerencias de búsqueda
  const suggestions = React.useMemo(() => {
    const names = Array.from(new Set(items.map(i => i.name)))
    if (!searchQuery) return names.slice(0, 8)
    const q = searchQuery.toLowerCase()
    return names.filter(n => n.toLowerCase().includes(q)).slice(0, 8)
  }, [items, searchQuery])

  // Filtrar items por búsqueda
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter(i => i.name.toLowerCase().includes(q))
  }, [items, searchQuery])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Boxes className="h-5 w-5" /> Inventario
        </h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:flex-1 sm:justify-end">
          {/* Buscador */}
          <div ref={searchRef} className="relative w-full sm:max-w-xs">
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onMouseDown={() => { setSearchQuery(name); setShowSuggestions(false) }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setShowSuggestions(false) }}>
                Limpiar
              </Button>
            )}
            
            {permissions.canEdit(userRole) && (
              <Button onClick={() => setShowAdd(!showAdd)} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{showAdd ? 'Cancelar' : 'Agregar Producto'}</span>
                <span className="sm:hidden">{showAdd ? 'Cancelar' : 'Agregar'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddItemForm projectId={projectId} onSuccess={() => { setShowAdd(false); load() }} />
      )}

      <InventoryList projectId={projectId} items={filteredItems as any} onUpdate={load} />
    </div>
  )
}
