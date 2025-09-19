'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { auth } from '@/lib/auth'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Iniciando proceso de callback...')
        
        // Obtener parámetros de la URL (query params)
        let code = searchParams.get('code')
        let error = searchParams.get('error')
        let errorDescription = searchParams.get('error_description')

        // Si no hay parámetros en query, revisar en hash fragment
        if (!code && !error && typeof window !== 'undefined') {
          const hash = window.location.hash.substring(1) // Remover el #
          const hashParams = new URLSearchParams(hash)
          
          code = hashParams.get('code')
          error = hashParams.get('error')
          errorDescription = hashParams.get('error_description')
          
          console.log('📊 Parámetros encontrados:', { code: !!code, error, errorDescription })
        }

        if (error) {
          console.error('❌ Error en callback:', { error, errorDescription })
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
          console.error('❌ No se encontró código de confirmación')
          setStatus('error')
          setMessage('Código de confirmación no encontrado en la URL')
          return
        }

        console.log('✅ Código encontrado, intercambiando por sesión...')

        // Intercambiar el código por una sesión
        const { error: exchangeError } = await auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('❌ Error al intercambiar código:', exchangeError)
          setStatus('error')
          setMessage(exchangeError.message || 'Error al confirmar el correo electrónico')
          return
        }

        console.log('🎉 Email confirmado exitosamente!')
        setStatus('success')
        setMessage('¡Correo electrónico confirmado exitosamente!')

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)

      } catch (error) {
        console.error('🚨 Error inesperado en callback:', error)
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

  const handleResendEmail = async () => {
    if (!userEmail) {
      // Si no tenemos el email, redirigir al registro
      router.push('/auth/register')
      return
    }

    setIsResending(true)
    try {
      const { error } = await auth.resendConfirmation(userEmail)
      
      if (error) {
        console.error('Error reenviando email:', error)
        setMessage('Error al reenviar el email. Intenta registrarte nuevamente.')
      } else {
        setMessage('¡Email de confirmación reenviado! Revisa tu bandeja de entrada.')
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      setMessage('Error inesperado. Intenta más tarde.')
    } finally {
      setIsResending(false)
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
                    <li>• Intenta registrarte nuevamente</li>
                    <li>• Contacta al soporte si el problema persiste</li>
                  </ul>
                </div>
                
                {message.includes('expirado') && (
                  <Button 
                    onClick={handleResendEmail}
                    loading={isResending}
                    className="w-full mb-2"
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar Email de Confirmación'}
                  </Button>
                )}
                
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
                    Registrarse Nuevamente
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
