import { supabase } from './supabase'

export const adminService = {
  // Eliminar usuario completamente (solo para administradores)
  async deleteUser(userId: string) {
    try {
      // Primero eliminar todos los datos relacionados del usuario
      
      // 1. Eliminar membresías de proyectos
      const { error: memberError } = await supabase
        .from('project_members')
        .delete()
        .eq('user_id', userId)
      
      if (memberError) {
        console.error('Error deleting project memberships:', memberError)
      }

      // 2. Eliminar proyectos donde el usuario es owner
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('created_by', userId)
      
      if (projectError) {
        console.error('Error deleting user projects:', projectError)
      }

      // 3. Eliminar ingresos creados por el usuario
      const { error: incomeError } = await supabase
        .from('income')
        .delete()
        .eq('created_by', userId)
      
      if (incomeError) {
        console.error('Error deleting user income:', incomeError)
      }

      // 4. Eliminar gastos creados por el usuario
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('created_by', userId)
      
      if (expenseError) {
        console.error('Error deleting user expenses:', expenseError)
      }

      // 5. Eliminar items de inventario creados por el usuario
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('created_by', userId)
      
      if (inventoryError) {
        console.error('Error deleting user inventory:', inventoryError)
      }

      // 6. Finalmente, eliminar el usuario de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        throw new Error(`Error deleting user from auth: ${authError.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteUser:', error)
      throw error
    }
  },

  // Obtener lista de usuarios (solo para administradores)
  async getUsers() {
    try {
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        throw new Error(`Error fetching users: ${error.message}`)
      }

      return { users: data.users, error: null }
    } catch (error) {
      console.error('Error in getUsers:', error)
      return { users: [], error: error }
    }
  },

  // Verificar si un usuario es master (puede eliminar usuarios)
  async isMaster(userId?: string) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return false
      }

      // ID del usuario a verificar (el proporcionado o el actual)
      const targetUserId = userId || user.id

      // Verificar en la tabla user_profiles
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', targetUserId)
        .single()

      if (profileError) {
        console.error('Error checking user profile:', profileError)
        return false
      }

      return data?.user_type === 'master'
    } catch (error) {
      console.error('Error checking master status:', error)
      return false
    }
  },

  // Actualizar tipo de usuario (solo para master)
  async updateUserType(userId: string, type: 'normal' | 'master') {
    try {
      // Verificar que el usuario actual es master
      const isMasterUser = await this.isMaster()
      if (!isMasterUser) {
        throw new Error('Solo usuarios master pueden cambiar tipos de usuario')
      }

      // Actualizar en la tabla user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ user_type: type, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Error updating user type: ${error.message}`)
      }

      return { success: true, user: data }
    } catch (error) {
      console.error('Error in updateUserType:', error)
      throw error
    }
  },

  // Suspender/reactivar usuario
  async toggleUserStatus(userId: string, banned: boolean) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: banned ? 'indefinite' : 'none'
      })

      if (error) {
        throw new Error(`Error updating user status: ${error.message}`)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error in toggleUserStatus:', error)
      throw error
    }
  }
}
