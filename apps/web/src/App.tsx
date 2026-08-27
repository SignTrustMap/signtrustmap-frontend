import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/context/ThemeContext'
import { I18nProvider } from '@/context/I18nContext'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/common/ScrollToTop'
import { opsPortalUrl } from '@/config/env'
import Home from '@/pages/Home'
import ProductMap from '@/pages/ProductMap'
import ProductApp from '@/pages/ProductApp'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Docs from '@/pages/Docs'

function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-[50dvh] flex items-center justify-center w-full">
      <p className="text-gray-400 text-sm">{t(titleKey)} - {t('placeholder.coming_soon')}</p>
    </div>
  )
}

/**
 * Automatically redirect any Ops Portal specific routes (e.g. /reports, /tasks, /candidates...)
 * to the Ops Portal subdomain in case user types or deletes the "ops." prefix.
 */
function OpsRouteRedirectHandler() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const opsPrefixes = [
      '/reports',
      '/tasks',
      '/candidates',
      '/credits',
      '/audit-logs',
      '/settings',
      '/roles',
      '/staff',
    ]

    const isOpsRoute = opsPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

    if (isOpsRoute) {
      const destination = `${opsPortalUrl}${pathname}${search}`
      window.location.replace(destination)
    }
  }, [pathname, search])

  return null
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            <OpsRouteRedirectHandler />
            <div className="flex flex-col min-h-[100dvh] w-full relative transition-colors">
              <div className="sticky top-0 z-40 w-full">
                <AnnouncementBar />
                <Navbar />
              </div>
              <main className="flex-1 w-full flex flex-col">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/map" element={<ProductMap />} />
                  <Route path="/product/app" element={<ProductApp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/about" element={<PlaceholderPage titleKey="placeholder.about" />} />
                </Routes>
              </main>
              <Footer />
              <ScrollToTop />
            </div>
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}
