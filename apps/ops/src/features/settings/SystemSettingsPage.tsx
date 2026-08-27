import { useState } from 'react'
import {
  FloppyDisk,
  CheckCircle,
} from '@phosphor-icons/react'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'tasks' | 'credits' | 'api'>('general')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [currency, setCurrency] = useState('VND (₫)')
  const [maxDailyCredits, setMaxDailyCredits] = useState(500)
  const [reviewTimeout, setReviewTimeout] = useState(15)
  const [autoArchiveDays, setAutoArchiveDays] = useState(90)
  const [toast, setToast] = useState<string | null>(null)

  function handleSave() {
    setToast('Cài đặt hệ thống đã được lưu thành công.')
    setTimeout(() => setToast(null), 3000)
  }

  function handleReset() {
    setMaintenanceMode(false)
    setCurrency('VND (₫)')
    setMaxDailyCredits(500)
    setReviewTimeout(15)
    setAutoArchiveDays(90)
    setToast('Đã khôi phục cài đặt về mặc định của hệ thống.')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Thiết lập các tham số nền tảng, quy tắc vận hành và hạn mức xử lý.
        </p>
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
            { id: 'general', label: 'Cài đặt chung' },
            { id: 'tasks', label: 'Quy tắc nhiệm vụ' },
            { id: 'credits', label: 'Hạn mức điểm thưởng' },
            { id: 'api', label: 'Tích hợp API' },
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

      {/* Main Settings Panel */}
      <div className="bg-white border border-[#E8E4E3] rounded-[18px] shadow-xs p-6 sm:p-8 space-y-8">
        {/* Section 1: Application Behavior */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-[#E8E4E3] pb-3">
            Hành vi ứng dụng
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                Chế độ bảo trì hệ thống
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tạm dừng quyền truy cập đối với người dùng thông thường trong thời gian cập nhật.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                maintenanceMode ? 'bg-[#007b8b]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 max-w-sm">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-mono">
              Đơn vị tiền tệ mặc định
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-xl text-gray-800 focus:outline-none focus:border-[#007b8b]"
            >
              <option value="VND (₫)">VND (₫)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Section 2: Operational Limits */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-gray-900 border-b border-[#E8E4E3] pb-3">
            Hạn mức & Giới hạn vận hành
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 font-mono">
                Hạn mức thưởng tối đa/ngày của khảo sát viên
              </label>
              <input
                type="number"
                value={maxDailyCredits}
                onChange={(e) => setMaxDailyCredits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-xl text-gray-900 focus:outline-none focus:border-[#007b8b]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Số điểm thưởng tối đa có thể cấp cho một tài khoản trong ngày.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 font-mono">
                Thời gian chờ duyệt biển báo (phút)
              </label>
              <input
                type="number"
                value={reviewTimeout}
                onChange={(e) => setReviewTimeout(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-xl text-gray-900 focus:outline-none focus:border-[#007b8b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 font-mono">
                Thời hạn tự động lưu trữ (ngày)
              </label>
              <input
                type="number"
                value={autoArchiveDays}
                onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-xl text-gray-900 focus:outline-none focus:border-[#007b8b]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#E8E4E3] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  )
}
