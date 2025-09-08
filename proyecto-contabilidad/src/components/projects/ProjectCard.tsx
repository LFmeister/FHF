'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Users, Settings, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

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

export function ProjectCard({ project, currentUserId }: ProjectCardProps) {
  const [copied, setCopied] = useState(false)

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(project.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy invite code:', err)
    }
  }

  const isOwner = project.user_role === 'owner'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-1">
                {project.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                Propietario
              </span>
            )}
            <Link href={`/dashboard/project?id=${project.id}&tab=settings`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Código: {project.invite_code}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyInviteCode}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/project?id=${project.id}`} className="flex-1">
              <Button className="w-full">
                Ver Proyecto
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
