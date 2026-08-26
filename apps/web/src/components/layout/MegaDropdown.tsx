import {
  MapTrifold,
  DeviceMobile,
  ArrowRight,
  Brain,
  ShieldCheck,
  Compass,
  Code,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface ProductItem {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  badge?: string
  category: string
}

const productItems: ProductItem[] = [
  {
    icon: <MapTrifold size={24} weight="duotone" className="text-[#00c4de]" />,
    title: 'Bản Đồ Biển Báo 3D',
    description: 'Truy cập dữ liệu biển báo giao thông thời gian thực với toạ độ GPS chuẩn xác.',
    href: '/product/map',
    badge: 'Phổ biến',
    category: 'explore',
  },
  {
    icon: <Brain size={24} weight="duotone" className="text-[#00c4de]" />,
    title: 'Vision AI Classifier',
    description: 'Tự động bóc tách và phân loại biển báo QCVN 41 từ hình ảnh Dashcam.',
    href: '/product/map',
    badge: 'Mới',
    category: 'explore',
  },
  {
    icon: <DeviceMobile size={24} weight="duotone" className="text-[#00c4de]" />,
    title: 'SignTrustMap Mobile App',
    description: 'Ứng dụng khảo sát thực địa cho Surveyor & Driver trên iOS & Android.',
    href: '/product/app',
    category: 'apps',
  },
  {
    icon: <ShieldCheck size={24} weight="duotone" className="text-[#00c4de]" />,
    title: 'Trust Score Engine',
    description: 'Hệ thống đánh giá độ tin cậy đa tầng và chống gian lận dữ liệu định vị.',
    href: '/product/map',
    category: 'apps',
  },
  {
    icon: <Code size={24} weight="duotone" className="text-[#00c4de]" />,
    title: 'Geospatial API & SDK',
    description: 'Tích hợp dữ liệu biển báo vào các ứng dụng bản đồ & xe tự hành.',
    href: '/docs',
    badge: 'API',
    category: 'developer',
  },
]

const categories = [
  { id: 'explore', label: 'Bản đồ & Dữ liệu', icon: <Compass size={16} /> },
  { id: 'apps', label: 'Ứng dụng & Xác thực', icon: <DeviceMobile size={16} /> },
  { id: 'developer', label: 'Dành cho Lập trình viên', icon: <Code size={16} /> },
]

interface MegaDropdownProps {
  onClose: () => void
}

export function MegaDropdown({ onClose }: MegaDropdownProps) {
  const [selectedCat, setSelectedCat] = useState<string>('explore')

  const filteredItems = productItems.filter(
    (item) => selectedCat === 'all' || item.category === selectedCat
  )

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[780px] max-w-[calc(100vw-2rem)]">
      {/* Decorative arrow */}
      <div className="mx-auto w-fit">
        <div className="w-3 h-3 bg-[#0a1619] border-l border-t border-white/10 rotate-45 translate-y-1.5 ml-16" />
      </div>

      <div className="bg-[#081215]/95 backdrop-blur-2xl border border-white/10 rounded-[14px] shadow-2xl overflow-hidden flex flex-col md:flex-row text-gray-200">
        {/* Left Sidebar */}
        <div className="w-full md:w-60 bg-[#050e10] p-4 border-b md:border-b-0 md:border-r border-white/10 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 py-1">
            Danh mục sản phẩm
          </p>
          {categories.map((cat) => {
            const active = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium text-left transition-all ${
                  active
                    ? 'bg-[#007b8b]/20 text-[#00c4de] border border-[#00c4de]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={active ? 'text-[#00c4de]' : 'text-gray-500'}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}

          <div className="mt-auto pt-4 border-t border-white/5">
            <Link
              to="/product/map"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-[#00c4de] transition-colors"
            >
              <span>Xem tất cả danh mục</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                onClick={onClose}
                className="group flex flex-col justify-between p-3.5 rounded-[10px] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-[#00c4de]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-[6px] bg-[#007b8b]/20 flex items-center justify-center">
                      {item.icon}
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00c4de]/20 text-[#00c4de] border border-[#00c4de]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00c4de] transition-colors mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#00c4de] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Khám phá</span>
                  <ArrowRight size={10} weight="bold" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Dữ liệu mở theo tiêu chuẩn QCVN 41:2019/BGTVT</span>
            <Link
              to="/docs"
              onClick={onClose}
              className="text-[#00c4de] hover:underline flex items-center gap-1 font-medium"
            >
              Tài liệu kỹ thuật <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
