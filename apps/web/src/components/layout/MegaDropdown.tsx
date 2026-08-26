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
import { useTheme } from '@/context/ThemeContext'

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
    badge: 'Credits',
    category: 'apps',
  },
  {
    icon: <ArrowsClockwise size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Active Learning & Revalidation',
    description: 'Vòng lặp tự động làm mới biển báo cũ (Stale Signs) và nạp lại mô hình AI định kỳ.',
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
  const { isDark } = useTheme()
  const [selectedCat, setSelectedCat] = useState<string>('explore')

  const filteredItems = productItems.filter(
    (item) => selectedCat === 'all' || item.category === selectedCat
  )

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[860px] max-w-[calc(100vw-2rem)]">
      {/* Decorative arrow */}
      <div className="mx-auto w-fit">
        <div
          className={`w-3 h-3 rotate-45 translate-y-1.5 ml-16 border-l border-t ${
            isDark
              ? 'bg-[#0a1619] border-white/10'
              : 'bg-white border-[#E8E4E3]'
          }`}
        />
      </div>

      <div
        className={`backdrop-blur-2xl border rounded-[16px] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-colors ${
          isDark
            ? 'bg-[#081215]/95 border-white/10 text-gray-200'
            : 'bg-white/95 border-[#E8E4E3] text-gray-800'
        }`}
      >
        {/* Left Sidebar */}
        <div
          className={`w-full md:w-64 p-5 border-b md:border-b-0 md:border-r flex flex-col gap-1.5 ${
            isDark ? 'bg-[#050e10] border-white/10' : 'bg-gray-50/80 border-[#E8E4E3]'
          }`}
        >
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
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium text-left transition-all cursor-pointer ${
                  active
                    ? isDark
                      ? 'bg-[#007b8b]/25 text-[#00c4de] border border-[#00c4de]/35 shadow-sm'
                      : 'bg-teal-50 text-[#007b8b] border border-teal-200 shadow-sm font-semibold'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <span className={active ? (isDark ? 'text-[#00c4de]' : 'text-[#007b8b]') : 'text-gray-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            )
          })}

          <div className={`mt-auto pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <Link
              to="/product/map"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                isDark ? 'text-gray-400 hover:text-[#00c4de]' : 'text-gray-600 hover:text-[#007b8b]'
              }`}
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
                className={`group flex flex-col justify-between p-4 rounded-[12px] border transition-all ${
                  isDark
                    ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-[#00c4de]/40'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-[#007b8b]/40 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${
                      isDark ? 'bg-[#007b8b]/20' : 'bg-teal-50'
                    }`}>
                      {item.icon}
                    </div>
                    {item.badge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDark
                          ? 'bg-[#00c4de]/20 text-[#00c4de] border-[#00c4de]/30'
                          : 'bg-teal-50 text-[#007b8b] border-teal-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-bold transition-colors mb-1.5 ${
                    isDark ? 'text-white group-hover:text-[#00c4de]' : 'text-gray-900 group-hover:text-[#007b8b]'
                  }`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs leading-relaxed line-clamp-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
                <div className={`mt-3.5 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}>
                  <span>Xem chi tiết</span>
                  <ArrowRight size={12} weight="bold" />
                </div>
              </Link>
            ))}
          </div>

          <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/5 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <span>Chuẩn hóa danh mục theo QCVN 41:2019/BGTVT</span>
            <Link
              to="/docs"
              onClick={onClose}
              className={`hover:underline flex items-center gap-1 font-medium text-xs ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
              }`}
            >
              Tài liệu kỹ thuật <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
