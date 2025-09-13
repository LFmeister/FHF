'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Settings, Trash2, Crown, Shield, Eye, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { permissions, type UserRole } from '@/lib/permissions'

interface ProjectMembersProps {
  projectId: string
  currentUserId: string
  userRole: UserRole
}

export function ProjectMembers({ projectId, currentUserId, userRole }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [projectId])

  const loadMembers = async () => {
    try {
      const membersData = await projectsService.getProjectMembers(projectId)
      setMembers(membersData)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, userId: string, newRole: UserRole) => {
    if (!permissions.canManageMembers(userRole)) {
      alert('No tienes permisos para cambiar roles')
      return
    }

    if (userId === currentUserId) {
      alert('No puedes cambiar tu propio rol')
      return
    }

    setUpdatingMember(memberId)
    try {
      await projectsService.updateMemberRole(projectId, userId, newRole as 'admin' | 'normal' | 'view')
      await loadMembers()
    } catch (error) {
      console.error('Error updating member role:', error)
      alert('Error al actualizar el rol del miembro')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!permissions.canManageMembers(userRole)) {
      alert('No tienes permisos para remover miembros')
      return
    }

    if (userId === currentUserId) {
      alert('No puedes removerte a ti mismo del proyecto')
      return
    }

    if (confirm('¿Estás seguro de que quieres remover este miembro del proyecto?')) {
      try {
        await projectsService.removeMember(projectId, userId)
        await loadMembers()
      } catch (error) {
        console.error('Error removing member:', error)
        alert('Error al remover el miembro')
      }
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'normal':
        return <User className="h-4 w-4" />
      case 'view':
        return <Eye className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Miembros del Proyecto ({members.length})
        </CardTitle>
        <CardDescription>
          Gestiona los miembros y sus roles en el proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role as UserRole)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.user?.full_name || 'Sin nombre'}
                        {member.user_id === currentUserId && (
                          <span className="text-sm text-gray-500 ml-2">(Tú)</span>
                        )}
                      </p>
                      {!member.user?.full_name && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Sin nombre configurado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                    <p className="text-xs text-gray-400">
                      Miembro desde: {new Date(member.joined_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissions.getRoleColor(member.role as UserRole)}`}>
                    {permissions.getRoleDisplayName(member.role as UserRole)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {permissions.canManageMembers(userRole) && member.user_id !== currentUserId && member.role !== 'owner' && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, member.user_id, e.target.value as UserRole)}
                      disabled={updatingMember === member.id}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                    >
                      {permissions.getAssignableRoles().map((role) => (
                        <option key={role} value={role}>
                          {permissions.getRoleDisplayName(role)}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay miembros en este proyecto</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Descripción de Roles</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Propietario:</span>
                <span className="text-gray-600">Acceso completo al proyecto</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Administrador:</span>
                <span className="text-gray-600">Puede hacer todo excepto eliminar el proyecto</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-medium">Usuario Normal:</span>
                <span className="text-gray-600">Puede navegar, crear ingresos y egresos, pero no eliminar</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Solo Vista:</span>
                <span className="text-gray-600">Solo puede ver el resumen del proyecto</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
