import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  LockKey,
  CaretDown,
  PencilSimple,
  EnvelopeSimple,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
} from '@phosphor-icons/react'

export default function StaffDetailPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'records'>('profile')
  const [toast, setToast] = useState<string | null>(null)

  function handleResetPassword() {
    setToast('Đã gửi liên kết đặt lại mật khẩu tới sarah.jenkins@enterprise.com.')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header with Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] pb-5">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="w-9 h-9 rounded-xl border border-[#E8E4E3] bg-white hover:bg-[#F8F7F7] flex items-center justify-center text-gray-600 transition-colors shrink-0 mt-0.5 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Link to="/staff" className="hover:underline">
                Quản lý nhân sự
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-bold">Chi tiết nhân sự</span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Sarah Jenkins
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#dcfce7] text-[#15803d]">
                Đang hoạt động
              </span>
            </div>

            <p className="text-xs text-gray-500 font-mono mt-1">
              Mã: USR-8842-A9 • Điều phối viên logistics cao cấp
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetPassword}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E8E4E3] bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LockKey size={16} />
            <span>Đặt lại mật khẩu</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E8E4E3] bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Thao tác khác</span>
            <CaretDown size={14} />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <PencilSimple size={16} />
            <span>Chỉnh sửa hồ sơ</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E8E4E3] flex gap-8 text-xs sm:text-sm font-semibold">
        {(
          [
            { id: 'profile', label: 'Hồ sơ & Chi tiết' },
            { id: 'history', label: 'Lịch sử hoạt động' },
            { id: 'records', label: 'Bản ghi liên quan' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-[#007b8b] text-[#007b8b]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN: Profile & Contact (4 cols) ─────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-3xl shadow-md border-4 border-white mb-3">
              SJ
            </div>
            <h2 className="text-lg font-bold text-gray-900">Sarah Jenkins</h2>
            <p className="text-xs text-gray-500 mt-0.5">Phòng Vận hành & Logistics</p>

            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[#E8E4E3] w-full text-[10px] font-mono font-bold tracking-wider text-gray-400">
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                NỘI BỘ
              </span>
              <span className="px-2 py-0.5 rounded bg-[#d3f7ff] text-[#007b8b]">
                TRUY CẬP CẤP 2
              </span>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-[#E8E4E3] pb-3">
              Thông tin liên hệ
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <EnvelopeSimple size={18} className="text-[#007b8b] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Địa chỉ Email
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    sarah.jenkins@enterprise.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-[#007b8b] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Số điện thoại công việc
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    +84 (024) 3819-2834
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#007b8b] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Địa điểm làm việc
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    Tòa nhà 4, Tầng 2, Bàn 42B
                  </p>
                  <p className="text-gray-500 text-[11px]">Trung tâm điều hành Hà Nội</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Employment & Security (8 cols) ────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Employment Details Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E4E3] pb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Chi tiết công việc
              </h3>
              <button
                type="button"
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <PencilSimple size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Quản lý trực tiếp
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                    DR
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    David Reynolds
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Ngày vào làm
                </p>
                <p className="font-bold text-gray-900 text-sm mt-1 font-mono">
                  14/10/2021
                </p>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Phòng ban
                </p>
                <p className="font-medium text-gray-900 text-sm mt-1">
                  Vận hành khu vực Tây Bắc
                </p>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Mã chi phí
                </p>
                <p className="font-bold font-mono text-gray-900 text-sm mt-1">
                  CC-892-LOG
                </p>
              </div>
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-[#E8E4E3] pb-3">
              Bảo mật & Quyền truy cập
            </h3>

            {/* 2FA Status Box */}
            <div className="p-4 rounded-xl border border-[#E8E4E3] bg-[#F8F7F7]/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Xác thực hai yếu tố (2FA)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hiện đang kích hoạt qua ứng dụng Authenticator
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#dcfce7] text-[#15803d]">
                <CheckCircle size={14} weight="fill" />
                <span>Đã kích hoạt</span>
              </span>
            </div>

            {/* Last login & password change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E8E4E3] bg-white space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Đăng nhập lần cuối
                </p>
                <p className="font-bold text-gray-900 text-sm">
                  Hôm nay, 08:42 SA
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-mono">
                  <span>💻</span> IP Văn phòng Hà Nội
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E4E3] bg-white space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Đổi mật khẩu lần cuối
                </p>
                <p className="font-bold text-gray-900 text-sm">
                  42 ngày trước
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-mono">
                  <Clock size={13} /> Yêu cầu đổi lại sau 48 ngày
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
