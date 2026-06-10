'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { Lang } from '@/lib/i18n'

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: 'es', label: 'ES', native: 'Español',   flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'en', label: 'EN', native: 'English',   flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'id', label: 'ID', native: 'Indonesia', flag: 'https://flagcdn.com/w40/id.png' },
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
      {LANGS.map(({ code, label, native, flag }) => {
        const isActive = lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            title={native}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
              isActive
                ? variant === 'dark'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white text-primary-800 shadow-sm ring-1 ring-primary-200'
                : variant === 'dark'
                ? 'text-white/70 hover:bg-white/15 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flag}
              alt={label}
              width={20}
              height={14}
              className="rounded-[2px] object-cover"
            />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
