import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthShell } from '@/components/auth/AuthShell'

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registra tu equipo y empieza a controlar proyectos de forma profesional."
      backHref="/auth/login"
      backLabel="volver al login"
    >
      <RegisterForm />
    </AuthShell>
  )
}
