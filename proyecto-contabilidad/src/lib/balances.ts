import { supabase } from './supabase'

export interface Balance {
  id: string
  project_id: string
  amount: number
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
  }
}

export const balancesService = {
  // Create a new balance entry
  async createBalance(projectId: string, balanceData: { amount: number; description?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('balances')
      .insert({
        project_id: projectId,
        amount: balanceData.amount,
        description: balanceData.description,
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

  // Get balances for a project
  async getProjectBalances(projectId: string) {
    const { data, error } = await supabase
      .from('balances')
      .select(`
        *,
        user:users!created_by (
          full_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Update a balance
  async updateBalance(balanceId: string, amount: number, description?: string) {
    const { data, error } = await supabase
      .from('balances')
      .update({
        amount,
        description,
      })
      .eq('id', balanceId)
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

  // Delete a balance
  async deleteBalance(balanceId: string) {
    const { error } = await supabase
      .from('balances')
      .delete()
      .eq('id', balanceId)

    if (error) throw error
  },

  // Get total balance for a project
  async getProjectTotalBalance(projectId: string) {
    const { data, error } = await supabase
      .from('balances')
      .select('amount')
      .eq('project_id', projectId)

    if (error) throw error

    const total = data.reduce((sum, balance) => sum + balance.amount, 0)
    return total
  },
}
