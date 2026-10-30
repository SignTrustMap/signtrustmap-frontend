import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import {
  systemService,
  type SystemParameterItem,
  type RouteMatrixItem,
} from '@/api/services'
import {
  FloppyDisk,
  ShieldCheck,
  Cpu,
  ArrowsClockwise,
  WarningOctagon,
  SlidersHorizontal,
  Plus,
  Table,
} from '@phosphor-icons/react'

const defaultFallbackMatrix: RouteMatrixItem[] = [
  { id: 1, routeClass: 'EXPRESSWAY', nameVi: 'Đường cao tốc (Expressway)', defaultLifetimeDays: 90, revalThresholdDays: 14, spatialBufferMeters: 25 },
  { id: 2, routeClass: 'NATIONAL_HIGHWAY', nameVi: 'Quốc lộ (National Highway)', defaultLifetimeDays: 120, revalThresholdDays: 21, spatialBufferMeters: 20 },
  { id: 3, routeClass: 'PROVINCIAL_ROAD', nameVi: 'Đường tỉnh (Provincial Road)', defaultLifetimeDays: 180, revalThresholdDays: 30, spatialBufferMeters: 15 },
  { id: 4, routeClass: 'URBAN_STREET', nameVi: 'Đường đô thị (Urban Street)', defaultLifetimeDays: 240, revalThresholdDays: 45, spatialBufferMeters: 10 },
  { id: 5, routeClass: 'RURAL_LOCAL', nameVi: 'Đường liên thôn / Xã (Rural Local)', defaultLifetimeDays: 365, revalThresholdDays: 60, spatialBufferMeters: 10 },
]

