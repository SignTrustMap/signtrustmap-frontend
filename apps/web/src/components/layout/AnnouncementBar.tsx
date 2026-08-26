import { ArrowRight, X, Sparkle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="relative z-50 flex items-center justify-center bg-[#05181c] border-b border-[#007b8b]/30 text-xs px-4 py-2 text-gray-300">
      <Link
        to="/product/map"
        className="flex items-center gap-2 font-medium hover:text-[#00c4de] transition-colors group"
      >
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#007b8b]/30 text-[#00c4de] font-semibold text-[10px] tracking-wide uppercase border border-[#00c4de]/20">
          <Sparkle size={10} weight="fill" /> Mới ra mắt
        </span>
        <span>SignTrustMap Vision AI v2.0 đã hỗ trợ nhận diện tự động biển báo QCVN 41 tại Việt Nam</span>
        <ArrowRight size={12} weight="bold" className="text-[#00c4de] group-hover:translate-x-1 transition-transform" />
      </Link>
      <button
        onClick={() => setVisible(false)}
        aria-label="Đóng thông báo"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  )
}
