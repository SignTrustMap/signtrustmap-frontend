import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FloppyDisk,
  CheckCircle,
} from '@phosphor-icons/react'

export default function SystemSettingsPage() {
  const { t } = useTranslation('ops')
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E8E4E3] dark:border-white/10 flex gap-8 text-xs sm:text-sm font-semibold">
        {(
          [
            { id: 'general', label: t('settings.tab_general') },
            { id: 'tasks', label: t('settings.tab_tasks') },
            { id: 'credits', label: t('settings.tab_credits') },
            { id: 'api', label: t('settings.tab_api') },
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

      {/* Settings Form Container */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Chế độ bảo trì hệ thống (Maintenance Mode)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tạm thời ngừng tiếp nhận lượt khảo sát mới từ ứng dụng mobile.</p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#007b8b] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Đơn vị tiền tệ hiển thị</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Đơn vị áp dụng khi quy đổi điểm thưởng đóng góp sang hiện kim.</p>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono"
              >
                <option value="VND (₫)">VND (₫)</option>
                <option value="USD ($)">USD ($)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Thời hạn tối đa thẩm định nhiệm vụ (ngày)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tự động gắn cờ Stale nếu biển báo không có khảo sát mới sau khoảng thời gian này.</p>
              </div>
              <input
                type="number"
                value={reviewTimeout}
                onChange={(e) => setReviewTimeout(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono text-right"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Tự động lưu trữ báo cáo đã giải quyết (ngày)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chuyển dữ liệu cũ vào kho lạnh Cold Storage để tối ưu tốc độ truy vấn PostGIS.</p>
              </div>
              <input
                type="number"
                value={autoArchiveDays}
                onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono text-right"
              />
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Hạn mức điểm thưởng tối đa / ngày</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Số điểm tối đa một khảo sát viên có thể nhận trong 24h nhằm hạn chế farm điểm.</p>
              </div>
              <input
                type="number"
                value={maxDailyCredits}
                onChange={(e) => setMaxDailyCredits(Number(e.target.value))}
                className="w-28 px-3 py-1.5 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono text-right"
              />
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">OpenStreetMap Tile Server URL</p>
              <input
                type="text"
                readOnly
                value="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-gray-50 dark:bg-white/5 font-mono text-gray-600 dark:text-gray-400"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">YOLO12 AI Inference Endpoint</p>
              <input
                type="text"
                readOnly
                value="https://api.signtrustmap.site/v1/models/yolo12-traffic"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-gray-50 dark:bg-white/5 font-mono text-gray-600 dark:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E8E4E3] dark:border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            {t('settings.btn_reset')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <FloppyDisk size={16} />
            <span>{t('settings.btn_save')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
