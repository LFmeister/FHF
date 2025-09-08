'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import ProjectPageClient from '@/components/projects/ProjectPageClient'
import { Button } from '@/components/ui/Button'

export default function ProjectPageByQuery() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const id = searchParams.get('id') || ''
  const tab = searchParams.get('tab') || undefined

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Falta el parámetro "id"</h2>
          <p className="text-gray-600">Debes acceder a esta página con ?id=PROJECT_ID</p>
          <div>
            <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  return <ProjectPageClient projectId={id} initialTab={tab as any} />
}
