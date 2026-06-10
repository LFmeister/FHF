'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Settings, Trash2, Crown, Shield, Eye, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { projectsService, type ProjectMember } from '@/lib/projects'
import { permissions, type UserRole } from '@/lib/permissions'
import { useLanguage } from '@/context/LanguageContext'

interface ProjectMembersProps {
  projectId: string
  currentUserId: string
  userRole: UserRole
}

export function ProjectMembers({ projectId, currentUserId, userRole }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const { t } = useLanguage()
  const tm = t.members

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
      alert(tm.noPermissionRoles)
      return
    }

    if (userId === currentUserId) {
      alert(tm.cannotChangeOwnRole)
      return
    }

    setUpdatingMember(memberId)
    try {
      await projectsService.updateMemberRole(projectId, userId, newRole as 'admin' | 'normal' | 'view')
      await loadMembers()
    } catch (error) {
      console.error('Error updating member role:', error)
      alert(tm.roleUpdateError)
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!permissions.canManageMembers(userRole)) {
      alert(tm.noPermissionRemove)
      return
    }

    if (userId === currentUserId) {
      alert(tm.cannotRemoveSelf)
      return
    }

    if (confirm(tm.confirmRemove)) {
      try {
        await projectsService.removeMember(projectId, userId)
        await loadMembers()
      } catch (error) {
        console.error('Error removing member:', error)
        alert(tm.removeError)
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
          {tm.title} ({members.length})
        </CardTitle>
        <CardDescription>
          {tm.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getRoleIcon(member.role as UserRole)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <p className="font-medium text-gray-900 break-words">
                        {member.user?.full_name || t.common.noName}
                        {member.user_id === currentUserId && (
                          <span className="text-sm text-gray-500 ml-2">({t.common.you})</span>
                        )}
                      </p>
                      {!member.user?.full_name && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full w-fit">
                          {tm.noNameConfigured}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 break-all">{member.user?.email}</p>
                    <p className="text-xs text-gray-400">
                      {tm.memberSince} {new Date(member.joined_at).toLocaleDateString(t.locale)}
                    </p>
                    <div className="mt-2 sm:hidden">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissions.getRoleColor(member.role as UserRole)}`}>
                        {t.roles[member.role as UserRole]}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissions.getRoleColor(member.role as UserRole)}`}>
                      {t.roles[member.role as UserRole]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  {permissions.canManageMembers(userRole) && member.user_id !== currentUserId && member.role !== 'owner' && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, member.user_id, e.target.value as UserRole)}
                        disabled={updatingMember === member.id}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white w-full sm:w-auto"
                      >
                        {permissions.getAssignableRoles().map((role) => (
                          <option key={role} value={role}>
                            {t.roles[role]}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">{tm.removeMember}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{tm.noMembers}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-blue-900 mb-3">{tm.rolesTitle}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{t.roles.owner}:</span>
                </div>
                <span className="text-gray-600 break-words">{tm.ownerDesc}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{t.roles.admin}:</span>
                </div>
                <span className="text-gray-600 break-words">{tm.adminDesc}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t.roles.normal}:</span>
                </div>
                <span className="text-gray-600 break-words">{tm.normalDesc}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{t.roles.view}:</span>
                </div>
                <span className="text-gray-600 break-words">{tm.viewDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
