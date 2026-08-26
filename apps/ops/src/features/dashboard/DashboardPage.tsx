import { useAuth } from '@/features/auth/AuthContext'
import {
  MapTrifold,
  CheckSquare,
  Warning,
  CurrencyDollar,
  TrendUp,
  ArrowRight,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

const stats = [
  { icon: <MapTrifold size={20} weight="duotone" />, label: 'Biển đã xác thực', value: '142,381', change: '+234 hôm nay', up: true },
  { icon: <CheckSquare size={20} weight="duotone" />, label: 'Chờ kiểm duyệt', value: '12', change: 'cần xử lý', up: false },
  { icon: <Warning size={20} weight="duotone" />, label: 'Sự cố mở', value: '3', change: 'báo cáo mới', up: false },
  { icon: <CurrencyDollar size={20} weight="duotone" />, label: 'Thưởng chờ duyệt', value: '5', change: 'yêu cầu', up: false },
]

const recentActivity = [
  { action: 'Kiểm duyệt biển P.102 — Phường 5, Q.Tân Bình', time: '2 phút trước', status: 'approved' },
  { action: 'Báo cáo sự cố biển W.201 — Ngã tư Bình Phước', time: '15 phút trước', status: 'pending' },
  { action: 'Kiểm duyệt biển R.301 — Đường Hoàng Văn Thụ', time: '1 giờ trước', status: 'approved' },
  { action: 'Yêu cầu thưởng từ user #1042', time: '2 giờ trước', status: 'pending' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          Chào buổi sáng, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-xs text-gray-400">Đây là tình hình hôm nay của hệ thống</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E8E4E3] rounded-[8px] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#d3f7ff] flex items-center justify-center text-[#007b8b]">
                {s.icon}
              </div>
              <TrendUp
                size={14}
                weight="bold"
                className={s.up ? 'text-green-500' : 'text-gray-300'}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5" style={{ fontFamily: 'Arvo, serif' }}>
              {s.value}
            </p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
            <p className="text-[10px] text-[#007b8b] mt-1 font-medium">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4E3] rounded-[8px]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E4E3]">
            <h3 className="text-sm font-semibold text-gray-800">Hoạt động gần đây</h3>
          </div>
          <ul className="divide-y divide-[#E8E4E3]">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    a.status === 'approved' ? 'bg-green-500' : 'bg-amber-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">{a.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-[#E8E4E3] rounded-[8px]">
          <div className="px-5 py-3 border-b border-[#E8E4E3]">
            <h3 className="text-sm font-semibold text-gray-800">Truy cập nhanh</h3>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {[
              { label: 'Mở bản đồ', href: '/map' },
              { label: 'Xem hàng chờ kiểm duyệt', href: '/moderation' },
              { label: 'Xử lý sự cố', href: '/reports' },
              { label: 'Duyệt yêu cầu thưởng', href: '/credits' },
            ].map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium text-gray-700 hover:bg-[#F8F7F7] hover:text-[#007b8b] transition-colors group"
              >
                {l.label}
                <ArrowRight
                  size={12}
                  className="text-gray-300 group-hover:text-[#007b8b] group-hover:translate-x-0.5 transition-all"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
