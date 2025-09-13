export type UserRole = 'owner' | 'admin' | 'normal' | 'view'
export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'manage_members'

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  description: string
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissions> = {
  owner: {
    role: 'owner',
    permissions: ['read', 'write', 'delete', 'admin', 'manage_members'],
    description: 'Propietario del proyecto con acceso completo'
  },
  admin: {
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_members'],
    description: 'Administrador con permisos completos excepto configuración del proyecto'
  },
  normal: {
    role: 'normal',
    permissions: ['read', 'write'],
    description: 'Usuario normal que puede ver y crear ingresos/egresos pero no eliminar'
  },
  view: {
    role: 'view',
    permissions: ['read'],
    description: 'Usuario de solo lectura que únicamente puede ver el resumen'
  }
}

export const permissions = {
  // Check if a role has a specific permission
  hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_DEFINITIONS[role]?.permissions.includes(permission) || false
  },

  // Get all permissions for a role
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_DEFINITIONS[role]?.permissions || []
  },

  // Get role description
  getRoleDescription(role: UserRole): string {
    return ROLE_DEFINITIONS[role]?.description || ''
  },

  // Check if user can view content
  canView(role: UserRole): boolean {
    return this.hasPermission(role, 'read')
  },

  // Check if user can create/edit content
  canEdit(role: UserRole): boolean {
    return this.hasPermission(role, 'write')
  },

  // Check if user can delete content
  canDelete(role: UserRole): boolean {
    return this.hasPermission(role, 'delete')
  },

  // Check if user can manage project settings
  canManageProject(role: UserRole): boolean {
    return this.hasPermission(role, 'admin')
  },

  // Check if user can manage members
  canManageMembers(role: UserRole): boolean {
    return this.hasPermission(role, 'manage_members')
  },

  // Get available roles for assignment (excluding owner)
  getAssignableRoles(): UserRole[] {
    return ['admin', 'normal', 'view']
  },

  // Get role display name
  getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
      owner: 'Propietario',
      admin: 'Administrador',
      normal: 'Usuario Normal',
      view: 'Solo Vista'
    }
    return names[role] || role
  },

  // Get role color for UI
  getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      normal: 'bg-green-100 text-green-800',
      view: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }
}
