import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ThemeProvider } from '@/context/ThemeContext'
import { I18nProvider } from '@/context/I18nContext'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/common/ScrollToTop'
import Home from '@/pages/Home'
import ProductMap from '@/pages/ProductMap'
import ProductApp from '@/pages/ProductApp'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Docs from '@/pages/Docs'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[50dvh] flex items-center justify-center w-full">
      <p className="text-gray-400 text-sm">{title} — Đang được cập nhật</p>
    </div>
  )
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-[100dvh] w-full relative transition-colors">
              <AnnouncementBar />
              <Navbar />
              <main className="flex-1 w-full flex flex-col">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/map" element={<ProductMap />} />
                  <Route path="/product/app" element={<ProductApp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/about" element={<PlaceholderPage title="Về chúng tôi" />} />
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
