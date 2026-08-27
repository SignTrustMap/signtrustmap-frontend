import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  LockKey,
  CheckCircle,
  MapPin,
} from '@phosphor-icons/react'

export default function StaffDetailPage() {
  const { t } = useTranslation('ops')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="w-9 h-9 rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-[#F8F7F7] dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shrink-0 mt-0.5 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <Link to="/staff" className="hover:underline">
                {t('staff_detail.breadcrumb')}
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 dark:text-white font-bold">{t('staff_detail.breadcrumb_current')}</span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Sarah Jenkins
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#dcfce7] text-[#15803d] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                {t('staff.status_active')}
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              Mã: USR-8842-A9 • Điều phối viên logistics cao cấp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetPassword}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LockKey size={15} />
            <span>{t('staff_detail.btn_reset_pw')}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E8E4E3] dark:border-white/10 flex gap-8 text-xs sm:text-sm font-semibold">
        {(
          [
            { id: 'profile', label: t('staff_detail.tab_profile') },
            { id: 'history', label: t('staff_detail.tab_history') },
            { id: 'records', label: t('staff_detail.tab_records') },
          ] as const
        ).map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setActiveTab(tabItem.id)}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === tabItem.id
                ? 'border-[#007b8b] text-[#007b8b] dark:border-[#00c4de] dark:text-[#00c4de]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Profile Details Container */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div>
            <span className="text-gray-400 font-mono text-xs uppercase">Email liên hệ</span>
            <p className="font-bold text-gray-900 dark:text-white mt-1">sarah.jenkins@enterprise.com</p>
          </div>
          <div>
            <span className="text-gray-400 font-mono text-xs uppercase">Số điện thoại</span>
            <p className="font-bold text-gray-900 dark:text-white mt-1">+84 (0) 912 345 678</p>
          </div>
          <div>
            <span className="text-gray-400 font-mono text-xs uppercase">Khu vực phụ trách</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white mt-1">
              <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>Quận 1, TP. Hồ Chí Minh</span>
            </div>
          </div>
          <div>
            <span className="text-gray-400 font-mono text-xs uppercase">Ngày tham gia hệ thống</span>
            <p className="font-bold text-gray-900 dark:text-white mt-1 font-mono">14/03/2024 (2 năm trước)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
