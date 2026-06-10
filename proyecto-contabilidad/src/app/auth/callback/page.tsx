'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { useLanguage } from '@/context/LanguageContext'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendInfo, setResendInfo] = useState<string | null>(null)

  const { t } = useLanguage()
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
          setMessage(t.auth.callback.confirmedMessage)
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
            setMessage(t.auth.callback.linkExpired)
          } else if (error === 'access_denied' && errorDescription?.includes('invalid')) {
            setMessage(t.auth.callback.linkInvalid)
          } else {
            setMessage(errorDescription || t.auth.callback.authError)
          }
          return
        }

        if (!code) {
          setStatus('error')
          setMessage(t.auth.callback.noCode)
          return
        }

        const { error: exchangeError } = await auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setStatus('error')
          setMessage(exchangeError.message || t.auth.callback.exchangeError)
          return
        }

        setStatus('success')
        setMessage(t.auth.callback.confirmedMessage)
        setTimeout(() => router.push('/dashboard'), 2500)
      } catch (error) {
        setStatus('error')
        setMessage(t.auth.callback.unexpected)
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
        setResendInfo(t.auth.callback.enterEmail)
        return
      }
      const { error } = await auth.resendConfirmation(target)
      if (error) {
        setResendInfo(`${t.auth.callback.resendFailed} ${error.message}`)
      } else {
        setResendInfo(t.auth.callback.resendOk)
      }
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthShell
      title={t.auth.callback.title}
      subtitle={t.auth.callback.subtitle}
      backHref="/auth/login"
      backLabel={t.auth.callback.backLabel}
    >
      {status === 'loading' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-700" />
          <p className="mt-3 text-sm text-slate-600">{t.auth.callback.processing}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-semibold">{t.auth.callback.confirmedTitle}</p>
          </div>
          <p className="text-sm text-emerald-800">{message}</p>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>
            {t.auth.callback.goToDashboard}
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <p className="font-semibold">{t.auth.callback.failedTitle}</p>
          </div>
          <p className="text-sm text-red-700">{message}</p>

          <div className="space-y-2 rounded-xl border border-red-200 bg-white p-3">
            <label className="text-sm font-semibold text-slate-700">{t.auth.callback.resendLabel}</label>
            <div className="flex gap-2">
              <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? t.auth.callback.sending : t.auth.callback.resend}
              </Button>
            </div>
            {resendInfo && (
              <p className="text-xs text-slate-600">{resendInfo}</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => router.push('/auth/login')}>
              {t.auth.callback.goLogin}
            </Button>
            <Button onClick={() => router.push('/auth/register')}>
              {t.auth.callback.register}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
