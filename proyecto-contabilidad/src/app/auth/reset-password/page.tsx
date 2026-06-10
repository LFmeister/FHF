'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLanguage } from '@/context/LanguageContext'
import { z } from 'zod'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const tr = t.auth.reset

  const resetPasswordSchema = z
    .object({
      password: z.string().min(6, tr.errorPasswordMin),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tr.errorPasswordMatch,
      path: ['confirmPassword'],
    })

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { session } = await auth.getSession()
        setIsValidSession(!!session)
      } catch (error) {
        setIsValidSession(false)
      }
    }
    checkSession()
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await auth.updatePassword(data.password)
      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err) {
      setError(tr.errorUnexpected)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={tr.title}
      subtitle={tr.subtitle}
      backHref="/auth/login"
      backLabel={tr.backLabel}
    >
      {isValidSession === null && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700" />
          <p className="mt-3 text-sm text-slate-600">{tr.verifying}</p>
        </div>
      )}

      {isValidSession === false && (
        <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <p className="font-semibold">{tr.invalidLink}</p>
          </div>
          <p className="text-sm text-red-700">{tr.invalidMessage}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => router.push('/auth/login')}>
              {tr.goLogin}
            </Button>
            <Button onClick={() => router.push('/auth/forgot-password')}>{tr.requestNew}</Button>
          </div>
        </div>
      )}

      {isValidSession && success && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-semibold">{tr.successTitle}</p>
          </div>
          <p className="text-sm text-emerald-800">{tr.successMessage}</p>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>
            {tr.goToDashboard}
          </Button>
        </div>
      )}

      {isValidSession && !success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              {tr.newPassword}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                className="pl-10 pr-10"
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

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
              {tr.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="********"
                className="pl-10 pr-10"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
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

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            {tr.submit}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
