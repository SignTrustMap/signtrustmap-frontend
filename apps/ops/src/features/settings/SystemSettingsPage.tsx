import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FloppyDisk,
  CheckCircle,
  SlidersHorizontal,
  ShieldCheck,
  Cpu,
  ArrowsClockwise,
  WarningOctagon,
} from '@phosphor-icons/react'

export default function SystemSettingsPage() {
  const { t } = useTranslation('ops')

  const [activeTab, setActiveTab] = useState<'parameters' | 'consensus' | 'freshness' | 'moderation'>('parameters')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  // Upload & Processing parameters
  const [maxVideoSizeMb, setMaxVideoSizeMb] = useState(1024)
  const [chunkSizeMb, setChunkSizeMb] = useState(25)
  const [workerConcurrency, setWorkerConcurrency] = useState(4)

  // Consensus & Reliability rules
  const [consensusApprovalThreshold, setConsensusApprovalThreshold] = useState(0.75)
  const [minReviewerVotes, setMinReviewerVotes] = useState(3)
  const [alphaSmoothingFactor, setAlphaSmoothingFactor] = useState(0.1)
  const [reliabilityPenalty, setReliabilityPenalty] = useState(0.05)

  // Freshness & Task Limits
  const [freshnessThresholdDays, setFreshnessThresholdDays] = useState(180)
  const [maxDailyTasksPerUser, setMaxDailyTasksPerUser] = useState(20)

  // Moderation rules
  const [autoEscalateTieVotes, setAutoEscalateTieVotes] = useState(true)
  const [gpsAnomalySpeedLimitKmh, setGpsAnomalySpeedLimitKmh] = useState(150)

  const [toast, setToast] = useState<string | null>(null)

  function handleSave() {
    setToast(t('settings.toast_saved'))
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="p-6 sm:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <SlidersHorizontal size={16} weight="bold" />
            <span>{t('settings.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <FloppyDisk size={18} />
          <span>{t('settings.btn_save')}</span>
        </button>
      </div>

      {toast && (
        <div
          onClick={() => setToast(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toast}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Navigation Tabs Menu (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'parameters'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Cpu size={18} />
            <span>{t('settings.tab_ingestion')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consensus')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'consensus'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={18} />
            <span>{t('settings.tab_consensus')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('freshness')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'freshness'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <ArrowsClockwise size={18} />
            <span>{t('settings.tab_freshness')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <WarningOctagon size={18} />
            <span>{t('settings.tab_moderation')}</span>
          </button>
        </div>

        {/* Right Side: Tab Contents (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
          {activeTab === 'parameters' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('settings.sec_ingestion')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_video_size')}
                  </label>
                  <input
                    type="number"
                    value={maxVideoSizeMb}
                    onChange={(e) => setMaxVideoSizeMb(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_chunk_size')}
                  </label>
                  <input
                    type="number"
                    value={chunkSizeMb}
                    onChange={(e) => setChunkSizeMb(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1 sm:col-span-2">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_concurrency')}
                  </label>
                  <input
                    type="number"
                    value={workerConcurrency}
                    onChange={(e) => setWorkerConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consensus' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('settings.sec_consensus')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_consensus_threshold')}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="0.95"
                    value={consensusApprovalThreshold}
                    onChange={(e) => setConsensusApprovalThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_min_votes')}
                  </label>
                  <input
                    type="number"
                    value={minReviewerVotes}
                    onChange={(e) => setMinReviewerVotes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_alpha')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={alphaSmoothingFactor}
                    onChange={(e) => setAlphaSmoothingFactor(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_bounds')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={reliabilityPenalty}
                    onChange={(e) => setReliabilityPenalty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'freshness' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('settings.sec_freshness')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_freshness_days')}
                  </label>
                  <input
                    type="number"
                    value={freshnessThresholdDays}
                    onChange={(e) => setFreshnessThresholdDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_daily_tasks')}
                  </label>
                  <input
                    type="number"
                    value={maxDailyTasksPerUser}
                    onChange={(e) => setMaxDailyTasksPerUser(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('settings.sec_moderation')}
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {t('settings.lbl_auto_escalate')}
                    </p>
                    <p className="text-gray-400 text-[11px]">
                      {t('settings.desc_auto_escalate')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEscalateTieVotes}
                    onChange={(e) => setAutoEscalateTieVotes(e.target.checked)}
                    className="w-4 h-4 accent-[#007b8b]"
                  />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <label className="font-mono font-bold text-gray-400 uppercase">
                    {t('settings.lbl_speed_anomaly')}
                  </label>
                  <input
                    type="number"
                    value={gpsAnomalySpeedLimitKmh}
                    onChange={(e) => setGpsAnomalySpeedLimitKmh(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
                  />
                </div>

                <div className="p-4 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-red-600">
                      {t('settings.lbl_maintenance')}
                    </p>
                    <p className="text-red-500/80 text-[11px]">
                      {t('settings.desc_maintenance')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-4 h-4 accent-red-600"
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
