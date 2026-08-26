import { DeviceMobile, AppleLogo, GooglePlayLogo, CheckCircle, NavigationArrow } from '@phosphor-icons/react'

import { motion } from 'motion/react'

const features = [
  'Ghi lại chuyến đi (Video + GPX Trajectory) để trích xuất tự động qua AI',
  'Dẫn đường thông minh và cảnh báo biển báo theo đúng chiều di chuyển của xe',
  'Nhận nhiệm vụ khảo sát thực địa và tái thẩm định các biển báo cũ',
  'Tích lũy điểm thưởng tín dụng (Credit) và quản lý ví minh bạch',
]

export default function ProductApp() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#030708] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-[24px] p-8 sm:p-14 border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#061418] via-[#040b0d] to-[#020506]">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c4de]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs font-semibold text-[#00c4de]">
                <DeviceMobile size={16} weight="bold" />
                <span>Ứng dụng di động SignTrustMap • iOS & Android</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
                Ứng Dụng Khảo Sát &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4de] to-[#007b8b]">
                  Dẫn Đường Cảnh Báo
                </span>
              </h1>

              <p className="text-base text-gray-300 leading-relaxed mb-8 max-w-lg">
                Biến thiết bị di động hoặc camera hành trình thành công cụ khảo sát dữ liệu giao thông, hỗ trợ cảnh báo lái xe an toàn và nhận thưởng tín dụng giá trị.
              </p>

              {/* Feature Checklist */}
              <ul className="flex flex-col gap-3.5 mb-10">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle size={20} weight="fill" className="text-[#00c4de] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Store Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all active:scale-[0.98]"
                >
                  <AppleLogo size={24} weight="fill" className="text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Tải về trên</p>
                    <p className="text-xs font-bold leading-none text-white">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all active:scale-[0.98]"
                >
                  <GooglePlayLogo size={24} weight="fill" className="text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Tải về trên</p>
                    <p className="text-xs font-bold leading-none text-white">Google Play</p>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Right Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-64 h-[510px] bg-black rounded-[36px] border-4 border-gray-700/80 p-3 shadow-2xl relative shadow-[#00c4de]/10 flex flex-col justify-between overflow-hidden">
                {/* Dynamic island notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-900 rounded-full z-20" />

                {/* Phone screen UI */}
                <div className="w-full h-full rounded-[28px] bg-gradient-to-b from-[#08181b] via-[#051114] to-[#020506] p-5 flex flex-col justify-between text-center relative">
                  <div className="pt-6">
                    <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#00c4de] to-[#007b8b] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#00c4de]/30">
                      <NavigationArrow size={24} weight="bold" className="text-black" />
                    </div>
                    <p className="text-sm font-bold text-white font-brand">SignTrustMap</p>
                    <p className="text-[10px] text-[#00c4de] font-mono mt-0.5">CẢNH BÁO THEO HƯỚNG XE</p>
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-left">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span>CÁCH 150M PHÍA TRƯỚC</span>
                      <span className="text-[#00c4de] font-mono font-bold">QCVN 41</span>
                    </div>
                    <p className="text-xs font-bold text-white">P.102 Cấm đi ngược chiều</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-emerald-400 font-mono">
                      <span>Độ tin cậy: 99.4%</span>
                      <span>+20 Credits</span>
                    </div>
                  </div>

                  <div className="pb-2">
                    <div className="w-11 h-11 rounded-full bg-[#00c4de] mx-auto flex items-center justify-center text-black font-bold text-xs shadow-md">
                      TRIP
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
