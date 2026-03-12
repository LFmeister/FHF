'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
        if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
          setError('Debes confirmar tu correo electronico antes de iniciar sesion.')
        } else {
          setError(authError.message)
        }
        return
      }

      if (authData.user) {
        const isEmailConfirmed = await auth.isEmailConfirmed()
        if (!isEmailConfirmed) {
          setError('Debes confirmar tu correo electronico antes de acceder.')
          await auth.signOut()
          return
        }
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            className="pl-10"
            style={{ fontSize: '16px' }}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Contrasena
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="********"
            className="pl-10 pr-10"
            style={{ fontSize: '16px' }}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Link href="/auth/forgot-password" className="text-sm font-medium text-primary-700 hover:text-primary-900">
          Olvide mi contrasena
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={isLoading}>
        Iniciar sesion
      </Button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
        No tienes cuenta?{' '}
        <Link href="/auth/register" className="font-semibold text-primary-700 hover:text-primary-900">
          Registrate aqui
        </Link>
      </div>
    </form>
  )
}
