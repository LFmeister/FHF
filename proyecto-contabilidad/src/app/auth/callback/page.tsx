'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'

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

        // Extraer email si viene en query o hash
        let foundEmail = searchParams.get('email') || ''
        if (!foundEmail && typeof window !== 'undefined') {
          const hashForEmail = window.location.hash.substring(1)
          const hashEmailParams = new URLSearchParams(hashForEmail)
          foundEmail = hashEmailParams.get('email') || ''
        }
        if (foundEmail) setEmail(foundEmail)

        // 1) Intentar obtener sesión desde URL leyendo el hash (#access_token/#refresh_token)
        const { set: setFromHash, error: setHashError } = await auth.setSessionFromHash()
        if (setFromHash) {
          setStatus('success')
          setMessage('¡Correo electrónico confirmado exitosamente!')
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }

        // 2) Si falla, intentar con query param ?code=
        // Obtener parámetros de la URL (query params)
        let code = searchParams.get('code')
        let error = searchParams.get('error')
        let errorDescription = searchParams.get('error_description')

        // Si no hay parámetros en query, revisar en hash fragment por posibles errores
        if (!code && typeof window !== 'undefined') {
          const hash = window.location.hash.substring(1) // Remover el #
          const hashParams = new URLSearchParams(hash)
          code = hashParams.get('code') || code
          error = hashParams.get('error') || error
          errorDescription = hashParams.get('error_description') || errorDescription
        }

        if (error) {
          setStatus('error')
          
          // Manejar diferentes tipos de errores
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            setMessage('El enlace de confirmación ha expirado. Puedes solicitar un nuevo enlace.')
          } else if (error === 'access_denied' && errorDescription?.includes('invalid')) {
            setMessage('El enlace de confirmación es inválido. Verifica que hayas copiado la URL completa.')
          } else {
            setMessage(errorDescription || 'Error en la autenticación')
          }
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('Código de confirmación no encontrado en la URL')
          return
        }

        // Intercambiar el código por una sesión
        const { error: exchangeError } = await auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setStatus('error')
          setMessage(exchangeError.message || 'Error al confirmar el correo electrónico')
          return
        }

        setStatus('success')
        setMessage('¡Correo electrónico confirmado exitosamente!')

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)

      } catch (error) {
        setStatus('error')
        setMessage('Error inesperado al procesar la confirmación')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoToLogin = () => {
    router.push('/auth/login')
  }

  const handleResend = async () => {
    setResendInfo(null)
    setResendLoading(true)
    try {
      const target = email.trim()
      if (!target) {
        setResendInfo('Ingresa tu email para reenviar el enlace de confirmación.')
        return
      }
      const { error } = await auth.resendConfirmation(target)
      if (error) {
        setResendInfo(`No se pudo reenviar el correo: ${error.message}`)
      } else {
        setResendInfo('Correo de confirmación reenviado. Revisa tu bandeja y carpeta de spam.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Confirmando correo electrónico...'}
            {status === 'success' && '¡Confirmación exitosa!'}
            {status === 'error' && 'Error de confirmación'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Por favor espera mientras procesamos tu confirmación.'}
            {status === 'success' && 'Tu correo electrónico ha sido confirmado correctamente.'}
            {status === 'error' && 'Hubo un problema al confirmar tu correo electrónico.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  <Mail className="h-4 w-4" />
                  <span>Serás redirigido automáticamente en unos segundos...</span>
                </div>
                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full"
                >
                  Ir al Dashboard
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-3">
                <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">¿Qué puedes hacer?</p>
                  <ul className="text-left space-y-1">
                    {message.includes('expirado') && (
                      <li>• Solicita un nuevo enlace de confirmación</li>
                    )}
                    <li>• Verifica que el enlace esté completo</li>
                  </ul>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium">Tu email</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleResend} disabled={resendLoading}>
                      {resendLoading ? 'Enviando...' : 'Reenviar'}
                    </Button>
                  </div>
                  {resendInfo && (
                    <p className="text-xs text-gray-600 mt-1">{resendInfo}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleGoToLogin}
                    className="flex-1"
                  >
                    Ir al Login
                  </Button>
                  <Button 
                    onClick={() => router.push('/auth/register')}
                    className="flex-1"
                  >
                    Registrarse
                  </Button>
                </div>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>Procesando tu confirmación...</p>
                <p className="text-xs mt-1">Esto puede tomar unos segundos.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
