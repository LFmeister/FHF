'use client'

import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLanguage } from '@/context/LanguageContext'

export default function RegisterPage() {
  const { t } = useLanguage()
  return (
    <AuthShell
      title={t.auth.register.title}
      subtitle={t.auth.register.subtitle}
      backHref="/auth/login"
      backLabel={t.auth.register.backLabel}
    >
      <RegisterForm />
    </AuthShell>
  )
}
