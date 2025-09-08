'use client'

import { useEffect, useState } from 'react'
import { Plus, FolderOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CreateProjectForm } from '@/components/projects/CreateProjectForm'
import { JoinProjectForm } from '@/components/projects/JoinProjectForm'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { projectsService } from '@/lib/projects'
import { auth } from '@/lib/auth'

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        setUser(user)
        
        const userProjects = await projectsService.getUserProjects()
        setProjects(userProjects)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleProjectCreated = async () => {
    try {
      const userProjects = await projectsService.getUserProjects()
      setProjects(userProjects)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error reloading projects:', error)
    }
  }

  const handleProjectJoined = async () => {
    try {
      const userProjects = await projectsService.getUserProjects()
      setProjects(userProjects)
      setShowJoinForm(false)
    } catch (error) {
      console.error('Error reloading projects:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-800">Dashboard</h1>
            <p className="mt-2 text-primary-600">
              Gestiona tus proyectos de contabilidad colaborativa
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex sm:space-x-3">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? 'secondary' : 'primary'}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              {showCreateForm ? 'Cancelar' : 'Crear Proyecto'}
            </Button>
            <Button
              onClick={() => setShowJoinForm(!showJoinForm)}
              variant={showJoinForm ? 'secondary' : 'outline'}
              size="lg"
            >
              <Users className="h-5 w-5 mr-2" />
              {showJoinForm ? 'Cancelar' : 'Unirse a Proyecto'}
            </Button>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-6">
        {showCreateForm && (
          <CreateProjectForm onSuccess={handleProjectCreated} />
        )}
        
        {showJoinForm && (
          <JoinProjectForm onSuccess={handleProjectJoined} />
        )}
      </div>

      {/* Projects Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-2">
            Mis Proyectos ({projects.length})
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"></div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-primary-100">
            <FolderOpen className="mx-auto h-16 w-16 text-primary-300" />
            <h3 className="mt-4 text-lg font-semibold text-primary-800">No hay proyectos</h3>
            <p className="mt-2 text-primary-600 max-w-sm mx-auto">
              Comienza creando un nuevo proyecto o únete a uno existente usando un código de invitación.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Button onClick={() => setShowCreateForm(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear Proyecto
              </Button>
              <Button onClick={() => setShowJoinForm(true)} variant="outline" size="lg">
                <Users className="h-5 w-5 mr-2" />
                Unirse a Proyecto
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUserId={user?.id || ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
