'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Copy, Check, ArrowRight, FolderKanban, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    invite_code: string
    owner_id: string
    created_at: string
    user_role: 'owner' | 'member'
    joined_at: string
  }
  currentUserId: string
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [copied, setCopied] = useState(false)

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(project.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error('Failed to copy invite code:', err)
    }
  }

  const isOwner = project.user_role === 'owner'

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-sky-500 to-emerald-500" />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <FolderKanban className="h-3.5 w-3.5" />
              Proyecto
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">{project.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description || 'Sin descripcion.'}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                isOwner ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
              }`}
            >
              {isOwner ? 'Propietario' : 'Miembro'}
            </span>
            <Link href={`/dashboard/project?id=${project.id}&tab=settings`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Creado
            </span>
            <span className="font-semibold text-slate-700">
              {new Date(project.created_at).toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Codigo de invitacion</p>
              <p className="truncate font-mono text-sm font-bold text-primary-800">{project.invite_code}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyInviteCode}
              className="h-8 w-8 p-0 text-slate-600 hover:bg-white"
              title="Copiar codigo"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Link href={`/dashboard/project?id=${project.id}`} className="block">
          <Button className="w-full justify-between">
            Abrir proyecto
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
