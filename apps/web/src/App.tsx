import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Home from '@/pages/Home'
import ProductMap from '@/pages/ProductMap'
import ProductApp from '@/pages/ProductApp'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[50dvh] flex items-center justify-center">
      <p className="text-gray-400 text-sm">{title} — Coming soon</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-[100dvh]">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/map" element={<ProductMap />} />
            <Route path="/product/app" element={<ProductApp />} />
            <Route path="/about" element={<PlaceholderPage title="Về chúng tôi" />} />
            <Route path="/blog" element={<PlaceholderPage title="Blog" />} />
            <Route path="/docs" element={<PlaceholderPage title="Tài liệu" />} />
          </Routes>
        </main>
        {/* Hide footer on full-screen map page */}
        <Routes>
          <Route path="/product/map" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
