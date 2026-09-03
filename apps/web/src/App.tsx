import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/context/ThemeContext'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/common/ScrollToTop'
import { opsPortalUrl } from '@/config/env'
import {
  Home,
  ProductMap,
  ProductApp,
  Login,
  Signup,
  Docs,
  SurveyStudioPage,
  SurveyHistoryPage,
  ReviewerWorkspacePage,
  WalletPage,
  CatalogPage,
  TermsPage,
  PrivacyPage,
  ProfilePage,
} from '@/pages'

function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-[50dvh] flex items-center justify-center w-full">
      <p className="text-gray-400 text-sm">{t(titleKey)} - {t('placeholder.coming_soon')}</p>
    </div>
  )
}

/**
 * Route guard for authenticated users only.
 * Redirects unauthenticated users to /login with return target.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

/**
 * Route guard for guests only (unauthenticated).
 * If user is already logged in, redirects them immediately to Home '/'.
 */
function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
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
          <AuthProvider>
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

                    {/* Guest-only routes: Logged in users are automatically redirected to '/' */}
                    <Route
                      path="/login"
                      element={
                        <GuestOnlyRoute>
                          <Login />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <GuestOnlyRoute>
                          <Signup />
                        </GuestOnlyRoute>
                      }
                    />

                    <Route path="/docs" element={<Docs />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/about" element={<PlaceholderPage titleKey="placeholder.about" />} />

                    {/* Role-specific accessible workspaces with Route Guards */}
                    <Route
                      path="/survey"
                      element={
                        <ProtectedRoute>
                          <SurveyStudioPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/survey/history"
                      element={
                        <ProtectedRoute>
                          <SurveyHistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/review"
                      element={
                        <ProtectedRoute>
                          <ReviewerWorkspacePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/wallet"
                      element={
                        <ProtectedRoute>
                          <WalletPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <ScrollToTop />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}
