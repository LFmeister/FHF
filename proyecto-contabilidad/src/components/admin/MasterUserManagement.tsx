'use client'

import { useState, useEffect } from 'react'
import { Trash2, Crown, User, AlertTriangle, CheckCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { adminService } from '@/lib/admin'
import { auth } from '@/lib/auth'

interface SupabaseUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  user_metadata: {
    full_name?: string
    type?: 'normal' | 'master'
  }
}

export function MasterUserManagement() {
  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isMaster, setIsMaster] = useState(false)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const checkMasterAndLoadUsers = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        if (!user) return

        const masterStatus = await adminService.isMaster(user.id)
        setIsMaster(masterStatus)

        if (masterStatus) {
          const { users: userList } = await adminService.getUsers()
          // Filtrar usuarios con email válido y convertir al tipo correcto
          const validUsers = userList
            .filter(u => u.email !== undefined)
            .map(u => ({
              id: u.id,
              email: u.email!,
              created_at: u.created_at,
              email_confirmed_at: u.email_confirmed_at || null,
              user_metadata: {
                full_name: u.user_metadata?.full_name,
                type: (u.user_metadata?.type as 'normal' | 'master') || 'normal'
              }
            }))
          setUsers(validUsers)
        }
      } catch (error) {
        console.error('Error loading users:', error)
        setMessage({ type: 'error', text: 'Error al cargar usuarios' })
      } finally {
        setLoading(false)
      }
    }

    checkMasterAndLoadUsers()
  }, [])

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Verificar que no se esté intentando eliminar a sí mismo
    const { user: currentUser } = await auth.getCurrentUser()
    if (currentUser?.id === userId) {
      setMessage({ type: 'error', text: 'No puedes eliminarte a ti mismo' })
      return
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar al usuario "${userEmail}"?\n\nEsta acción:\n• Eliminará TODOS los datos del usuario\n• Eliminará sus proyectos, ingresos, gastos e inventario\n• NO se puede deshacer\n\nEscribe "ELIMINAR" para confirmar:`
    
    const confirmation = prompt(confirmMessage)
    
    if (confirmation !== 'ELIMINAR') {
      if (confirmation !== null) {
        setMessage({ type: 'error', text: 'Eliminación cancelada. Debes escribir exactamente "ELIMINAR"' })
      }
      return
    }

    setDeletingUser(userId)
    setMessage(null)

    try {
      await adminService.deleteUser(userId)
      
      // Actualizar la lista de usuarios
      const { users: updatedUsers } = await adminService.getUsers()
      const validUsers = updatedUsers
        .filter(u => u.email !== undefined)
        .map(u => ({
          id: u.id,
          email: u.email!,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at || null,
          user_metadata: {
            full_name: u.user_metadata?.full_name,
            type: (u.user_metadata?.type as 'normal' | 'master') || 'normal'
          }
        }))
      setUsers(validUsers)
      
      setMessage({ 
        type: 'success', 
        text: `Usuario "${userEmail}" eliminado completamente` 
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      setMessage({ 
        type: 'error', 
        text: `Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    } finally {
      setDeletingUser(null)
    }
  }

  const handleChangeUserType = async (userId: string, currentType: 'normal' | 'master', userEmail: string) => {
    const newType = currentType === 'normal' ? 'master' : 'normal'
    const action = newType === 'master' ? 'otorgar permisos de master' : 'quitar permisos de master'
    
    const confirmMessage = `¿Estás seguro de que quieres ${action} al usuario "${userEmail}"?\n\nEscribe "CONFIRMAR" para proceder:`
    
    const confirmation = prompt(confirmMessage)
    
    if (confirmation !== 'CONFIRMAR') {
      if (confirmation !== null) {
        setMessage({ type: 'error', text: 'Cambio cancelado. Debes escribir exactamente "CONFIRMAR"' })
      }
      return
    }

    try {
      await adminService.updateUserType(userId, newType)
      
      // Actualizar la lista local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, user_metadata: { ...user.user_metadata, type: newType } }
          : user
      ))
      
      setMessage({ 
        type: 'success', 
        text: `Usuario "${userEmail}" ahora es tipo "${newType}"` 
      })
    } catch (error) {
      console.error('Error updating user type:', error)
      setMessage({ 
        type: 'error', 
        text: `Error al cambiar tipo de usuario: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  if (!isMaster) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-600 mb-4">
              Solo usuarios con tipo "master" pueden acceder a esta herramienta de gestión.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Tu tipo actual:</strong> normal
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Contacta a un usuario master para cambiar tu tipo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Gestión Master de Usuarios
          </CardTitle>
          <CardDescription>
            Como usuario master, puedes eliminar usuarios y cambiar tipos. Ten cuidado: las eliminaciones son permanentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`p-4 rounded-lg mb-4 flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Usuarios Registrados ({users.length})
              </h3>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.user_metadata.type === 'master' 
                        ? 'bg-yellow-100' 
                        : 'bg-primary-100'
                    }`}>
                      {user.user_metadata.type === 'master' ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <User className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.user_metadata?.full_name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>
                          Registrado: {new Date(user.created_at).toLocaleDateString('es-CO')}
                        </span>
                        {user.email_confirmed_at ? (
                          <span className="text-green-600">• Email confirmado</span>
                        ) : (
                          <span className="text-yellow-600">• Email pendiente</span>
                        )}
                        <span className={`font-medium ${
                          user.user_metadata.type === 'master' 
                            ? 'text-yellow-600' 
                            : 'text-blue-600'
                        }`}>
                          • Tipo: {user.user_metadata.type || 'normal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={user.user_metadata.type === 'master' ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleChangeUserType(
                        user.id, 
                        user.user_metadata.type || 'normal', 
                        user.email
                      )}
                    >
                      {user.user_metadata.type === 'master' ? (
                        <>
                          <User className="h-4 w-4 mr-1" />
                          Hacer Normal
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-1" />
                          Hacer Master
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={deletingUser === user.id}
                      loading={deletingUser === user.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingUser === user.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay usuarios registrados
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro - Solo Master
          </CardTitle>
          <CardDescription>
            Las siguientes acciones son irreversibles y eliminarán permanentemente los datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">
              ⚠️ Eliminación Completa de Usuario
            </h4>
            <ul className="text-sm text-red-700 space-y-1 mb-4">
              <li>• Elimina el usuario de Supabase Auth</li>
              <li>• Elimina todos sus proyectos</li>
              <li>• Elimina todos sus ingresos y gastos</li>
              <li>• Elimina todo su inventario</li>
              <li>• Elimina sus membresías en proyectos</li>
              <li>• Esta acción NO se puede deshacer</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-yellow-800 font-medium">
                🔒 Restricciones de Seguridad:
              </p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• No puedes eliminarte a ti mismo</li>
                <li>• Solo usuarios tipo "master" pueden usar esta herramienta</li>
                <li>• Requiere confirmación escribiendo "ELIMINAR"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
