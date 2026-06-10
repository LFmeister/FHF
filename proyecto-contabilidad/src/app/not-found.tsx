'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'

export default function NotFound() {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-800 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.notFound.title}</h2>
        <p className="text-gray-600 mb-6">{t.notFound.message}</p>
        <Button onClick={() => router.push('/dashboard')}>
          {t.notFound.backToDashboard}
        </Button>
      </div>
    </div>
  )
}
