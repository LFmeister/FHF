import { supabase } from './supabase'

export interface Income {
  id: string
  project_id: string
  user_id: string
  description: string | null
  amount: number
  category: string | null
  income_date: string
  receipt_url: string | null
  status: string
  performed_by: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
  }
  performed_user?: {
    full_name: string
    email: string
  }
}

export const incomeService = {
  // Create a new income entry
  async createIncome(projectId: string, incomeData: {
    description?: string
    amount: number
    category: string
    income_date: string
    performed_by: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('income')
      .insert({
        project_id: projectId,
        user_id: user.id, // Usuario que registra (sesión actual)
        description: incomeData.description,
        amount: incomeData.amount,
        category: incomeData.category,
        income_date: incomeData.income_date,
        status: 'approved',
        performed_by: incomeData.performed_by || user.id, // Usuario que realizó la transacción
      })
      .select(`
        *,
        user:users!user_id (
          full_name,
          email
        ),
        performed_user:users!performed_by (
          full_name,
          email
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Get income for a project
  async getProjectIncome(projectId: string) {
    const { data, error } = await supabase
      .from('income')
      .select(`
        *,
        user:users!user_id (
          full_name,
          email
        ),
        performed_user:users!performed_by (
          full_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Update an income entry
  async updateIncome(incomeId: string, incomeData: {
    title?: string
    description?: string
    amount?: number
    category?: string
    income_date?: string
  }) {
    const { data, error } = await supabase
      .from('income')
      .update(incomeData)
      .eq('id', incomeId)
      .select(`
        *,
        user:users!user_id (
          email
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Delete an income entry
  async deleteIncome(incomeId: string) {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', incomeId)

    if (error) throw error
  },

  // Get total income for a project
  async getProjectTotalIncome(projectId: string) {
    const { data, error } = await supabase
      .from('income')
      .select('amount')
      .eq('project_id', projectId)
      .eq('status', 'approved')

    if (error) throw error

    const total = (data || []).reduce((sum, income) => sum + income.amount, 0)
    return total
  },

  // Upload file for income
  async uploadIncomeFile(incomeId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${incomeId}_${Date.now()}.${fileExt}`
    const filePath = `income-files/${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Save file info to database
    const { data, error } = await supabase
      .from('income_files')
      .insert({
        income_id: incomeId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
