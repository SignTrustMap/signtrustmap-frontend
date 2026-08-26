import { Link } from 'react-router-dom'
import { MapTrifold, FunnelSimple, Info } from '@phosphor-icons/react'

export default function ProductMap() {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8E4E3] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapTrifold size={20} weight="duotone" className="text-[#007b8b]" />
          <div>
            <h1 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Bản đồ biển báo giao thông
            </h1>
            <p className="text-xs text-gray-400">Dữ liệu được xác thực bởi cộng đồng</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-[#E8E4E3] rounded-[4px] hover:border-[#007b8b] hover:text-[#007b8b] transition-colors">
            <FunnelSimple size={14} />
            Bộ lọc
          </button>
          <Link
            to="/product/app"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#007b8b] rounded-[4px] hover:bg-[#006272] transition-colors"
          >
            Đóng góp dữ liệu →
          </Link>
        </div>
      </div>

      {/* Map area (placeholder — Leaflet sẽ mount ở đây khi tích hợp) */}
      <div className="flex-1 bg-[#e8f4f6] relative flex items-center justify-center">
        {/* Simulated map tiles pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,123,139,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,123,139,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Center message */}
        <div className="relative z-10 text-center bg-white/90 backdrop-blur-sm rounded-[12px] border border-[#E8E4E3] p-8 max-w-sm shadow-md">
          <MapTrifold size={40} weight="duotone" className="text-[#007b8b] mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Bản đồ tương tác
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Tính năng bản đồ đang được tích hợp với Leaflet. Sau khi hoàn thiện, bạn sẽ thấy toàn bộ biển báo đã xác thực tại đây.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#007b8b] bg-[#d3f7ff] rounded-[8px] px-3 py-2">
            <Info size={14} />
            <span>142k+ biển báo · Cập nhật theo thời gian thực</span>
          </div>
        </div>
      </div>
    </div>
  )
}
