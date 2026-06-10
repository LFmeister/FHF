'use client'

import Link from 'next/link'
import { ShieldCheck, BarChart3, FolderKanban, ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useLanguage } from '@/context/LanguageContext'

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function AuthShell({ title, subtitle, children, backHref, backLabel }: AuthShellProps) {
  const { t } = useLanguage()

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <aside className="auth-panel">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <span className="text-lg font-extrabold tracking-wide">MM</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{t.shell.appName}</h1>
            <p className="mt-2 max-w-md text-sm text-slate-200">{t.shell.tagline}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <p>{t.shell.feature1}</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
              <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <p>{t.shell.feature2}</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
              <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p>{t.shell.feature3}</p>
            </div>
          </div>

          <div className="mt-8">
            <LanguageSwitcher variant="dark" />
          </div>
        </aside>

        <section className="auth-card-wrap flex items-center">
          <div className="w-full rounded-[1.1rem] bg-white p-5 sm:p-7">
            <div className="mb-5">
              <div className="flex items-center justify-between">
                {backHref && backLabel ? (
                  <Link
                    href={backHref}
                    className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {backLabel}
                  </Link>
                ) : (
                  <div />
                )}
                <div className="mb-3 sm:hidden">
                  <LanguageSwitcher variant="light" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
