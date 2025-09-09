import { supabase } from './supabase'

export interface Income {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  amount: number
  category: string | null
  income_date: string
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
    email?: string
  }
}

export const incomeService = {
  // Create a new income entry
  async createIncome(projectId: string, incomeData: {
    title: string
    description?: string
    amount: number
    category?: string
    income_date: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('income')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: incomeData.title,
        description: incomeData.description,
        amount: incomeData.amount,
        category: incomeData.category,
        income_date: incomeData.income_date,
        status: 'approved',
      })
      .select(`
        *,
        user:users!user_id (
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
}
