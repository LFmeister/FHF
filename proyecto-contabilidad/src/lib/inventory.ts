import { supabase } from './supabase'

export type InventoryState = 'bodega' | 'uso' | 'gastado'

export interface InventoryItem {
  id: string
  project_id: string
  name: string
  description: string | null
  unit_value: number | null
  created_by: string
  created_at: string
  updated_at: string
  thumbnail_url: string | null
  files?: InventoryFile[]
}

export interface InventoryFile {
  id: string
  item_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface InventoryMovement {
  id: string
  item_id: string
  project_id: string
  quantity: number
  from_state: 'externo' | 'bodega' | 'uso'
  to_state: InventoryState
  note: string | null
  created_by: string
  created_at: string
}

const BUCKET = 'inventory-files'

export const inventoryService = {
  // Items
  async createItem(projectId: string, data: { name: string; description?: string | null; unit_value?: number | null }) {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuario no autenticado')

    const { data: inserted, error } = await supabase
      .from('inventory_items')
      .insert({
        project_id: projectId,
        name: data.name,
        description: data.description ?? null,
        unit_value: data.unit_value ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return inserted as InventoryItem
  },

  async getProjectItems(projectId: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        files:inventory_files (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const items = (data || []).map((it: any) => ({
      ...it,
      unit_value: it.unit_value === null || it.unit_value === undefined ? null : Number(it.unit_value),
    }))
    return items as (InventoryItem & { files: InventoryFile[] })[]
  },

  async getItemStateQuantities(projectId: string) {
    const { data, error } = await supabase
      .from('inventory_item_state_quantities')
      .select('*')
      .eq('project_id', projectId)

    if (error) throw error
    return (data || []) as Array<{
      item_id: string
      project_id: string
      qty_bodega: number
      qty_uso: number
      qty_gastado: number
    }>
  },

  async getItemsWithQuantities(projectId: string) {
    const [items, qtys] = await Promise.all([
      this.getProjectItems(projectId),
      this.getItemStateQuantities(projectId),
    ])

    const qtyMap = new Map(qtys.map(q => [q.item_id, q]))
    return items.map(item => {
      const q = qtyMap.get(item.id)
      return {
        ...item,
        qty_bodega: q?.qty_bodega ?? 0,
        qty_uso: q?.qty_uso ?? 0,
        qty_gastado: q?.qty_gastado ?? 0,
      }
    })
  },

  async updateItem(itemId: string, updates: Partial<Pick<InventoryItem, 'name' | 'description' | 'thumbnail_url' | 'unit_value'>>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', itemId)
      .select('*')
      .single()

    if (error) throw error
    return data as InventoryItem
  },

  // Movements
  async createMovement(itemId: string, projectId: string, data: {
    quantity: number
    from_state: 'externo' | 'bodega' | 'uso'
    to_state: InventoryState
    note?: string
  }) {
    if (data.quantity <= 0) throw new Error('La cantidad debe ser mayor que cero')

    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuario no autenticado')

    const { data: inserted, error } = await supabase
      .from('inventory_movements')
      .insert({
        item_id: itemId,
        project_id: projectId,
        quantity: Math.floor(data.quantity),
        from_state: data.from_state,
        to_state: data.to_state,
        note: data.note ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return inserted as InventoryMovement
  },

  async getProjectMovements(projectId: string) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as InventoryMovement[]
  },

  // Files
  async uploadItemFile(itemId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${itemId}/${Date.now()}.${fileExt}`

    const { data: upload, error: uploadError } = await supabase
      .storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

    const { data: inserted, error } = await supabase
      .from('inventory_files')
      .insert({
        item_id: itemId,
        file_name: file.name,
        file_path: upload.path,
        file_type: file.type,
        file_size: file.size,
      })
      .select('*')
      .single()

    if (error) throw error
    return inserted as InventoryFile
  },

  async uploadItemFiles(itemId: string, files: FileList | File[]) {
    const list = files instanceof FileList ? Array.from(files) : files
    const uploads = list.map((f) => this.uploadItemFile(itemId, f))
    return Promise.all(uploads)
  },

  getFileUrl(filePath: string) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  },

  async replaceItemImage(itemId: string, file: File) {
    // Remove existing files for the item
    try {
      const { data: files } = await supabase
        .from('inventory_files')
        .select('id,file_path')
        .eq('item_id', itemId)

      const paths = (files || []).map((f: any) => f.file_path)
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths)
        await supabase.from('inventory_files').delete().eq('item_id', itemId)
      }
    } catch (e) {
      console.warn('Error cleaning previous images for item', itemId, e)
    }

    // Upload new file
    const rec = await this.uploadItemFile(itemId, file)
    const publicUrl = this.getFileUrl(rec.file_path)

    // Set as thumbnail
    await this.updateItem(itemId, { thumbnail_url: publicUrl })
    return { file: rec, thumbnail_url: publicUrl }
  },

  async deleteItemImage(itemId: string) {
    try {
      // Fetch file paths to remove from storage
      const { data: files } = await supabase
        .from('inventory_files')
        .select('file_path')
        .eq('item_id', itemId)

      const paths = (files || []).map((f: any) => f.file_path)
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths)
        await supabase.from('inventory_files').delete().eq('item_id', itemId)
      }

      // Remove thumbnail_url from item
      await this.updateItem(itemId, { thumbnail_url: null })
    } catch (e) {
      console.error('Error deleting item image:', e)
      throw e
    }
  },

  async deleteItem(itemId: string) {
    try {
      // Fetch file paths to remove from storage
      const { data: files } = await supabase
        .from('inventory_files')
        .select('file_path')
        .eq('item_id', itemId)

      const paths = (files || []).map((f: any) => f.file_path)
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths)
      }
    } catch (e) {
      // Continue even if storage cleanup fails
      console.warn('Storage cleanup failed for item', itemId, e)
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },
}
