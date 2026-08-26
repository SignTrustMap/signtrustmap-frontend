import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Home from '@/pages/Home'
import ProductMap from '@/pages/ProductMap'
import ProductApp from '@/pages/ProductApp'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[50dvh] flex items-center justify-center bg-[#030708] text-white w-full">
      <p className="text-gray-400 text-sm">{title} — Đang được cập nhật</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-[100dvh] w-full bg-[#030708] text-white">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/map" element={<ProductMap />} />
            <Route path="/product/app" element={<ProductApp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<PlaceholderPage title="Về chúng tôi" />} />
            <Route path="/blog" element={<PlaceholderPage title="Blog & Tin tức" />} />
            <Route path="/docs" element={<PlaceholderPage title="Tài liệu kỹ thuật" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
