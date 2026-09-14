import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// VI locales
import viCommon from './locales/vi/common.json'
import viHome from './locales/vi/home.json'
import viProduct from './locales/vi/product.json'
import viDocs from './locales/vi/docs.json'
import viLegal from './locales/vi/legal.json'

// EN locales
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enProduct from './locales/en/product.json'
import enDocs from './locales/en/docs.json'
import enLegal from './locales/en/legal.json'

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
        home: viHome,
        product: viProduct,
        docs: viDocs,
        legal: viLegal,
      },
      en: {
        common: enCommon,
        home: enHome,
        product: enProduct,
        docs: enDocs,
        legal: enLegal,
      },
    },
    lng: localStorage.getItem(LANG_STORAGE_KEY) ?? 'vi',
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'home', 'product', 'docs', 'legal'],
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
