'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { Lang } from '@/lib/i18n'

const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: 'es', label: 'ES', native: 'Español' },
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'id', label: 'ID', native: 'Indonesia' },
]

export function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border p-1 ${
        variant === 'dark'
          ? 'border-white/20 bg-white/10'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      {LANGS.map(({ code, label, native }) => {
        const isActive = lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            title={native}
            aria-pressed={isActive}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              isActive
                ? variant === 'dark'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white text-primary-800 shadow-sm ring-1 ring-primary-200'
                : variant === 'dark'
                ? 'text-white/70 hover:bg-white/15 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
