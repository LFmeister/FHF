import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthShell } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contrasena"
      subtitle="Te enviaremos un enlace para restablecer el acceso."
      backHref="/auth/login"
      backLabel="volver al login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
