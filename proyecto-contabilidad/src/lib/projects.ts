import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export interface Project {
  id: string
  name: string
  description: string | null
  invite_code: string
  owner_id: string
  currency: string
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'normal' | 'view'
  joined_at: string
  user?: {
    full_name: string
    email: string
  }
}

// Generate unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const projectsService = {
  // Create a new project
  async createProject(data: { name: string; description?: string; currency?: string }): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Generate unique invite code with retry mechanism
    let inviteCode: string
    let attempts = 0
    const maxAttempts = 5

    do {
      inviteCode = generateInviteCode()
      attempts++
      
      // Check if code already exists
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle()
      
      if (!existingProject) break
      
      if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un código de invitación único')
      }
    } while (attempts < maxAttempts)
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        description: data.description,
        currency: data.currency || 'COP',
        invite_code: inviteCode,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Add owner as project member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) throw memberError

    return project
  },

  // Get user's projects
  async getUserProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        project_id,
        role,
        joined_at,
        projects (
          id,
          name,
          description,
          invite_code,
          owner_id,
          currency,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error

    return data.map(item => ({
      ...item.projects,
      user_role: item.role,
      joined_at: item.joined_at,
    }))
  },

  // Get project by ID
  async getProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  },

  // Get project members
  async getProjectMembers(projectId: string) {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:users!user_id (
          full_name,
          email
        )
      `)
      .eq('project_id', projectId)

    if (error) throw error
    return data
  },

  // Join project by invite code
  async joinProject(inviteCode: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Find project by invite code
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (projectError) throw new Error('Código de invitación inválido')

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      throw new Error('Ya eres miembro de este proyecto')
    }

    // Add user as project member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'view',
      })

    if (memberError) throw memberError

    return project
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'description'>>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete project
  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
  },

  // Remove member from project
  async removeMember(projectId: string, userId: string) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Regenerate invite code
  async regenerateInviteCode(projectId: string) {
    const newInviteCode = generateInviteCode()
    
    const { data, error } = await supabase
      .from('projects')
      .update({ invite_code: newInviteCode })
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update member role
  async updateMemberRole(projectId: string, userId: string, newRole: 'admin' | 'normal' | 'view') {
    const { error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Get user role in project
  async getUserRole(projectId: string, userId: string) {
    const { data, error } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data.role
  },

  // Check if user has permission
  async hasPermission(projectId: string, userId: string, permission: 'read' | 'write' | 'delete' | 'admin') {
    const role = await this.getUserRole(projectId, userId)
    
    switch (permission) {
      case 'read':
        return ['owner', 'admin', 'normal', 'view'].includes(role)
      case 'write':
        return ['owner', 'admin', 'normal'].includes(role)
      case 'delete':
        return ['owner', 'admin'].includes(role)
      case 'admin':
        return ['owner'].includes(role)
      default:
        return false
    }
  },
}
