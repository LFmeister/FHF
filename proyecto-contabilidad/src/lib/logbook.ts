import { supabase } from './supabase'

export interface LogbookImage {
  id: string
  entry_id: string
  image_url: string
  image_path: string
  caption: string | null
  display_order: number
  created_at: string
}

export interface LogbookEntry {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  entry_date: string
  created_at: string
  updated_at: string
  images?: LogbookImage[]
  user_name?: string
}

export interface CreateLogbookEntryData {
  project_id: string
  title: string
  description?: string
  entry_date?: string
  images?: File[]
}

export interface UpdateLogbookEntryData {
  title?: string
  description?: string
  entry_date?: string
}

class LogbookService {
  private bucketName = 'logbook-images'

  /**
   * Get all logbook entries for a project
   */
  async getProjectEntries(projectId: string): Promise<LogbookEntry[]> {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          logbook_images (*)
        `)
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })

      if (entriesError) throw entriesError

      // Get user names for each entry
      const userIds = Array.from(new Set(entries?.map(e => e.user_id) || []))
      const { data: profiles } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return (entries || []).map(entry => ({
        ...entry,
        images: entry.logbook_images || [],
        user_name: profileMap.get(entry.user_id)?.full_name || profileMap.get(entry.user_id)?.email || 'Usuario desconocido'
      }))
    } catch (error) {
      console.error('Error fetching logbook entries:', error)
      throw error
    }
  }

  /**
   * Get a single logbook entry by ID
   */
  async getEntry(entryId: string): Promise<LogbookEntry> {
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          logbook_images (*)
        `)
        .eq('id', entryId)
        .single()

      if (error) throw error

      return {
        ...data,
        images: data.logbook_images || []
      }
    } catch (error) {
      console.error('Error fetching logbook entry:', error)
      throw error
    }
  }

  /**
   * Create a new logbook entry
   */
  async createEntry(data: CreateLogbookEntryData): Promise<LogbookEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Create the entry
      const { data: entry, error: entryError } = await supabase
        .from('logbook_entries')
        .insert({
          project_id: data.project_id,
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          entry_date: data.entry_date || new Date().toISOString()
        })
        .select()
        .single()

      if (entryError) throw entryError

      // Upload images if provided
      if (data.images && data.images.length > 0) {
        const uploadedImages = await this.uploadImages(entry.id, data.images)
        entry.images = uploadedImages
      }

      // Get user profile information
      const { data: profile } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single()

      // Add user name to the entry
      entry.user_name = profile?.full_name || profile?.email || 'Usuario desconocido'

      return entry
    } catch (error) {
      console.error('Error creating logbook entry:', error)
      throw error
    }
  }

  /**
   * Update a logbook entry
   */
  async updateEntry(entryId: string, data: UpdateLogbookEntryData): Promise<void> {
    try {
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.entry_date !== undefined) updateData.entry_date = data.entry_date

      const { error } = await supabase
        .from('logbook_entries')
        .update(updateData)
        .eq('id', entryId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating logbook entry:', error)
      throw error
    }
  }

  /**
   * Delete a logbook entry (and associated images)
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      // Get images to delete from storage
      const { data: images } = await supabase
        .from('logbook_images')
        .select('image_path')
        .eq('entry_id', entryId)

      // Delete entry (cascade will delete images records)
      const { error } = await supabase
        .from('logbook_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      // Delete images from storage
      if (images && images.length > 0) {
        const paths = images.map(img => img.image_path)
        await supabase.storage
          .from(this.bucketName)
          .remove(paths)
      }
    } catch (error) {
      console.error('Error deleting logbook entry:', error)
      throw error
    }
  }

  /**
   * Upload images for a logbook entry
   */
  async uploadImages(entryId: string, files: File[]): Promise<LogbookImage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const uploadedImages: LogbookImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${entryId}/${Date.now()}_${i}.${fileExt}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName)

        // Create image record
        const { data: imageRecord, error: imageError } = await supabase
          .from('logbook_images')
          .insert({
            entry_id: entryId,
            image_url: publicUrl,
            image_path: fileName,
            display_order: i
          })
          .select()
          .single()

        if (imageError) throw imageError

        uploadedImages.push(imageRecord)
      }

      return uploadedImages
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    }
  }

  /**
   * Delete a single image
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      // Get image path
      const { data: image } = await supabase
        .from('logbook_images')
        .select('image_path')
        .eq('id', imageId)
        .single()

      if (!image) throw new Error('Imagen no encontrada')

      // Delete from database
      const { error: dbError } = await supabase
        .from('logbook_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([image.image_path])

      if (storageError) throw storageError
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  /**
   * Add images to an existing entry
   */
  async addImagesToEntry(entryId: string, files: File[]): Promise<LogbookImage[]> {
    try {
      // Get current max display order
      const { data: existingImages } = await supabase
        .from('logbook_images')
        .select('display_order')
        .eq('entry_id', entryId)
        .order('display_order', { ascending: false })
        .limit(1)

      const startOrder = existingImages && existingImages.length > 0 
        ? existingImages[0].display_order + 1 
        : 0

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const uploadedImages: LogbookImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${entryId}/${Date.now()}_${i}.${fileExt}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName)

        // Create image record
        const { data: imageRecord, error: imageError } = await supabase
          .from('logbook_images')
          .insert({
            entry_id: entryId,
            image_url: publicUrl,
            image_path: fileName,
            display_order: startOrder + i
          })
          .select()
          .single()

        if (imageError) throw imageError

        uploadedImages.push(imageRecord)
      }

      return uploadedImages
    } catch (error) {
      console.error('Error adding images to entry:', error)
      throw error
    }
  }
}

export const logbookService = new LogbookService()
