import { DeviceMobile, AppleLogo, GooglePlayLogo, CheckCircle } from '@phosphor-icons/react'
import { motion } from 'motion/react'

const features = [
  'Chụp ảnh và ghi nhận biển báo GPS',
  'Nhận thưởng tín dụng khi dữ liệu được xác thực',
  'Xem bản đồ toàn bộ khu vực khảo sát',
  'Nhận nhiệm vụ khảo sát từ hệ thống',
]

export default function ProductApp() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F8F7F7]">
      {/* Hero */}
      <section className="py-24 bg-white border-b border-[#E8E4E3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-[#d3f7ff] text-[#007b8b] text-xs font-semibold">
                <DeviceMobile size={14} weight="bold" />
                Tải miễn phí · iOS & Android
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5"
                style={{ fontFamily: 'Public Sans, sans-serif' }}
              >
                Tải ứng dụng
                <br />
                <span className="text-[#007b8b]">SignTrustMap</span>
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-md">
                Trở thành một phần của cộng đồng xây dựng bản đồ biển báo giao thông đáng tin cậy nhất Việt Nam.
              </p>

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-10">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle size={18} weight="fill" className="text-[#007b8b] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Store buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-[8px] hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  <AppleLogo size={22} weight="fill" />
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Tải trên</p>
                    <p className="text-sm font-semibold leading-none">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-[8px] hover:bg-gray-800 active:scale-[0.98] transition-all"
                >
                  <GooglePlayLogo size={22} weight="fill" />
                  <div>
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Tải trên</p>
                    <p className="text-sm font-semibold leading-none">Google Play</p>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* App mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center"
            >
              <div className="w-64 h-[520px] bg-gray-900 rounded-[32px] border-4 border-gray-700 flex items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10" />
                <div className="w-full h-full bg-gradient-to-b from-[#0a2226] to-[#007b8b]/30 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="w-16 h-16 rounded-[18px] bg-[#007b8b] flex items-center justify-center mb-2">
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                      <path d="M14 6 L20 10 L20 18 L14 22 L8 18 L8 10 Z" stroke="white" strokeWidth="1.5" fill="none" />
                      <circle cx="14" cy="14" r="2.5" fill="white" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-bold" style={{ fontFamily: 'Arvo, serif' }}>SignTrustMap</p>
                  <p className="text-gray-400 text-xs">Bản đồ biển báo tin cậy</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