export default function SystemSettingsPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'parameters' | 'consensus' | 'freshness' | 'moderation'>('parameters')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Tab 1: Upload & Ingestion Parameters ──
  const [maxVideoSizeMb, setMaxVideoSizeMb] = useState(1024)
  const [chunkSizeMb, setChunkSizeMb] = useState(25)
  const [workerConcurrency, setWorkerConcurrency] = useState(4)
  const [rawParameters, setRawParameters] = useState<SystemParameterItem[]>([])

  // Modal / Inline custom parameter
  const [newParamKey, setNewParamKey] = useState('')
  const [newParamValue, setNewParamValue] = useState('')
  const [newParamDesc, setNewParamDesc] = useState('')

  // ── Tab 2: Consensus & Reliability Rules ──
  const [consensusApprovalThreshold, setConsensusApprovalThreshold] = useState(0.75)
  const [rejectionThreshold, setRejectionThreshold] = useState(0.25)
  const [minReviewerVotes, setMinReviewerVotes] = useState(3)
  const [alphaSmoothingFactor, setAlphaSmoothingFactor] = useState(0.1)
  const [reliabilityPenalty, setReliabilityPenalty] = useState(0.05)
  const [weightCorrect, setWeightCorrect] = useState(1.0)
  const [minReliabilityThreshold, setMinReliabilityThreshold] = useState(0.6)
  const [consecutiveErrorLimit, setConsecutiveErrorLimit] = useState(3)
  const [suspensionCooldownDays, setSuspensionCooldownDays] = useState(7)

  // ── Tab 3: Freshness & Route Decay Matrix ──
  const [freshnessThresholdDays, setFreshnessThresholdDays] = useState(180)
  const [maxDailyTasksPerUser, setMaxDailyTasksPerUser] = useState(20)
  const [routeMatrix, setRouteMatrix] = useState<RouteMatrixItem[]>(defaultFallbackMatrix)

  // ── Tab 4: Moderation & System State ──
  const [autoEscalateTieVotes, setAutoEscalateTieVotes] = useState(true)
  const [gpsAnomalySpeedLimitKmh, setGpsAnomalySpeedLimitKmh] = useState(150)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // ── Initial Fetch ──
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [paramsRes, consensusRes, matrixRes] = await Promise.allSettled([
        systemService.getParameters(),
        systemService.getConsensusConfig(),
        systemService.getRouteMatrix(),
      ])

      // 1. Process System Parameters
      if (paramsRes.status === 'fulfilled' && Array.isArray(paramsRes.value)) {
        setRawParameters(paramsRes.value)
        const paramMap = new Map<string, any>()
        paramsRes.value.forEach((p) => {
          let val = p.value
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val)
            } catch {
              // keep string
            }
          }
          paramMap.set(p.key, val)
        })

        if (paramMap.has('upload_max_video_size_mb')) {
          setMaxVideoSizeMb(Number(paramMap.get('upload_max_video_size_mb')) || 1024)
        }
        if (paramMap.has('upload_chunk_size_mb')) {
          setChunkSizeMb(Number(paramMap.get('upload_chunk_size_mb')) || 25)
        }
        if (paramMap.has('worker_concurrency')) {
          setWorkerConcurrency(Number(paramMap.get('worker_concurrency')) || 4)
        }
        if (paramMap.has('freshness_threshold_days')) {
          setFreshnessThresholdDays(Number(paramMap.get('freshness_threshold_days')) || 180)
        }
        if (paramMap.has('max_daily_tasks_per_user')) {
          setMaxDailyTasksPerUser(Number(paramMap.get('max_daily_tasks_per_user')) || 20)
        }
        if (paramMap.has('auto_escalate_tie_votes')) {
          setAutoEscalateTieVotes(Boolean(paramMap.get('auto_escalate_tie_votes')))
        }
        if (paramMap.has('gps_anomaly_speed_limit_kmh')) {
          setGpsAnomalySpeedLimitKmh(Number(paramMap.get('gps_anomaly_speed_limit_kmh')) || 150)
        }
        if (paramMap.has('maintenance_mode')) {
          setMaintenanceMode(Boolean(paramMap.get('maintenance_mode')))
        }
      }

      // 2. Process Consensus Config
      if (consensusRes.status === 'fulfilled' && consensusRes.value) {
        const c = consensusRes.value
        if (c.approvalThreshold !== undefined) setConsensusApprovalThreshold(c.approvalThreshold)
        if (c.rejectionThreshold !== undefined) setRejectionThreshold(c.rejectionThreshold)
        if (c.minVotesRequired !== undefined) setMinReviewerVotes(c.minVotesRequired)
        if (c.alphaSmoothingFactor !== undefined) setAlphaSmoothingFactor(c.alphaSmoothingFactor)
        if (c.penaltyFalse !== undefined) setReliabilityPenalty(c.penaltyFalse)
        if (c.weightCorrect !== undefined) setWeightCorrect(c.weightCorrect)
        if (c.minReliabilityThreshold !== undefined) setMinReliabilityThreshold(c.minReliabilityThreshold)
        if (c.consecutiveErrorLimit !== undefined) setConsecutiveErrorLimit(c.consecutiveErrorLimit)
        if (c.suspensionCooldownDays !== undefined) setSuspensionCooldownDays(c.suspensionCooldownDays)
      }

      // 3. Process Route Matrix
      if (matrixRes.status === 'fulfilled' && Array.isArray(matrixRes.value) && matrixRes.value.length > 0) {
        setRouteMatrix(matrixRes.value)
      }
    } catch (err) {
      console.warn('Could not load some system settings from backend, using current values:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ── Save All Settings ──
  async function handleSave() {
    setIsSaving(true)
    try {
      // 1. Update Consensus Config
      const consensusPromise = systemService.updateConsensusConfig({
        approvalThreshold: consensusApprovalThreshold,
        rejectionThreshold,
        minVotesRequired: minReviewerVotes,
        alphaSmoothingFactor,
        weightCorrect,
        penaltyFalse: reliabilityPenalty,
        minReliabilityThreshold,
        consecutiveErrorLimit,
        suspensionCooldownDays,
      }).catch((err) => {
        console.warn('Failed to update consensus config:', err)
      })

      // 2. Upsert System Parameters
      const paramPromises = [
        systemService.upsertParameter('upload_max_video_size_mb', {
          value: maxVideoSizeMb,
          description: 'Dung lượng video tối đa (MB)',
        }),
        systemService.upsertParameter('upload_chunk_size_mb', {
          value: chunkSizeMb,
          description: 'Kích thước phân mảnh upload (MB)',
        }),
        systemService.upsertParameter('worker_concurrency', {
          value: workerConcurrency,
          description: 'Số lượng Worker chạy song song',
        }),
        systemService.upsertParameter('freshness_threshold_days', {
          value: freshnessThresholdDays,
          description: 'Thời hạn coi là biển báo cũ (ngày)',
        }),
        systemService.upsertParameter('max_daily_tasks_per_user', {
          value: maxDailyTasksPerUser,
          description: 'Giới hạn nhiệm vụ tái kiểm định mỗi ngày / người dùng',
        }),
        systemService.upsertParameter('auto_escalate_tie_votes', {
          value: autoEscalateTieVotes,
          description: 'Tự động chuyển tiếp khi phiếu bầu hòa 50/50',
        }),
        systemService.upsertParameter('gps_anomaly_speed_limit_kmh', {
          value: gpsAnomalySpeedLimitKmh,
          description: 'Ngưỡng cảnh báo tốc độ GPS bất thường (km/h)',
        }),
        systemService.upsertParameter('maintenance_mode', {
          value: maintenanceMode,
          description: 'Chế độ bảo trì hệ thống toàn cục',
        }),
      ].map((p) => p.catch((err) => console.warn('Failed parameter upsert:', err)))

      // 3. Update Route Matrix Items
      const matrixPromises = routeMatrix.map((r) =>
        systemService.updateRouteMatrix(r.id, {
          defaultLifetimeDays: r.defaultLifetimeDays ?? r.default_lifetime_days,
          revalThresholdDays: r.revalThresholdDays ?? r.reval_threshold_days,
          spatialBufferMeters: r.spatialBufferMeters ?? r.spatial_buffer_meters,
        }).catch((err) => console.warn(`Failed route matrix #${r.id} update:`, err))
      )

      await Promise.all([consensusPromise, ...paramPromises, ...matrixPromises])
      toast.success(t('settings.toast_saved'))
      loadSettings()
    } catch (err: any) {
      console.error('Error saving system settings:', err)
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu cài đặt.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Add/Upsert a Custom Global Parameter ──
  async function handleAddCustomParam() {
    if (!newParamKey.trim()) {
      toast.error('Vui lòng nhập khóa tham số (Key)')
      return
    }
    try {
      let parsedValue: any = newParamValue
      try {
        parsedValue = JSON.parse(newParamValue)
      } catch {
        // Keep string if not valid JSON
      }
      await systemService.upsertParameter(newParamKey.trim(), {
        value: parsedValue,
        description: newParamDesc.trim() || undefined,
      })
      toast.success(`Đã cập nhật tham số "${newParamKey}"`)
      setNewParamKey('')
      setNewParamValue('')
      setNewParamDesc('')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo tham số mới')
    }
  }

  function handleRouteMatrixChange(id: number, field: keyof RouteMatrixItem, val: number) {
    setRouteMatrix((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  return (
    <div className="p-6 sm:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t('settings.title')}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadSettings}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <FloppyDisk size={16} weight="bold" className={isSaving ? 'animate-pulse' : ''} />
              <span>{isSaving ? 'Đang lưu...' : t('settings.btn_save')}</span>
            </button>
          </div>
        }
      />

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
          {/* TAB 1: Ingestion & System Parameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.sec_ingestion')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Định hình kích thước và tài nguyên phân bổ cho pipeline nạp dữ liệu survey từ camera & video.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_video_size')}
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10240"
                    value={maxVideoSizeMb}
                    onChange={(e) => setMaxVideoSizeMb(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Giới hạn dung lượng tệp video MP4/MOV tải lên.</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_chunk_size')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={chunkSizeMb}
                    onChange={(e) => setChunkSizeMb(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Kích thước từng phần truyền tệp đa luồng.</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 sm:col-span-2 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_concurrency')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={workerConcurrency}
                    onChange={(e) => setWorkerConcurrency(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Số lượng tiến trình trích xuất khung hình chạy đồng thời trên worker node.</p>
                </div>
              </div>

              {/* System Parameters Table */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table size={18} className="text-[#007b8b]" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Danh mục Tham số Toàn cục (system_parameters)
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {rawParameters.length} tham số đã nạp
                  </span>
                </div>

                {/* Add new parameter box */}
                <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 space-y-3">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Plus size={14} weight="bold" className="text-[#007b8b]" />
                    Thêm hoặc cập nhật tham số tùy chỉnh:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Khóa (Key)..."
                      value={newParamKey}
                      onChange={(e) => setNewParamKey(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-[#007b8b]"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị (Value / JSON)..."
                      value={newParamValue}
                      onChange={(e) => setNewParamValue(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-[#007b8b]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Mô tả..."
                        value={newParamDesc}
                        onChange={(e) => setNewParamDesc(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium focus:outline-none focus:border-[#007b8b]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomParam}
                        className="px-3 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white font-bold rounded-lg text-xs cursor-pointer whitespace-nowrap"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table of parameters */}
                {rawParameters.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Khóa (Key)</th>
                          <th className="px-3 py-2">Giá trị (Value)</th>
                          <th className="px-3 py-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                        {rawParameters.map((p) => (
                          <tr key={p.key} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-3 py-2 font-bold text-[#007b8b] dark:text-[#00c4de]">
                              {p.key}
                            </td>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                              {typeof p.value === 'object' ? JSON.stringify(p.value) : String(p.value)}
                            </td>
                            <td className="px-3 py-2 text-gray-500 font-sans text-[11px] truncate max-w-[200px]">
                              {p.description || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Consensus Hyperparameters */}
          {activeTab === 'consensus' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.sec_consensus')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Thuật toán tính điểm đồng thuận Bayes và trọng số độ tin cậy của Reviewer khi biểu quyết ảnh biển báo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Approval Threshold */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      {t('settings.lbl_consensus_threshold')}
                    </label>
                    <span className="font-mono font-extrabold text-[#007b8b]">
                      {(consensusApprovalThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    step="0.05"
                    min="0.5"
                    max="0.95"
                    value={consensusApprovalThreshold}
                    onChange={(e) => setConsensusApprovalThreshold(Number(e.target.value))}
                    className="w-full accent-[#007b8b] cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400">Tỷ lệ đồng thuận cần đạt để tự động xuất bản biển lên bản đồ.</p>
                </div>

                {/* Rejection Threshold */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Ngưỡng bác bỏ (Rejection Threshold)
                    </label>
                    <span className="font-mono font-extrabold text-rose-600">
                      {(rejectionThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    step="0.05"
                    min="0.05"
                    max="0.5"
                    value={rejectionThreshold}
                    onChange={(e) => setRejectionThreshold(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400">Tỷ lệ đồng thuận thấp hơn ngưỡng này sẽ tự động loại bỏ biển.</p>
                </div>

                {/* Min Review Votes */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_min_votes')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={minReviewerVotes}
                    onChange={(e) => setMinReviewerVotes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Số lượng biểu quyết tối thiểu trước khi chốt đồng thuận.</p>
                </div>

                {/* Alpha Smoothing Factor */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_alpha')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.5"
                    value={alphaSmoothingFactor}
                    onChange={(e) => setAlphaSmoothingFactor(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Hệ số làm mượt Laplace cho điểm tin cậy reviewer mới.</p>
                </div>

                {/* Reliability Penalty */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_bounds')} (Penalty False)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.3"
                    value={reliabilityPenalty}
                    onChange={(e) => setReliabilityPenalty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Điểm phạt trừ vào uy tín reviewer khi biểu quyết sai lệch kết quả cuối.</p>
                </div>

                {/* Min Reliability Threshold */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Ngưỡng tin cậy tối thiểu
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.3"
                    max="0.9"
                    value={minReliabilityThreshold}
                    onChange={(e) => setMinReliabilityThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Điểm tối thiểu để phiếu bầu được tính trọng số chuẩn.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Freshness & Route Freshness Decay Matrix */}
          {activeTab === 'freshness' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.sec_freshness')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cấu hình thời gian bán rã độ tươi biển báo giao thông và ma trận suy giảm theo phân loại cấp đường (Route Freshness Matrix).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_freshness_days')}
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="730"
                    value={freshnessThresholdDays}
                    onChange={(e) => setFreshnessThresholdDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Thời gian tính từ lần cập nhật gần nhất trước khi biển chuyển sang trạng thái cần tái xác thực.</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_daily_tasks')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxDailyTasksPerUser}
                    onChange={(e) => setMaxDailyTasksPerUser(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Hạn mức tối đa nhiệm vụ khảo sát thực địa giao cho một tình nguyện viên mỗi ngày.</p>
                </div>
              </div>

              {/* Route Freshness Decay Matrix Table */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal size={18} className="text-[#007b8b]" />
                      Ma trận Suy giảm Độ tươi theo Cấp đường (Route Decay Matrix)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Đặc thù môi trường cao tốc, đô thị hoặc đường liên xã quyết định vòng đời biển báo và phạm vi đệm GPS.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3">Cấp đường / Tuyến</th>
                        <th className="px-4 py-3">Vòng đời biển (Ngày)</th>
                        <th className="px-4 py-3">Ngưỡng báo trễ (Ngày)</th>
                        <th className="px-4 py-3">Vùng đệm GPS (Mét)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                      {routeMatrix.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-3 font-sans font-bold text-gray-900 dark:text-white">
                            {item.nameVi || item.name_vi || item.routeClass || item.route_class || `Route #${item.id}`}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="30"
                              max="1000"
                              value={item.defaultLifetimeDays ?? item.default_lifetime_days ?? 180}
                              onChange={(e) =>
                                handleRouteMatrixChange(item.id, 'defaultLifetimeDays', Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-[#007b8b]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="7"
                              max="180"
                              value={item.revalThresholdDays ?? item.reval_threshold_days ?? 30}
                              onChange={(e) =>
                                handleRouteMatrixChange(item.id, 'revalThresholdDays', Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-[#007b8b]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="5"
                              max="100"
                              value={item.spatialBufferMeters ?? item.spatial_buffer_meters ?? 15}
                              onChange={(e) =>
                                handleRouteMatrixChange(item.id, 'spatialBufferMeters', Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-[#007b8b]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Moderation & System Maintenance */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('settings.sec_moderation')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quy tắc phát hiện gian lận vị trí và trạng thái khẩn cấp toàn hệ sinh thái.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Auto Escalate */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {t('settings.lbl_auto_escalate')}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                      {t('settings.desc_auto_escalate')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEscalateTieVotes}
                    onChange={(e) => setAutoEscalateTieVotes(e.target.checked)}
                    className="w-5 h-5 accent-[#007b8b] rounded cursor-pointer"
                  />
                </div>

                {/* Speed Anomaly Limit */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                  <label className="block font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('settings.lbl_speed_anomaly')}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={gpsAnomalySpeedLimitKmh}
                    onChange={(e) => setGpsAnomalySpeedLimitKmh(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                  <p className="text-[11px] text-gray-400">Nếu survey ghi nhận di chuyển vượt quá tốc độ này, hệ thống sẽ tự động gắn cờ nghi ngờ gian lận GPS Spoofing.</p>
                </div>

                {/* Maintenance Mode */}
                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                      {t('settings.lbl_maintenance')}
                    </p>
                    <p className="text-rose-600/80 dark:text-rose-400/80 text-xs mt-0.5">
                      {t('settings.desc_maintenance')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
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
