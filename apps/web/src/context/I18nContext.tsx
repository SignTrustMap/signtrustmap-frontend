import { createContext, useContext, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { LANG_STORAGE_KEY, type SupportedLang } from '@/i18n'

interface I18nContextType {
  lang: SupportedLang
  setLang: (lang: SupportedLang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()
  const lang = (i18nInstance.language as SupportedLang) ?? 'vi'

  const setLang = (newLang: SupportedLang) => {
    i18n.changeLanguage(newLang)
    localStorage.setItem(LANG_STORAGE_KEY, newLang)
  }

  const toggleLang = () => {
    setLang(lang === 'vi' ? 'en' : 'vi')
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
