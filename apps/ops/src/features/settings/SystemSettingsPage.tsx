import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FloppyDisk,
  CheckCircle,
  SlidersHorizontal,
  ShieldCheck,
  Coins,
  Cpu,
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
    setToast(t('settings.btn_saved', { defaultValue: 'Cài đặt hệ thống đã được lưu thành công.' }))
    setTimeout(() => setToast(null), 3000)
  }

  function handleReset() {
    setMaintenanceMode(false)
    setCurrency('VND (₫)')
    setMaxDailyCredits(500)
    setReviewTimeout(15)
    setAutoArchiveDays(90)
    setToast(t('settings.btn_reset_notice', { defaultValue: 'Đã khôi phục cài đặt về mặc định của hệ thống.' }))
    setTimeout(() => setToast(null), 2500)
  }

  const tabItems = [
    { id: 'general', label: t('settings.tab_general'), icon: <SlidersHorizontal size={18} /> },
    { id: 'tasks', label: t('settings.tab_tasks'), icon: <ShieldCheck size={18} /> },
    { id: 'credits', label: t('settings.tab_credits'), icon: <Coins size={18} /> },
    { id: 'api', label: t('settings.tab_api'), icon: <Cpu size={18} /> },
  ] as const

  return (
    <div className="p-6 sm:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main 2-Column Wide Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Navigation Tabs Menu (3.5 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-4 shadow-xs">
          <div className="space-y-1.5">
            {tabItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black shadow-sm font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-current' : 'text-[#007b8b] dark:text-[#00c4de]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Side: Settings Content Card (8.5 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-6 sm:p-8 shadow-xs">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-white/10 pb-4 mb-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.tab_general')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Thiết lập trạng thái hoạt động và cấu hình chung trên toàn nền tảng.
                </p>
              </div>

              {/* Setting 1: Maintenance Mode */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/10">
                <div className="max-w-xl pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.setting_maintenance_title')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.setting_maintenance_desc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007b8b] dark:peer-checked:bg-[#00c4de]" />
                </label>
              </div>

              {/* Setting 2: Currency */}
              <div className="flex items-center justify-between py-4">
                <div className="max-w-xl pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.setting_currency_title')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.setting_currency_desc')}
                  </p>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-2 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono font-semibold focus:outline-none focus:border-[#00c4de]"
                >
                  <option value="VND (₫)">VND (₫)</option>
                  <option value="USD ($)">USD ($)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-white/10 pb-4 mb-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.tab_tasks')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Cấu hình thời gian hết hạn độ tươi mới (Sign Freshness) và quy tắc lưu trữ dữ liệu.
                </p>
              </div>

              {/* Setting 1: Review Timeout */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/10">
                <div className="max-w-xl pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.setting_review_timeout_title')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.setting_review_timeout_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={reviewTimeout}
                    onChange={(e) => setReviewTimeout(Number(e.target.value))}
                    className="w-24 px-3.5 py-2 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#00c4de]"
                  />
                  <span className="text-xs text-gray-400 font-mono">ngày</span>
                </div>
              </div>

              {/* Setting 2: Auto-Archive */}
              <div className="flex items-center justify-between py-4">
                <div className="max-w-xl pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.setting_auto_archive_title')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.setting_auto_archive_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={autoArchiveDays}
                    onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
                    className="w-24 px-3.5 py-2 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#00c4de]"
                  />
                  <span className="text-xs text-gray-400 font-mono">ngày</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-white/10 pb-4 mb-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.tab_credits')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Kiểm soát chính sách chi trả điểm thưởng và phòng chống gian lận hệ thống.
                </p>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="max-w-xl pr-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.setting_max_credits_title')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.setting_max_credits_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxDailyCredits}
                    onChange={(e) => setMaxDailyCredits(Number(e.target.value))}
                    className="w-28 px-3.5 py-2 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-[#061115] text-gray-900 dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#00c4de]"
                  />
                  <span className="text-xs text-gray-400 font-mono">pts</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 dark:border-white/10 pb-4 mb-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.tab_api')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Cổng kết nối dịch vụ bản đồ vệ tinh và mô hình học sâu AI.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    OpenStreetMap Tile Server URL
                  </p>
                  <input
                    type="text"
                    readOnly
                    value="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-gray-50 dark:bg-white/5 font-mono text-gray-600 dark:text-gray-300"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                    YOLO12 AI Inference Endpoint
                  </p>
                  <input
                    type="text"
                    readOnly
                    value="https://api.signtrustmap.site/v1/models/yolo12-traffic"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E4E3] dark:border-white/15 bg-gray-50 dark:bg-white/5 font-mono text-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
