import { ArrowRight, X } from '@phosphor-icons/react'
import { useState } from 'react'

const ANNOUNCEMENT_TEXT = 'SignTrustMap đã có mặt tại TP.HCM & Hà Nội — Tham gia khảo sát cùng chúng tôi'
const ANNOUNCEMENT_LINK = '#'

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="relative flex items-center justify-center bg-[#007b8b] text-white text-sm px-4 py-2.5">
      <a
        href={ANNOUNCEMENT_LINK}
        className="flex items-center gap-1.5 font-medium hover:underline underline-offset-2"
      >
        {ANNOUNCEMENT_TEXT}
        <ArrowRight size={14} weight="bold" />
      </a>
      <button
        onClick={() => setVisible(false)}
        aria-label="Đóng thông báo"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  )
}
