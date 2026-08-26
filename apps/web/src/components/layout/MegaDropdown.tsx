import { MapTrifold, DeviceMobile, ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

interface ProductItem {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  cta: string
}

const productItems: ProductItem[] = [
  {
    icon: <MapTrifold size={28} weight="duotone" className="text-[#007b8b]" />,
    title: 'Bản Đồ Biển Báo',
    description:
      'Xem toàn bộ hệ thống biển báo đã được cộng đồng xác thực trên bản đồ số thời gian thực.',
    href: '/product/map',
    cta: 'Xem bản đồ',
  },
  {
    icon: <DeviceMobile size={28} weight="duotone" className="text-[#007b8b]" />,
    title: 'Tải Ứng Dụng',
    description:
      'Tham gia cộng đồng thu thập dữ liệu biển báo giao thông. Dành cho Surveyor và Driver.',
    href: '/product/app',
    cta: 'Tải ngay',
  },
]

const categories = [
  { label: 'Khám phá Bản đồ', href: '/product/map' },
  { label: 'Tải Ứng Dụng', href: '/product/app' },
]

interface MegaDropdownProps {
  onClose: () => void
}

export function MegaDropdown({ onClose }: MegaDropdownProps) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 w-[680px] max-w-[calc(100vw-2rem)]">
      {/* Connector arrow */}
      <div className="mx-auto w-fit">
        <div className="w-3 h-3 bg-white border-l border-t border-[#E8E4E3] rotate-45 translate-y-1.5 ml-8" />
      </div>

      <div className="bg-white border border-[#E8E4E3] rounded-[12px] shadow-xl overflow-hidden flex">
        {/* Left sidebar — categories */}
        <nav className="w-52 shrink-0 bg-[#F8F7F7] border-r border-[#E8E4E3] p-4 flex flex-col gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              to={cat.href}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-[8px] hover:bg-white hover:text-[#007b8b] transition-colors group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#007b8b] opacity-0 group-hover:opacity-100 transition-opacity" />
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Right panel — product cards */}
        <div className="flex-1 p-5 flex flex-col gap-3">
          {productItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className="group flex items-start gap-4 p-4 rounded-[8px] hover:bg-[#F8F7F7] transition-colors border border-transparent hover:border-[#E8E4E3]"
            >
              <div className="shrink-0 mt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 mt-1 text-gray-400 group-hover:text-[#007b8b] group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          ))}

          {/* Footer link */}
          <div className="pt-2 border-t border-[#E8E4E3]">
            <Link
              to="/product/map"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs text-[#007b8b] font-medium hover:underline underline-offset-2"
            >
              Xem tất cả sản phẩm <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
