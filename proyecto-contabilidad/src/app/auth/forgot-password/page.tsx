'use client'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLanguage } from '@/context/LanguageContext'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  return (
    <AuthShell
      title={t.auth.forgot.title}
      subtitle={t.auth.forgot.subtitle}
      backHref="/auth/login"
      backLabel={t.auth.forgot.backLabel}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
