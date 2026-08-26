import {
  MapTrifold,
  DeviceMobile,
  ArrowRight,
  Brain,
  ShieldCheck,
  Compass,
  Code,
  Coins,
  ArrowsClockwise,
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
    icon: <MapTrifold size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Bản Đồ Biển Báo GIS',
    description: 'Tra cứu, lọc phân cụm và kiểm tra dữ liệu biển báo chuẩn QCVN 41 kèm thông tin hướng giao thông.',
    href: '/product/map',
    badge: 'Cốt lõi',
    category: 'explore',
  },
  {
    icon: <Brain size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Pipeline AI (YOLO12 + CLIP)',
    description: 'Trích xuất tự động từ video Dashcam, theo dõi vật thể BoT-SORT và phân loại vector pgvector.',
    href: '/product/map',
    badge: 'AI Pipeline',
    category: 'explore',
  },
  {
    icon: <DeviceMobile size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Ứng Dụng Khảo Sát & Dẫn Đường',
    description: 'Ghi nhận chuyến đi GPX thực địa và cảnh báo biển báo theo đúng chiều di chuyển của xe.',
    href: '/product/app',
    badge: 'Mobile App',
    category: 'apps',
  },
  {
    icon: <ShieldCheck size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Không Gian Reviewer & Đồng Thuận',
    description: 'Cơ chế xác thực đồng đẳng (Peer Review) và tính điểm đồng thuận trọng số (Weighted Consensus).',
    href: '/product/map',
    category: 'apps',
  },
  {
    icon: <Coins size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Kinh Tế Tín Dụng & Thưởng Đóng Góp',
    description: 'Nhận thưởng khi đóng góp dữ liệu hợp lệ và sử dụng tín dụng cho các tiện ích nâng cao.',
    href: '/docs',
    category: 'apps',
  },
  {
    icon: <ArrowsClockwise size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Tái Thẩm Định & Vòng Lặp MLOps',
    description: 'Tự động giao nhiệm vụ làm mới biển báo cũ và đưa dữ liệu đã duyệt vào tái huấn luyện mô hình AI.',
    href: '/docs',
    badge: 'MLOps',
    category: 'developer',
  },
  {
    icon: <Code size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Geospatial API & SDK',
    description: 'API truy xuất dữ liệu không gian PostGIS phục vụ nghiên cứu xe tự hành và logistics.',
    href: '/docs',
    badge: 'API',
    category: 'developer',
  },
]

const categories = [
  { id: 'explore', label: 'Bản đồ GIS & AI Pipeline', icon: <Compass size={18} /> },
  { id: 'apps', label: 'Ứng dụng & Xác thực', icon: <DeviceMobile size={18} /> },
  { id: 'developer', label: 'MLOps & Nhà phát triển', icon: <Code size={18} /> },
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
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[860px] max-w-[calc(100vw-2rem)]">
      {/* Decorative arrow */}
      <div className="mx-auto w-fit">
        <div className="w-3 h-3 bg-[#0a1619] border-l border-t border-white/10 rotate-45 translate-y-1.5 ml-16" />
      </div>

      <div className="bg-[#081215]/95 backdrop-blur-2xl border border-white/10 rounded-[16px] shadow-2xl overflow-hidden flex flex-col md:flex-row text-gray-200">
        {/* Left Sidebar */}
        <div className="w-full md:w-64 bg-[#050e10] p-5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 px-3 py-1.5">
            Danh mục tính năng
          </p>
          {categories.map((cat) => {
            const active = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium text-left transition-all ${
                  active
                    ? 'bg-[#007b8b]/25 text-[#00c4de] border border-[#00c4de]/35 shadow-sm'
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
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                onClick={onClose}
                className="group flex flex-col justify-between p-4 rounded-[12px] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-[#00c4de]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-[8px] bg-[#007b8b]/20 flex items-center justify-center">
                      {item.icon}
                    </div>
                    {item.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00c4de]/20 text-[#00c4de] border border-[#00c4de]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#00c4de] transition-colors mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3.5 flex items-center gap-1 text-xs font-semibold text-[#00c4de] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Xem chi tiết</span>
                  <ArrowRight size={12} weight="bold" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Chuẩn hóa danh mục theo QCVN 41:2019/BGTVT</span>
            <Link
              to="/docs"
              onClick={onClose}
              className="text-[#00c4de] hover:underline flex items-center gap-1 font-medium text-xs"
            >
              Tài liệu kỹ thuật <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
