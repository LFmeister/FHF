'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { auth } from '@/lib/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })


  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await auth.signUp(
        data.email,
        data.password,
        data.fullName
      )

      if (authError) {
        // Mejorar los mensajes de error
        let errorMessage = authError.message
        
        if (errorMessage.includes('User already registered') || 
            errorMessage.includes('already been registered') ||
            errorMessage.includes('already registered')) {
          errorMessage = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'El formato del correo electrónico no es válido.'
        } else if (errorMessage.includes('Signup is disabled')) {
          errorMessage = 'El registro está temporalmente deshabilitado. Intenta más tarde.'
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          errorMessage = 'Se han enviado demasiados correos. Espera unos minutos antes de intentar nuevamente.'
        } else if (errorMessage.includes('Invalid password')) {
          errorMessage = 'La contraseña no cumple con los requisitos de seguridad.'
        }
        
        setError(errorMessage)
        return
      }

      setSuccess(true)
      
      // Iniciar countdown de 10 segundos
      let timeLeft = 10
      setCountdown(timeLeft)
      
      const countdownInterval = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval)
          router.push('/auth/login')
        }
      }, 1000)
    } catch (err) {
      setError('Error inesperado. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const goToLogin = () => {
    router.push('/auth/login')
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800">¡Registro Exitoso!</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm font-medium text-blue-800">
                  Confirma tu correo electrónico
                </p>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Te hemos enviado un enlace de confirmación a tu correo. <strong>Debes hacer clic en él antes de poder iniciar sesión.</strong>
              </p>
              <div className="bg-blue-100 rounded-md p-2">
                <p className="text-xs text-blue-600">
                  💡 Revisa también tu carpeta de spam si no encuentras el correo.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={goToLogin}
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                Ir al Login
              </Button>
              
              <p className="text-xs text-gray-500">
                Redirección automática en {countdown} segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Completa los datos para crear tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-4 text-sm bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800 mb-1">Error en el registro</p>
                  <p className="text-red-700">{error}</p>
                  {error.includes('ya está registrado') && (
                    <Link href="/auth/login" className="inline-block mt-2 text-sm text-red-600 hover:text-red-800 underline">
                      ¿Ya tienes cuenta? Inicia sesión aquí
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Tu nombre completo"
                className="pl-10"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>

          <div className="text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
