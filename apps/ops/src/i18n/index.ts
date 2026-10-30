import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// VI locales
import viCommon from './locales/vi/common.json'
import viOps from './locales/vi/ops.json'
import viProduct from './locales/vi/product.json'

// EN locales
import enCommon from './locales/en/common.json'
import enOps from './locales/en/ops.json'
import enProduct from './locales/en/product.json'

export const SUPPORTED_LANGS = ['vi', 'en'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

export const LANG_STORAGE_KEY = 'signtrustmap_lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common: viCommon,
        ops: viOps,
        product: viProduct,
      },
      en: {
        common: enCommon,
        ops: enOps,
        product: enProduct,
      },
    },
    lng: localStorage.getItem(LANG_STORAGE_KEY) ?? 'vi',
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'ops', 'product'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export default i18n
