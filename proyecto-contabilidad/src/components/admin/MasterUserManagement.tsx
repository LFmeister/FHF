'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { adminService } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  user_type: 'normal' | 'master'
  created_at: string
  updated_at: string
}

interface ExtendedUser extends User {
  profile?: UserProfile
  isBanned?: boolean
  ban_duration?: string
}

export function MasterUserManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMaster, setIsMaster] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkMasterStatus()
    loadUsers()
  }, [])

  const checkMasterStatus = async () => {
    try {
      const masterStatus = await adminService.isMaster()
      setIsMaster(masterStatus)
      if (!masterStatus) {
        setError('No tienes permisos para acceder a esta sección')
      }
    } catch (err) {
      console.error('Error checking master status:', err)
      setError('Error verificando permisos')
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { users: authUsers, error: usersError } = await adminService.getUsers()
      
      if (usersError) {
        throw usersError
      }

      // Get user profiles for each user
      const usersWithProfiles = await Promise.all(
        authUsers.map(async (user) => {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            return {
              ...user,
              profile,
              isBanned: (user as any).ban_duration !== undefined && (user as any).ban_duration !== 'none'
            }
          } catch (err) {
            console.error(`Error loading profile for user ${user.id}:`, err)
            return {
              ...user,
              profile: null,
              isBanned: false // Default to false if we can't determine status
            }
          }
        })
      )

      setUsers(usersWithProfiles)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserType = async (userId: string, newType: 'normal' | 'master') => {
    try {
      setActionLoading(`type-${userId}`)
      await adminService.updateUserType(userId, newType)
      await loadUsers() // Reload to get updated data
    } catch (err) {
      console.error('Error updating user type:', err)
      alert('Error actualizando tipo de usuario')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleUserStatus = async (userId: string, banned: boolean) => {
    try {
      setActionLoading(`status-${userId}`)
      await adminService.toggleUserStatus(userId, banned)
      await loadUsers() // Reload to get updated data
    } catch (err) {
      console.error('Error updating user status:', err)
      alert('Error actualizando estado del usuario')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar permanentemente al usuario ${userEmail}?\n\n` +
      'Esta acción eliminará:\n' +
      '- El usuario y su cuenta\n' +
      '- Todos sus proyectos\n' +
      '- Todos sus ingresos y gastos\n' +
      '- Todos sus items de inventario\n\n' +
      'Esta acción NO se puede deshacer.'
    )

    if (!confirmed) return

    try {
      setActionLoading(`delete-${userId}`)
      await adminService.deleteUser(userId)
      await loadUsers() // Reload to get updated data
      alert('Usuario eliminado exitosamente')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Error eliminando usuario')
    } finally {
      setActionLoading(null)
    }
  }

  if (!isMaster) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-2xl">🚫</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Acceso Denegado</h3>
            <p className="text-red-600">
              Solo usuarios con tipo "master" pueden acceder a esta sección.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-primary-600">Cargando usuarios...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Usuarios
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Administra usuarios, tipos y permisos del sistema
              </p>
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-gray-400 text-4xl">👥</span>
              <p className="text-gray-500 mt-2">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Registro</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.user_metadata?.full_name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900">{user.email}</p>
                          {!user.email_confirmed_at && (
                            <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full mt-1">
                              Email no confirmado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.profile?.user_type || 'normal'}
                          onChange={(e) => handleUpdateUserType(user.id, e.target.value as 'normal' | 'master')}
                          disabled={actionLoading === `type-${user.id}`}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          <option value="normal">Normal</option>
                          <option value="master">Master</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            user.isBanned ? 'bg-red-500' : 'bg-green-500'
                          }`}></span>
                          <span className={`text-sm ${
                            user.isBanned ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {user.isBanned ? 'Suspendido' : 'Activo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, !user.isBanned)}
                            disabled={actionLoading === `status-${user.id}`}
                            className={`px-3 py-1 text-xs rounded-md font-medium disabled:opacity-50 ${
                              user.isBanned
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            {actionLoading === `status-${user.id}` ? '...' : (user.isBanned ? 'Reactivar' : 'Suspender')}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email || '')}
                            disabled={actionLoading === `delete-${user.id}`}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            {actionLoading === `delete-${user.id}` ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">ℹ️ Información sobre tipos de usuario:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Normal:</strong> Usuario estándar con acceso a sus proyectos y funcionalidades básicas</li>
          <li><strong>Master:</strong> Usuario administrador con acceso completo al sistema y gestión de usuarios</li>
        </ul>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-800 mb-2">⚠️ Advertencias importantes:</h3>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• La eliminación de usuarios es <strong>permanente e irreversible</strong></li>
          <li>• Se eliminarán todos los datos asociados (proyectos, ingresos, gastos, inventario)</li>
          <li>• Los usuarios suspendidos no pueden iniciar sesión hasta ser reactivados</li>
          <li>• Solo usuarios master pueden realizar estas acciones</li>
        </ul>
      </div>
    </div>
  )
}
