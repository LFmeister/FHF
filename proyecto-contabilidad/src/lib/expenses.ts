import { supabase } from './supabase'

export interface Expense {
  id: string
  project_id: string
  amount: number
  description: string
  category: string | null
  created_by: string
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
  }
  expense_files?: ExpenseFile[]
}

export interface ExpenseFile {
  id: string
  expense_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export const expensesService = {
  // Create a new expense
  async createExpense(projectId: string, expenseData: { amount: number; description: string; category?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        project_id: projectId,
        amount: expenseData.amount,
        description: expenseData.description,
        category: expenseData.category,
        created_by: user.id,
      })
      .select(`
        *,
        user:users!created_by (
          full_name,
          email
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Get expenses for a project
  async getProjectExpenses(projectId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        user:users!created_by (
          full_name,
          email
        ),
        expense_files (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Update an expense
  async updateExpense(expenseId: string, amount: number, description: string, category?: string) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        amount,
        description,
        category,
      })
      .eq('id', expenseId)
      .select(`
        *,
        user:users!created_by (
          full_name,
          email
        ),
        expense_files (*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Delete an expense
  async deleteExpense(expenseId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) throw error
  },

  // Upload file for expense
  async uploadExpenseFile(expenseId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${expenseId}/${Date.now()}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('expense-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }

    // Save file record to database
    const { data, error } = await supabase
      .from('expense_files')
      .insert({
        expense_id: expenseId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get file URL
  async getFileUrl(filePath: string) {
    const { data } = supabase.storage
      .from('expense-files')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  // Delete expense file
  async deleteExpenseFile(fileId: string, filePath: string) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('expense-files')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete from database
    const { error } = await supabase
      .from('expense_files')
      .delete()
      .eq('id', fileId)

    if (error) throw error
  },

  // Get total expenses for a project
  async getProjectTotalExpenses(projectId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('project_id', projectId)

    if (error) throw error

    const total = data.reduce((sum, expense) => sum + expense.amount, 0)
    return total
  },

  // Get expenses by category
  async getExpensesByCategory(projectId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('project_id', projectId)

    if (error) throw error

    const categoryTotals: Record<string, number> = {}
    data.forEach(expense => {
      const category = expense.category || 'Sin categoría'
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
    })

    return categoryTotals
  },
}
