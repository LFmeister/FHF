'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const { t } = useLanguage()
  return (
    <AuthShell title={t.auth.login.title} subtitle={t.auth.login.subtitle}>
      <LoginForm />
    </AuthShell>
  )
}
