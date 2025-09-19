'use client'

import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
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
        setMessage(error.message || 'Error al reenviar el correo de confirmación')
      } else {
        setResendStatus('success')
        setMessage('Correo de confirmación reenviado exitosamente')
      }
    } catch (error) {
      setResendStatus('error')
      setMessage('Error inesperado al reenviar el correo')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-primary-800">
            Confirma tu correo electrónico
          </CardTitle>
          <CardDescription className="text-primary-600">
            Te hemos enviado un enlace de confirmación
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Verificación requerida
                  </p>
                  <p className="text-sm text-yellow-700">
                    Hemos enviado un enlace de confirmación a:
                  </p>
                  <p className="text-sm font-medium text-yellow-800 mt-1">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2 mb-6">
              <p>Para acceder a tu cuenta, debes:</p>
              <ol className="text-left space-y-1 ml-4">
                <li>1. Revisar tu bandeja de entrada</li>
                <li>2. Hacer clic en el enlace de confirmación</li>
                <li>3. Regresar aquí para iniciar sesión</li>
              </ol>
            </div>

            {resendStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg mb-4">
                <CheckCircle className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}

            {resendStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendConfirmation}
                disabled={isResending}
                loading={isResending}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isResending ? 'Reenviando...' : 'Reenviar correo de confirmación'}
              </Button>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-3">
                  ¿No encuentras el correo? Revisa tu carpeta de spam.
                </p>
                <Button
                  onClick={onSignOut}
                  variant="ghost"
                  className="text-sm"
                >
                  Cerrar sesión y usar otra cuenta
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
