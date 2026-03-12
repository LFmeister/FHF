'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await auth.resetPassword(data.email)
      if (authError) {
        setError(authError.message)
        return
      }
      setSuccess(true)
    } catch (err) {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          <p className="font-semibold">Correo enviado</p>
        </div>
        <p>Te enviamos un enlace de recuperacion. Revisa tambien la carpeta de spam.</p>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email de tu cuenta
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" type="email" placeholder="tu@email.com" className="pl-10" error={errors.email?.message} {...register('email')} />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={isLoading}>
        Enviar instrucciones
      </Button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
        <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-900">
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>
      </div>
    </form>
  )
}
