'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
      const { error: authError } = await auth.signUp(data.email, data.password, data.fullName)

      if (authError) {
        let errorMessage = authError.message

        if (errorMessage.includes('User already registered') || errorMessage.includes('already registered')) {
          errorMessage = 'Este correo ya esta registrado. Prueba iniciar sesion.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'La contrasena debe tener al menos 6 caracteres.'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'El formato del correo no es valido.'
        } else if (errorMessage.includes('Email rate limit exceeded')) {
          errorMessage = 'Demasiados intentos. Espera unos minutos.'
        }

        setError(errorMessage)
        return
      }

      setSuccess(true)
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
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-base font-semibold">Registro completado</p>
        </div>
        <p>
          Enviamos un correo de confirmacion. Revisa bandeja principal y spam, luego confirma para iniciar sesion.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => router.push('/auth/login')} className="w-full sm:w-auto">
            Ir al login
          </Button>
          <p className="self-center text-xs text-emerald-800">Redireccion automatica en {countdown}s</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
          Nombre completo
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="fullName" type="text" placeholder="Tu nombre y apellido" className="pl-10" {...register('fullName')} error={errors.fullName?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" type="email" placeholder="tu@email.com" className="pl-10" {...register('email')} error={errors.email?.message} />
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
            {...register('password')}
            error={errors.password?.message}
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

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
          Confirmar contrasena
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="********"
            className="pl-10 pr-10"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={isLoading} disabled={isLoading}>
        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
        Ya tienes una cuenta?{' '}
        <Link href="/auth/login" className="font-semibold text-primary-700 hover:text-primary-900">
          Iniciar sesion
        </Link>
      </div>
    </form>
  )
}
