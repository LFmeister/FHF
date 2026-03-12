'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, FolderOpen, Users, Search, Sparkles, ShieldCheck, UserPlus2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CreateProjectForm } from '@/components/projects/CreateProjectForm'
import { JoinProjectForm } from '@/components/projects/JoinProjectForm'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { projectsService } from '@/lib/projects'
import { auth } from '@/lib/auth'

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [search, setSearch] = useState('')

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

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.user_role === 'owner').length,
    [projects]
  )

  const thisMonthProjects = useMemo(() => {
    const now = new Date()
    return projects.filter((project) => {
      const created = new Date(project.created_at)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
  }, [projects])

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return projects
    return projects.filter((project) => {
      const text = `${project.name || ''} ${project.description || ''} ${project.invite_code || ''}`.toLowerCase()
      return text.includes(value)
    })
  }, [projects, search])

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <AuthGuard requireEmailConfirmation={true}>
      <div className="space-y-6 sm:space-y-7">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-primary-900 to-emerald-900 p-5 text-white shadow-xl sm:p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-sky-200/20 blur-2xl" />

          <div className="relative grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Espacio de control
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">Hola {user?.user_metadata?.full_name || user?.email || 'Usuario'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-100/90 sm:text-base">
                Organiza tus proyectos, coordina equipo y mantiene el control financiero con una vista clara.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowCreateForm((prev) => !prev)}
                  variant={showCreateForm ? 'secondary' : 'primary'}
                  size="md"
                  className="bg-white text-primary-900 hover:bg-slate-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {showCreateForm ? 'Cerrar formulario' : 'Crear proyecto'}
                </Button>
                <Button
                  onClick={() => setShowJoinForm((prev) => !prev)}
                  variant="ghost"
                  size="md"
                  className={`!border !border-white/55 !text-white backdrop-blur-sm ${
                    showJoinForm ? '!bg-emerald-400/30 hover:!bg-emerald-300/35' : '!bg-white/10 hover:!bg-white/20'
                  }`}
                >
                  <UserPlus2 className="mr-2 h-4 w-4" />
                  {showJoinForm ? 'Cerrar formulario' : 'Unirse por codigo'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Total proyectos</p>
                <p className="mt-2 text-2xl font-extrabold">{projects.length}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Propios</p>
                <p className="mt-2 text-2xl font-extrabold">{ownedProjects}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Este mes</p>
                <p className="mt-2 text-2xl font-extrabold">{thisMonthProjects}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/70">Colaborativos</p>
                <p className="mt-2 text-2xl font-extrabold">{Math.max(projects.length - ownedProjects, 0)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {showCreateForm && <CreateProjectForm onSuccess={handleProjectCreated} />}
          {showJoinForm && <JoinProjectForm onSuccess={handleProjectJoined} />}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Mis proyectos</h2>
              <p className="mt-1 text-sm text-slate-600">Gestiona tus espacios activos y entra rapido a cada panel.</p>
            </div>

            <div className="w-full md:w-80">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Buscar proyecto</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  placeholder="Nombre, descripcion o codigo"
                />
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
              <FolderOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              {projects.length === 0 ? (
                <>
                  <p className="text-base font-semibold text-slate-800">Aun no tienes proyectos</p>
                  <p className="mt-1 text-sm text-slate-600">Crea uno nuevo o unete con un codigo de invitacion.</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear proyecto
                    </Button>
                    <Button onClick={() => setShowJoinForm(true)} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Unirme a proyecto
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-800">No hay coincidencias</p>
                  <p className="mt-1 text-sm text-slate-600">Prueba otro termino de busqueda.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} currentUserId={user?.id || ''} />
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Tus permisos dentro de cada proyecto dependen del rol asignado por el propietario.
          </div>
        </section>
      </div>
    </AuthGuard>
  )
}
