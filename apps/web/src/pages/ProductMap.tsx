import { Link } from 'react-router-dom'
import { MapTrifold, FunnelSimple, Info, Compass, ArrowRight, CheckCircle } from '@phosphor-icons/react'

export default function ProductMap() {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] bg-[#030708] text-white">
      {/* Top Map Header */}
      <div className="bg-[#071316] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#007b8b]/30 flex items-center justify-center text-[#00c4de]">
            <MapTrifold size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Bản Đồ Biển Báo Giao Thông GIS
            </h1>
            <p className="text-xs text-gray-400">
              Dữ liệu không gian PostGIS được xác thực qua cơ chế Weighted Consensus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-300 border border-white/15 rounded-full hover:border-[#00c4de] hover:text-[#00c4de] bg-white/5 transition-colors">
            <FunnelSimple size={14} />
            <span>Bộ lọc QCVN 41 (P, R, W, I, S)</span>
          </button>
          <Link
            to="/product/app"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-black bg-[#00c4de] hover:bg-[#38dbf1] rounded-full shadow-md shadow-[#00c4de]/20 transition-all"
          >
            <span>Đóng góp dữ liệu</span>
            <ArrowRight size={14} weight="bold" />
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
        <div className="relative z-10 text-center glass-panel rounded-[20px] p-8 sm:p-12 max-w-lg mx-4 shadow-2xl">
          <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#00c4de] to-[#007b8b] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00c4de]/20">
            <Compass size={32} weight="duotone" className="text-black" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Hạ Tầng Bản Đồ GIS Trực Tuyến
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            Hệ thống đang tích hợp bộ phân phối Tile Server thời gian thực. Hỗ trợ tra cứu biển báo theo tọa độ địa lý, hướng áp dụng giao thông và hình ảnh minh chứng thực tế.
          </p>

          <div className="flex flex-col gap-2.5 text-left bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-[#00c4de] shrink-0" />
              <span>Phân loại tự động qua mô hình YOLO12 + CLIP</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-[#00c4de] shrink-0" />
              <span>Kiểm định đa tầng qua Reviewer Workspace & Độ tin cậy</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-[#00c4de] shrink-0" />
              <span>Theo dõi độ tươi (Freshness) và tạo nhiệm vụ tái thẩm định</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-[#00c4de] bg-[#007b8b]/20 border border-[#00c4de]/30 rounded-full px-4 py-2">
            <Info size={14} weight="bold" />
            <span className="font-mono text-xs">Chuẩn hóa QCVN 41:2019/BGTVT • PostGIS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
