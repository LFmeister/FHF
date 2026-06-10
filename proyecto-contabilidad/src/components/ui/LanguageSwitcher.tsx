'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { Lang } from '@/lib/i18n'

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'id', flag: '🇮🇩', label: 'ID' },
]

export function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex items-center gap-0.5">
      {LANGS.map(({ code, flag, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          title={label}
          aria-pressed={lang === code}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
            lang === code
              ? variant === 'dark'
                ? 'bg-white/25 text-white ring-1 ring-white/30'
                : 'bg-primary-100 text-primary-800 ring-1 ring-primary-200'
              : variant === 'dark'
              ? 'text-white/60 hover:bg-white/10 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <span className="text-base leading-none">{flag}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
