import { Link } from 'react-router-dom'
import { MapTrifold, FunnelSimple, Info, Compass, ArrowRight } from '@phosphor-icons/react'

export default function ProductMap() {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] bg-[#030708] text-white">
      {/* Top Map Header */}
      <div className="bg-[#071316] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#007b8b]/30 flex items-center justify-center text-[#00c4de]">
            <MapTrifold size={20} weight="duotone" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Bản Đồ Biển Báo Giao Thông 3D
            </h1>
            <p className="text-[11px] text-gray-400">Dữ liệu phân tán được xác thực bởi AI & cộng đồng</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 border border-white/15 rounded-full hover:border-[#00c4de] hover:text-[#00c4de] bg-white/5 transition-colors">
            <FunnelSimple size={13} />
            <span>Bộ lọc QCVN 41</span>
          </button>
          <Link
            to="/product/app"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-black bg-[#00c4de] hover:bg-[#38dbf1] rounded-full shadow-md shadow-[#00c4de]/20 transition-all"
          >
            <span>Đóng góp dữ liệu</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="flex-1 bg-[#040b0d] relative flex items-center justify-center overflow-hidden">
        {/* Subtle Map Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #00c4de 1px, transparent 1px), linear-gradient(to right, #007b8b 1px, transparent 1px), linear-gradient(to bottom, #007b8b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Center Interactive Simulated Container */}
        <div className="relative z-10 text-center glass-panel rounded-[20px] p-8 sm:p-10 max-w-md mx-4 shadow-2xl">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#00c4de] to-[#007b8b] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#00c4de]/20">
            <Compass size={28} weight="duotone" className="text-black" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Bản Đồ Đang Được Kết Nối
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Module Leaflet / WebGL tile server đang kết nối với hạ tầng dữ liệu. Bạn có thể tra cứu hơn 142,000 biển báo trực tiếp tại đây.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-[#00c4de] bg-[#007b8b]/20 border border-[#00c4de]/30 rounded-full px-4 py-2">
            <Info size={14} weight="bold" />
            <span className="font-mono text-[11px]">142,381 nodes • 98.4% Trust Score</span>
          </div>
        </div>
      </div>
    </div>
  )
}
