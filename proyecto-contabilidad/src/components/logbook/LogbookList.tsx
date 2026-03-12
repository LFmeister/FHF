'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { logbookService, type LogbookEntry } from '@/lib/logbook'
import {
  Calendar,
  User,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Search,
  Filter,
  Rows,
  GalleryHorizontal,
} from 'lucide-react'
import { permissions, type UserRole } from '@/lib/permissions'
import { useConfirm } from '@/hooks/useConfirm'

interface LogbookListProps {
  entries: LogbookEntry[]
  currentUserId: string
  userRole: UserRole
  onUpdate: () => void
}

type EntryFilter = 'all' | 'mine' | 'with-images'

export function LogbookList({ entries, currentUserId, userRole, onUpdate }: LogbookListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all')
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})
  const { success, error: showError } = useToast()
  const confirmDialog = useConfirm()

  const canDelete = (entry: LogbookEntry) => {
    return entry.user_id === currentUserId || permissions.canManageProject(userRole)
  }

  const filteredEntries = useMemo(() => {
    const search = searchValue.trim().toLowerCase()
    return [...entries]
      .filter((entry) => {
        if (entryFilter === 'mine' && entry.user_id !== currentUserId) return false
        if (entryFilter === 'with-images' && (!entry.images || entry.images.length === 0)) return false

        if (!search) return true
        const haystack = `${entry.title || ''} ${entry.description || ''} ${entry.user_name || ''}`.toLowerCase()
        return haystack.includes(search)
      })
      .sort((a, b) => {
        const dateA = new Date(a.entry_date || a.created_at).getTime()
        const dateB = new Date(b.entry_date || b.created_at).getTime()
        return dateB - dateA
      })
  }, [entries, entryFilter, searchValue, currentUserId])

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, LogbookEntry[]>()

    filteredEntries.forEach((entry) => {
      const key = toDateKey(entry.entry_date || entry.created_at)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(entry)
    })

    return Array.from(groups.entries()).map(([key, data]) => ({
      key,
      label: formatGroupDate(key),
      data,
    }))
  }, [filteredEntries])

  const totalImages = useMemo(
    () => filteredEntries.reduce((acc, entry) => acc + (entry.images?.length || 0), 0),
    [filteredEntries]
  )

  const handleDelete = async (entryId: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar entrada',
      message: 'Esta accion es permanente. Deseas continuar?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    })

    if (!confirmed) return

    setDeletingId(entryId)
    try {
      await logbookService.deleteEntry(entryId)
      success('Entrada eliminada correctamente')
      onUpdate()
    } catch (err) {
      console.error('Error deleting entry:', err)
      showError('No fue posible eliminar la entrada')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (entryId: string) => {
    setExpandedEntries((prev) => ({ ...prev, [entryId]: !prev[entryId] }))
  }

  if (entries.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white">
        <CardContent className="py-14">
          <div className="flex flex-col items-center justify-center text-slate-500">
            <GalleryHorizontal className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-lg font-semibold text-slate-800">Bitacora vacia</p>
            <p className="mt-1 text-sm">Comienza a documentar avances del proyecto.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar en bitacora</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  placeholder="Titulo, descripcion o responsable"
                />
              </div>
            </div>

            <div className="md:w-56">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Filtro</label>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={entryFilter}
                  onChange={(e) => setEntryFilter(e.target.value as EntryFilter)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                >
                  <option value="all">Todos los registros</option>
                  <option value="mine">Solo mis entradas</option>
                  <option value="with-images">Con imagenes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Entradas</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{filteredEntries.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Con imagenes</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {filteredEntries.filter((entry) => (entry.images?.length || 0) > 0).length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Imagenes</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalImages}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {groupedEntries.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200 bg-white">
          <CardContent className="py-14 text-center">
            <p className="text-lg font-semibold text-slate-800">Sin resultados</p>
            <p className="mt-1 text-sm text-slate-600">Ajusta el filtro o la busqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedEntries.map((group) => (
            <section key={group.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{group.label}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <Rows className="h-3.5 w-3.5" />
                  {group.data.length} entradas
                </span>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.data.map((entry) => {
                  const hasImages = Boolean(entry.images && entry.images.length > 0)
                  const isExpanded = Boolean(expandedEntries[entry.id])

                  return (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{entry.title}</h4>
                        {canDelete(entry) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Eliminar entrada"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(entry.entry_date)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                          <User className="h-3.5 w-3.5" />
                          {entry.user_name || 'Usuario'}
                        </span>
                      </div>

                      {entry.description && (
                        <p className="line-clamp-4 text-sm leading-relaxed text-slate-700">{entry.description}</p>
                      )}

                      {hasImages && (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {entry.images!.length} imagen(es)
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => toggleExpand(entry.id)}>
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 h-3.5 w-3.5" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-3.5 w-3.5" />
                                  Ver
                                </>
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="grid grid-cols-2 gap-2">
                              {entry.images!.slice(0, 4).map((image) => (
                                <button
                                  key={image.id}
                                  type="button"
                                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                  onClick={() => setSelectedImage(image.image_url)}
                                >
                                  <img
                                    src={image.image_url}
                                    alt={image.caption || 'Imagen de bitacora'}
                                    className="h-20 w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-5xl">
            <img src={selectedImage} alt="Imagen ampliada" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 rounded-full bg-white p-2 text-slate-900 transition hover:bg-slate-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

function toDateKey(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatGroupDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Hoy'
  if (date.getTime() === yesterday.getTime()) return 'Ayer'

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
