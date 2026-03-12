'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'
import { AuthShell } from '@/components/auth/AuthShell'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendInfo, setResendInfo] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        let foundEmail = searchParams.get('email') || ''
        if (!foundEmail && typeof window !== 'undefined') {
          const hashForEmail = window.location.hash.substring(1)
          const hashEmailParams = new URLSearchParams(hashForEmail)
          foundEmail = hashEmailParams.get('email') || ''
        }
        if (foundEmail) setEmail(foundEmail)

        const { set: setFromHash } = await auth.setSessionFromHash()
        if (setFromHash) {
          setStatus('success')
          setMessage('Correo confirmado correctamente.')
          setTimeout(() => router.push('/dashboard'), 2500)
          return
        }

        let code = searchParams.get('code')
        let error = searchParams.get('error')
        let errorDescription = searchParams.get('error_description')

        if (!code && typeof window !== 'undefined') {
          const hash = window.location.hash.substring(1)
          const hashParams = new URLSearchParams(hash)
          code = hashParams.get('code') || code
          error = hashParams.get('error') || error
          errorDescription = hashParams.get('error_description') || errorDescription
        }

        if (error) {
          setStatus('error')
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            setMessage('El enlace de confirmacion ha expirado.')
          } else if (error === 'access_denied' && errorDescription?.includes('invalid')) {
            setMessage('El enlace de confirmacion no es valido.')
          } else {
            setMessage(errorDescription || 'Error en la autenticacion.')
          }
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No se encontro codigo de confirmacion en la URL.')
          return
        }

        const { error: exchangeError } = await auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setStatus('error')
          setMessage(exchangeError.message || 'No fue posible confirmar el correo.')
          return
        }

        setStatus('success')
        setMessage('Correo confirmado correctamente.')
        setTimeout(() => router.push('/dashboard'), 2500)
      } catch (error) {
        setStatus('error')
        setMessage('Ocurrio un error inesperado durante la confirmacion.')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  const handleResend = async () => {
    setResendInfo(null)
    setResendLoading(true)
    try {
      const target = email.trim()
      if (!target) {
        setResendInfo('Ingresa tu email para reenviar la confirmacion.')
        return
      }
      const { error } = await auth.resendConfirmation(target)
      if (error) {
        setResendInfo(`No se pudo reenviar: ${error.message}`)
      } else {
        setResendInfo('Correo reenviado. Revisa tu bandeja y spam.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthShell
      title="Confirmacion de cuenta"
      subtitle="Estamos validando tu enlace de autenticacion."
      backHref="/auth/login"
      backLabel="volver al login"
    >
      {status === 'loading' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-700" />
          <p className="mt-3 text-sm text-slate-600">Procesando confirmacion...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-semibold">Cuenta confirmada</p>
          </div>
          <p className="text-sm text-emerald-800">{message}</p>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>
            Ir al dashboard
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <p className="font-semibold">No se pudo confirmar el correo</p>
          </div>
          <p className="text-sm text-red-700">{message}</p>

          <div className="space-y-2 rounded-xl border border-red-200 bg-white p-3">
            <label className="text-sm font-semibold text-slate-700">Reenviar confirmacion</label>
            <div className="flex gap-2">
              <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Enviando...' : 'Reenviar'}
              </Button>
            </div>
            {resendInfo && (
              <p className="text-xs text-slate-600">{resendInfo}</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => router.push('/auth/login')}>
              Ir al login
            </Button>
            <Button onClick={() => router.push('/auth/register')}>
              Registrarse
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
