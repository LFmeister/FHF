'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Lang, type Translations } from '@/lib/i18n'

const STORAGE_KEY = 'fhf_language'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (saved && saved in translations) {
      setLangState(saved)
    }
    setMounted(true)
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
  }

  const t = translations[mounted ? lang : 'es'] as unknown as Translations

  return (
    <LanguageContext.Provider value={{ lang: mounted ? lang : 'es', setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
