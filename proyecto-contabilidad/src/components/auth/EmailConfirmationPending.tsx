'use client'

import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/auth/AuthShell'
import { auth } from '@/lib/auth'

interface EmailConfirmationPendingProps {
  email: string
  onSignOut: () => void
}

export function EmailConfirmationPending({ email, onSignOut }: EmailConfirmationPendingProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleResendConfirmation = async () => {
    setIsResending(true)
    setResendStatus('idle')

    try {
      const { error } = await auth.resendConfirmation(email)
      if (error) {
        setResendStatus('error')
        setMessage(error.message || 'Error al reenviar el correo.')
      } else {
        setResendStatus('success')
        setMessage('Correo de confirmacion reenviado.')
      }
    } catch (error) {
      setResendStatus('error')
      setMessage('Error inesperado al reenviar el correo.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell title="Confirma tu email" subtitle="Antes de continuar, activa tu cuenta desde el enlace enviado.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <p className="font-semibold">Revision requerida</p>
          </div>
          <p>
            Te enviamos un enlace a <strong>{email}</strong>. Revisa tambien la carpeta de spam.
          </p>
        </div>

        {resendStatus === 'success' && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {resendStatus === 'error' && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleResendConfirmation}
            disabled={isResending}
            loading={isResending}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isResending ? 'Reenviando...' : 'Reenviar correo'}
          </Button>
          <Button onClick={onSignOut} variant="ghost" className="w-full">
            Cerrar sesion y usar otra cuenta
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
