'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { auth } from '@/lib/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await auth.signIn(data.email, data.password)

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Error inesperado. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0">
      <CardHeader className="space-y-1 pb-4 sm:pb-6">
        <CardTitle className="text-xl sm:text-2xl text-center text-primary-800">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base text-primary-600">
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10 h-12 text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Previene zoom en iOS
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-12 h-12 text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Previene zoom en iOS
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold" 
            loading={isLoading}
          >
            Iniciar Sesión
          </Button>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/auth/register" 
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
