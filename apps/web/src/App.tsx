import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/context/ThemeContext'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
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
  AboutPage,
  SurveyStudioPage,
  SurveyHistoryPage,
  SurveyRevalidationPage,
  ReviewerHubPage,
  CandidateReviewPage,
  RevalidationReviewPage,
  WalletPage,
  CatalogPage,
  TermsPage,
  PrivacyPage,
  ProfilePage,
  Forbidden403Page,
  NotFound404Page,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '@/features'

type CommunityRole = 'driver' | 'surveyor' | 'reviewer'
type AppRole = CommunityRole | 'staff' | 'admin'

/**
 * Route guard strictly enforcing specific roles.
 * Unauthenticated users -> /login with return target.
 * Authenticated users without permission -> /403.
 */
function RoleRoute({
  allow,
  children,
}: {
  allow: AppRole[]
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  const role = user?.role?.trim().toLowerCase() as AppRole | undefined

  if (!role || !allow.includes(role)) {
    // In-place render: Keep original URL in address bar (standard practice for easy access sharing & refresh)
    return <Forbidden403Page />
  }

  return <>{children}</>
}

/**
 * Route guard for general authenticated users (Profile, Account).
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
 * Automatically redirect any Ops Portal specific routes (e.g. /reports, /tasks, /users...)
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
      '/users',
      '/exports',
      '/escalations',
      '/spatial-data',
      '/mlops',
      '/aiops',
      '/catalog/new-types',
      '/catalog/missing-types',
    ]

    const isOpsRoute = opsPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

    if (isOpsRoute) {
      const destination = `${opsPortalUrl}${pathname}${search}`
      window.location.replace(destination)
    }
  }, [pathname, search])

  return null
}

function AppLayout() {
  const location = useLocation()
  const isBarePage = location.pathname === '/about'

  return (
    <div className="flex flex-col min-h-[100dvh] w-full relative transition-colors">
      {!isBarePage && (
        <div className="sticky top-0 z-40 w-full">
          <AnnouncementBar />
          <Navbar />
        </div>
      )}
      <main className="flex-1 w-full flex flex-col">
        <Routes>
          {/* Public & Information Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/product/map" element={<ProductMap />} />
          <Route path="/product/app" element={<ProductApp />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          {/* Error Routes */}
          <Route path="/403" element={<Forbidden403Page />} />
          <Route path="/404" element={<NotFound404Page />} />

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
          <Route
            path="/forgot-password"
            element={
              <GuestOnlyRoute>
                <ForgotPasswordPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          {/* Surveyor Workspace Routes */}
          <Route
            path="/survey"
            element={
              <RoleRoute allow={['surveyor']}>
                <SurveyStudioPage />
              </RoleRoute>
            }
          />
          <Route
            path="/survey/history"
            element={
              <RoleRoute allow={['surveyor']}>
                <SurveyHistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/survey/revalidation"
            element={
              <RoleRoute allow={['surveyor']}>
                <SurveyRevalidationPage />
              </RoleRoute>
            }
          />

          {/* Reviewer Workspace Routes */}
          <Route
            path="/review"
            element={
              <RoleRoute allow={['reviewer']}>
                <ReviewerHubPage />
              </RoleRoute>
            }
          />
          <Route
            path="/review/candidate"
            element={
              <RoleRoute allow={['reviewer']}>
                <CandidateReviewPage />
              </RoleRoute>
            }
          />
          <Route
            path="/review/revalidate"
            element={
              <RoleRoute allow={['reviewer']}>
                <RevalidationReviewPage />
              </RoleRoute>
            }
          />

          {/* Community Wallet (Driver, Surveyor, Reviewer) */}
          <Route
            path="/wallet"
            element={
              <RoleRoute allow={['driver', 'surveyor', 'reviewer']}>
                <WalletPage />
              </RoleRoute>
            }
          />

          {/* Authenticated Common Profile */}
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

          {/* Fallback Catch-all: Unmatched routes display dedicated 404 page */}
          <Route path="*" element={<NotFound404Page />} />
        </Routes>
      </main>
      {!isBarePage && <Footer />}
      {!isBarePage && <ScrollToTop />}
    </div>
  )
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <OpsRouteRedirectHandler />
                <AppLayout />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}

