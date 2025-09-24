import { supabase } from './supabase'

export type CategoryType = 'income' | 'expense'

export interface CustomCategory {
  id: string
  project_id: string
  name: string
  type: CategoryType
  created_by: string
  created_at: string
  updated_at: string
}

export interface CategoryPreferences {
  id: string
  project_id: string
  user_id: string
  type: CategoryType
  hidden_categories: string[]
  show_default_categories: boolean
  created_at: string
  updated_at: string
}

// Default categories
export const DEFAULT_INCOME_CATEGORIES = [
  'Ventas',
  'Servicios',
  'Inversión',
  'Consultoría',
  'Comisiones',
  'Intereses',
  'Dividendos',
  'Alquileres',
  'Otros'
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Oficina',
  'Marketing',
  'Transporte',
  'Alimentación',
  'Servicios',
  'Equipos',
  'Software',
  'Capacitación',
  'Legal',
  'Impuestos',
  'Otros'
]

export const categoriesService = {
  // Get all categories for a project (default + custom) with user preferences
  async getProjectCategories(projectId: string, type: CategoryType): Promise<string[]> {
    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user) {
        // Return default categories if not authenticated
        return type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(projectId, user.id, type)

      // Get custom categories
      const { data: customCategories, error } = await supabase
        .from('custom_categories')
        .select('name')
        .eq('project_id', projectId)
        .eq('type', type)
        .order('name')

      if (error) throw error

      const customNames = (customCategories || []).map((cat: any) => cat.name)
      // Apply visibility preferences to custom categories as well
      const visibleCustom = customNames.filter(
        (cat: string) => !preferences.hidden_categories.includes(cat)
      )
      let allCategories: string[] = [...visibleCustom]

      // Add default categories if user preference allows
      if (preferences.show_default_categories) {
        const defaultCategories = type === 'income' 
          ? DEFAULT_INCOME_CATEGORIES 
          : DEFAULT_EXPENSE_CATEGORIES
        
        // Filter out hidden categories
        const visibleDefaults = defaultCategories.filter(
          (cat: string) => !preferences.hidden_categories.includes(cat)
        )
        
        allCategories = [...allCategories, ...visibleDefaults]
      }
      
      // Remove duplicates and sort
      return Array.from(new Set(allCategories)).sort()
    } catch (error) {
      console.error('Error fetching project categories:', error)
      // Return default categories if there's an error
      return type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
    }
  },

  // Get only custom categories for a project
  async getCustomCategories(projectId: string, type?: CategoryType): Promise<CustomCategory[]> {
    let query = supabase
      .from('custom_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('name')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as CustomCategory[]
  },

  // Create a new custom category
  async createCustomCategory(projectId: string, name: string, type: CategoryType): Promise<CustomCategory> {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuario no autenticado')

    // Check if category already exists (case-insensitive)
    const existingCategories = await this.getProjectCategories(projectId, type)
    const categoryExists = existingCategories.some(
      cat => cat.toLowerCase() === name.toLowerCase()
    )

    if (categoryExists) {
      throw new Error(`La categoría "${name}" ya existe`)
    }

    const { data, error } = await supabase
      .from('custom_categories')
      .insert({
        project_id: projectId,
        name: name.trim(),
        type,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as CustomCategory
  },

  // Update a custom category
  async updateCustomCategory(categoryId: string, name: string): Promise<CustomCategory> {
    const { data, error } = await supabase
      .from('custom_categories')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .select('*')
      .single()

    if (error) throw error
    return data as CustomCategory
  },

  // Delete a custom category
  async deleteCustomCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
  },

  // Check if a category is custom (not default)
  isCustomCategory(categoryName: string, type: CategoryType): boolean {
    const defaultCategories = type === 'income' 
      ? DEFAULT_INCOME_CATEGORIES 
      : DEFAULT_EXPENSE_CATEGORIES
    
    return !defaultCategories.includes(categoryName)
  },

  // Get user preferences for categories
  async getUserPreferences(projectId: string, userId: string, type: CategoryType): Promise<CategoryPreferences> {
    const { data, error } = await supabase
      .from('category_preferences')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle()

    if (error) {
      throw error
    }

    // Return default preferences if none exist
    if (!data) {
      return {
        id: '',
        project_id: projectId,
        user_id: userId,
        type,
        hidden_categories: [],
        show_default_categories: true,
        created_at: '',
        updated_at: ''
      }
    }

    return data as CategoryPreferences
  },

  // Save user preferences for categories
  async saveUserPreferences(
    projectId: string, 
    type: CategoryType, 
    hiddenCategories: string[], 
    showDefaultCategories: boolean
  ): Promise<CategoryPreferences> {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuario no autenticado')

    // First try to update existing record
    const { data: existing } = await supabase
      .from('category_preferences')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('type', type)
      .maybeSingle()

    let data, error
    
    if (existing) {
      // Update existing record
      const result = await supabase
        .from('category_preferences')
        .update({
          hidden_categories: hiddenCategories,
          show_default_categories: showDefaultCategories,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from('category_preferences')
        .insert({
          project_id: projectId,
          user_id: user.id,
          type,
          hidden_categories: hiddenCategories,
          show_default_categories: showDefaultCategories,
        })
        .select('*')
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) throw error
    return data as CategoryPreferences
  },

  // Get all available categories (for preferences management)
  async getAllAvailableCategories(projectId: string, type: CategoryType): Promise<{
    default: string[],
    custom: string[]
  }> {
    // Get custom categories
    const { data: customCategories, error } = await supabase
      .from('custom_categories')
      .select('name')
      .eq('project_id', projectId)
      .eq('type', type)
      .order('name')

    if (error) throw error

    const defaultCategories = type === 'income' 
      ? DEFAULT_INCOME_CATEGORIES 
      : DEFAULT_EXPENSE_CATEGORIES

    const customNames = (customCategories || []).map(cat => cat.name)

    return {
      default: defaultCategories,
      custom: customNames
    }
  }
}
