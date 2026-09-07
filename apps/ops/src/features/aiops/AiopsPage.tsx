import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain,
  Pause,
  Play,
  CheckCircle,
  Cpu,
  Lightning,
  Thermometer,
  Fan,
  HardDrives,
  WifiHigh,
  CircleNotch,
  Broadcast,
  RocketLaunch,
  Cloud,
  SlidersHorizontal,
  Tag,
  Package,
  MagnifyingGlass,
  FloppyDisk,
  FileCode,
  Sparkle,
  Code,
  Copy,
  CaretDown,
  CaretRight,
  GearSix,
  Check,
} from '@phosphor-icons/react'
import {
  AiopsService,
  type SystemHardwareMetrics,
  type SystemHealthResponse,
  type ModelsResponse,
  type ActiveLearningStrategiesResponse,
  type ClassesResponse,
  type SystemConfigResponse,
} from '@/api/services/aiops.service'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${Math.floor(seconds % 60)}s`
}

export default function AiopsPage() {
  const { t } = useTranslation('ops')

  // 5 Active Tabs connecting to real APIs
  const [activeTab, setActiveTab] = useState<'metrics' | 'models' | 'active-learning' | 'classes' | 'config'>('metrics')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Infrastructure Health (/api/v1/system/health)
  const [health, setHealth] = useState<SystemHealthResponse | null>(null)

  // Live Telemetry SSE Stream (/api/v1/system/stream)
  const [metrics, setMetrics] = useState<SystemHardwareMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Models State (/api/v1/models)
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsSubTab, setModelsSubTab] = useState<'detectors' | 'classifiers'>('detectors')

  // Active Learning State (/api/v1/active-learning/strategies)
  const [strategiesData, setStrategiesData] = useState<ActiveLearningStrategiesResponse | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('least_confidence')
  const [selectedAggregation, setSelectedAggregation] = useState<string>('avg')
  const [topK, setTopK] = useState<number>(50)
  const [uncertaintyMargin, setUncertaintyMargin] = useState<string>('Top-1 Conf - Top-2 Conf < 0.15')
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false)
  const [aggDropdownOpen, setAggDropdownOpen] = useState(false)
  const strategyRef = useRef<HTMLDivElement>(null)
  const aggRef = useRef<HTMLDivElement>(null)

  // Click outside listener for custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (strategyRef.current && !strategyRef.current.contains(event.target as Node)) {
        setStrategyDropdownOpen(false)
      }
      if (aggRef.current && !aggRef.current.contains(event.target as Node)) {
        setAggDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Classes State (/api/v1/classes)
  const [classesData, setClassesData] = useState<ClassesResponse | null>(null)
  const [classesLoading, setClassesLoading] = useState(false)
  const [classesSearch, setClassesSearch] = useState<string>('')

  // Config State (/api/v1/config)
  const [configData, setConfigData] = useState<SystemConfigResponse | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configViewMode, setConfigViewMode] = useState<'tree' | 'json'>('tree')
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({})

  // 1. Fetch One-Time Health Snapshot on Mount
  useEffect(() => {
    AiopsService.getSystemHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.warn('Could not fetch initial system health:', err))
  }, [])

  // 2. Fetch Models when Tab is Opened
  useEffect(() => {
    if (activeTab === 'models' && !modelsData && !modelsLoading) {
      setModelsLoading(true)
      AiopsService.getModels()
        .then((data) => {
          setModelsData(data)
          setModelsLoading(false)
        })
        .catch((err) => {
          console.warn('Failed to fetch models:', err)
          setModelsLoading(false)
        })
    }
  }, [activeTab, modelsData, modelsLoading])

  // 3. Fetch Active Learning Strategies when Tab is Opened
  useEffect(() => {
    if (activeTab === 'active-learning' && !strategiesData) {
      AiopsService.getStrategies()
        .then((data) => {
          setStrategiesData(data)
          if (data.default_strategy) setSelectedStrategy(data.default_strategy)
          if (data.default_aggregation) setSelectedAggregation(data.default_aggregation)
          if (data.default_top_k) setTopK(data.default_top_k)
        })
        .catch((err) => console.warn('Failed to fetch strategies:', err))
    }
  }, [activeTab, strategiesData])

  // 4. Fetch 100 Classes when Tab is Opened
  useEffect(() => {
    if (activeTab === 'classes' && !classesData && !classesLoading) {
      setClassesLoading(true)
      AiopsService.getClasses()
        .then((data) => {
          setClassesData(data)
          setClassesLoading(false)
        })
        .catch((err) => {
          console.warn('Failed to fetch classes:', err)
          setClassesLoading(false)
        })
    }
  }, [activeTab, classesData, classesLoading])

  // 5. Fetch Full System Config Tree when Tab is Opened
  useEffect(() => {
    if (activeTab === 'config' && !configData && !configLoading) {
      setConfigLoading(true)
      AiopsService.getConfig()
        .then((data) => {
          setConfigData(data)
          setConfigLoading(false)
        })
        .catch((err) => {
          console.warn('Failed to fetch config:', err)
          setConfigLoading(false)
        })
    }
  }, [activeTab, configData, configLoading])

  // 6. 100% Pure Real-time SSE Stream (Single Persistent Connection)
  useEffect(() => {
    if (!isStreaming || activeTab !== 'metrics') return

    let isSubscribed = true
    let cleanupFn: (() => void) | null = null

    const timer = setTimeout(() => {
      if (!isSubscribed) return
      cleanupFn = AiopsService.subscribeSystemMetricsStream(
        (data) => {
          if (!isSubscribed) return
          setMetrics(data)
          setMetricsLoading(false)
          setMetricsError(null)
          setLastUpdated(new Date().toLocaleTimeString())
        },
        (err) => {
          if (!isSubscribed) return
          console.warn('SSE stream error or reconnecting:', err)
          setMetricsError(t('mlops.metrics_reconnecting'))
        }
      )
    }, 50)

    return () => {
      isSubscribed = false
      clearTimeout(timer)
      if (cleanupFn) cleanupFn()
    }
  }, [isStreaming, activeTab, t])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleSaveActiveLearning() {
    showToast(t('mlops.al_toast_saved'))
  }

  function handleCopyJson() {
    if (!configData) return
    navigator.clipboard.writeText(JSON.stringify(configData, null, 2))
    showToast(t('mlops.config_copied'))
  }

  function toggleBranch(branchKey: string) {
    setCollapsedBranches((prev) => ({
      ...prev,
      [branchKey]: !prev[branchKey],
    }))
  }

  // Filter Classes
  const filteredClasses = (classesData?.classes || []).filter((c) => {
    const q = classesSearch.toLowerCase()
    return (
      c.class_id.toString().includes(q) ||
      c.class_name.toLowerCase().includes(q) ||
      c.human_readable_name.toLowerCase().includes(q) ||
      c.prompt.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <Brain size={16} weight="bold" />
            <span>{t('mlops.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('mlops.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('mlops.subtitle')}
          </p>
        </div>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Dismiss toast"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* 5 Active Real API Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
        {/* Tab 1: Live Hardware Telemetry */}
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Broadcast size={16} weight="bold" />
          <span>{t('mlops.tab_metrics')}</span>
          {isStreaming && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          )}
        </button>

        {/* Tab 2: Model Weights Catalog */}
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'models'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Package size={16} weight="bold" />
          <span>{t('mlops.tab_models')}</span>
          {modelsData && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {modelsData.total_detectors + modelsData.total_classifiers}
            </span>
          )}
        </button>

        {/* Tab 3: Active Learning Strategy */}
        <button
          type="button"
          onClick={() => setActiveTab('active-learning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'active-learning'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <SlidersHorizontal size={16} weight="bold" />
          <span>{t('mlops.tab_active_learning')}</span>
        </button>

        {/* Tab 4: 100 Dataset Classes */}
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Tag size={16} weight="bold" />
          <span>{t('mlops.tab_classes')}</span>
          {classesData && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-700 dark:text-teal-300">
              {classesData.total}
            </span>
          )}
        </button>

        {/* Tab 5: AI System Configuration */}
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <GearSix size={16} weight="bold" />
          <span>{t('mlops.tab_config')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE HARDWARE & AI TELEMETRY STREAM (/api/v1/system/stream)        */}
      {/* ========================================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Node Status & Stream Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative w-3.5 h-3.5 mt-1 sm:mt-0 shrink-0 flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full ${!isStreaming ? 'bg-amber-500' : metricsError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {isStreaming && !metricsError && (
                  <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    {t('mlops.metrics_live_node')}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                    !isStreaming
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {!isStreaming ? t('mlops.metrics_stream_paused') : t('mlops.metrics_stream_live')}
                  </span>

                  {/* AI Infrastructure Stack Badges (Health Check) */}
                  {health?.dependencies && (
                    <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-1">
                      {/* 1. CUDA Compute Badge */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/25"
                        title={`NVIDIA CUDA Accelerator: ${health.dependencies.cuda.device || 'Orin'} (${health.dependencies.cuda.status})`}
                      >
                        <Lightning size={11} weight="fill" className="text-purple-500 shrink-0" />
                        <span>CUDA: {health.dependencies.cuda.device || 'Orin'}</span>
                      </span>

                      {/* 2. TensorRT Inference Badge */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#00c4de]/30"
                        title={`NVIDIA TensorRT Engine v${health.dependencies.tensorrt.version} (trtexec: ${health.dependencies.tensorrt.trtexec_available ? 'Available' : 'Unavailable'})`}
                      >
                        <RocketLaunch size={11} weight="fill" className="text-[#00c4de] shrink-0" />
                        <span>TensorRT: v{health.dependencies.tensorrt.version || '10.3.0'}</span>
                      </span>

                      {/* 3. MinIO Object Storage Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          health.dependencies.minio.status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        }`}
                        title={health.dependencies.minio.error || (health.dependencies.minio.status === 'healthy' ? 'MinIO Object Storage Connected' : 'MinIO: Environment variables missing')}
                      >
                        <Cloud size={11} weight="fill" className={health.dependencies.minio.status === 'healthy' ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
                        <span>MinIO: {health.dependencies.minio.status === 'healthy' ? 'Ready' : 'Not Configured'}</span>
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] font-mono tabular-nums text-gray-400">
                  {metricsError && !metrics ? (
                    <span className="text-amber-500 font-bold">{metricsError}</span>
                  ) : (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('mlops.metrics_status_online')}</span>
                      {' • '}
                      {metrics ? `${t('mlops.metrics_uptime')}: ${formatUptime(metrics.uptime_seconds)}` : ''}
                      {lastUpdated && ` • ${t('mlops.metrics_live_data_at')} ${lastUpdated}`}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
              <button
                type="button"
                onClick={() => setIsStreaming((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isStreaming
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Pause size={14} weight="bold" />
                    <span>{t('mlops.metrics_btn_pause')}</span>
                  </>
                ) : (
                  <>
                    <Play size={14} weight="fill" />
                    <span>{t('mlops.metrics_btn_resume')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {metricsLoading && !metrics ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl">
              <CircleNotch size={32} className="animate-spin text-[#007b8b]" />
              <p className="font-mono text-xs">{t('mlops.metrics_connecting')}</p>
            </div>
          ) : metrics ? (
            <div className="space-y-5">
              {/* TOP ROW: 4 EQUAL-HEIGHT METRIC CARDS (210px) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. GPU & AI ACCELERATOR */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {t('mlops.metrics_gpu_card')}
                    </span>
                    <Brain size={20} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.gpu.load_percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-bold text-gray-400">{t('mlops.metrics_gpu_load')}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.gpu.load_percent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between">
                    <span>{t('mlops.metrics_gpu_target')} {metrics.gpu.device_name}</span>
                    <span className="text-emerald-600 font-bold">{t('mlops.metrics_gpu_fp16_ready')}</span>
                  </div>
                </div>

                {/* 2. CPU 6-CORE UTILIZATION */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider">
                      {t('mlops.metrics_cpu_card')}
                    </span>
                    <Cpu size={20} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.cpu.total_percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono tabular-nums text-gray-400">
                        {metrics.cpu.frequency_mhz} MHz
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {metrics.cpu.per_core_percent.map((core, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-full bg-gray-100 dark:bg-white/10 h-8 rounded-sm flex items-end p-0.5 overflow-hidden">
                            <div
                              className="w-full bg-[#007b8b] dark:bg-[#00c4de] rounded-xs transition-all duration-300"
                              style={{ height: `${Math.min(100, Math.max(5, core))}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-gray-400">C{i}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono text-gray-400 flex justify-between">
                    <span>{t('mlops.metrics_cpu_spec')}</span>
                    <span className="text-gray-500">{t('mlops.metrics_cpu_arch')}</span>
                  </div>
                </div>

                {/* 3. RAM & SWAP */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {t('mlops.metrics_ram_card')}
                    </span>
                    <HardDrives size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.memory.percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono tabular-nums text-gray-400">
                        {(metrics.memory.used_mb / 1024).toFixed(1)} / {(metrics.memory.total_mb / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, metrics.memory.percent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between">
                    <span>{t('mlops.metrics_swap')} {(metrics.memory.swap_used_mb / 1024).toFixed(1)} GB ({metrics.memory.swap_percent.toFixed(0)}%)</span>
                    <span>{t('mlops.metrics_free')} {(metrics.memory.available_mb / 1024).toFixed(1)} GB</span>
                  </div>
                </div>

                {/* 4. THERMAL & COOLING FAN */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {t('mlops.metrics_thermals_card')}
                    </span>
                    <Thermometer size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-400 font-mono">{t('mlops.metrics_temp_cpu')}</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.thermal.cpu_temp_c.toFixed(1)}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-mono">{t('mlops.metrics_temp_gpu')}</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.thermal.gpu_temp_c.toFixed(1)}°C
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Fan size={14} className="animate-spin text-[#007b8b]" style={{ animationDuration: `${Math.max(0.4, 2 - metrics.fan.speed_percent / 60)}s` }} />
                      {t('mlops.metrics_fan_prefix')} {metrics.fan.rpm.toLocaleString()} RPM
                    </span>
                    <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">{metrics.fan.speed_percent.toFixed(0)}% PWM</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: POWER, STORAGE & NETWORK (180px) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 5. POWER CONSUMPTION */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[180px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {t('mlops.metrics_power_card')}
                    </span>
                    <Lightning size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.power.power_w.toFixed(2)} W
                      </span>
                    </div>
                    <p className="text-xs font-mono tabular-nums text-gray-400 mt-1">
                      {metrics.power.voltage_v.toFixed(2)} V • {metrics.power.current_ma.toFixed(0)} mA
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono text-emerald-600 font-bold">
                    {t('mlops.metrics_power_rail_optimal')}
                  </div>
                </div>

                {/* 6. STORAGE & DISK IO (Span 2) */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[180px] flex flex-col justify-between lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">
                      {t('mlops.metrics_storage_card')}
                    </span>
                    <HardDrives size={20} className="text-gray-500 shrink-0" />
                  </div>
                  <div className="space-y-2.5">
                    {metrics.disks.map((d, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between font-mono tabular-nums">
                          <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                            {d.mountpoint} ({d.fstype})
                          </span>
                          <span className="text-gray-400">
                            {d.used_gb.toFixed(1)} / {d.total_gb.toFixed(1)} GB ({d.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${d.percent > 85 ? 'bg-red-500' : 'bg-[#007b8b]'}`}
                            style={{ width: `${d.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. NETWORK THROUGHPUT */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[180px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {t('mlops.metrics_network_card')}
                    </span>
                    <WifiHigh size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
                      <span className="text-gray-500">{t('mlops.metrics_net_dl')} <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network.download_speed_kbps}</strong> KB/s</span>
                      <span className="text-gray-500">{t('mlops.metrics_net_ul')} <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network.upload_speed_kbps}</strong> KB/s</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between">
                    <span>{t('mlops.metrics_net_total')}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {(metrics.network.total_recv_mb / 1024).toFixed(1)}G / {(metrics.network.total_sent_mb / 1024).toFixed(1)}G
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI WEIGHTS & MODELS CATALOG (/api/v1/models)                       */}
      {/* ========================================================================= */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_detectors')}</span>
              <p className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                {modelsData?.total_detectors ?? 10} Weights
              </p>
              <p className="text-xs text-gray-500">{t('mlops.models_kpi_detectors_desc')}</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_classifiers')}</span>
              <p className="text-3xl font-extrabold font-mono text-[#007b8b] dark:text-[#00c4de]">
                {modelsData?.total_classifiers ?? 4} Weights
              </p>
              <p className="text-xs text-gray-500">{t('mlops.models_kpi_classifiers_desc')}</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_engine')}</span>
              <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                TensorRT 10.3
              </p>
              <p className="text-xs text-gray-500">{t('mlops.models_kpi_engine_desc')}</p>
            </div>
          </div>

          {/* Models Table Container */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
            {/* Sub-tabs header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModelsSubTab('detectors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    modelsSubTab === 'detectors'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t('mlops.models_detectors')} ({modelsData?.total_detectors ?? 10})
                </button>

                <button
                  type="button"
                  onClick={() => setModelsSubTab('classifiers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    modelsSubTab === 'classifiers'
                      ? 'bg-[#007b8b] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t('mlops.models_classifiers')} ({modelsData?.total_classifiers ?? 4})
                </button>
              </div>

              <div className="text-xs text-gray-400 font-mono">
                {t('mlops.models_storage_path')} <strong className="text-gray-700 dark:text-gray-200">/media/taiduc_orico_ssd/weights</strong>
              </div>
            </div>

            {modelsLoading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <CircleNotch size={28} className="animate-spin text-[#007b8b]" />
                <span className="text-xs font-mono">{t('mlops.models_loading')}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_filename')}</th>
                      <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_format')}</th>
                      <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_size')}</th>
                      <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_modified')}</th>
                      <th className="py-3.5 px-4 font-semibold text-center">{t('mlops.models_th_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {(modelsSubTab === 'detectors' ? modelsData?.detectors : modelsData?.classifiers)?.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileCode size={16} className="text-gray-400" />
                          <span>{m.filename}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                              m.format === 'engine'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : m.format === 'onnx'
                                ? 'bg-cyan-500/15 text-cyan-600 dark:text-[#00c4de] border border-cyan-500/30'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {m.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200">
                          {m.size_human}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                          {m.modified_at}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              m.is_loaded
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                            }`}
                          >
                            {m.is_loaded ? t('mlops.models_status_loaded') : t('mlops.models_status_standby')}
                          </span>
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

      {/* ========================================================================= */}
      {/* TAB 3: ACTIVE LEARNING STRATEGY (/api/v1/active-learning/strategies)      */}
      {/* ========================================================================= */}
      {activeTab === 'active-learning' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
                <SlidersHorizontal size={16} weight="bold" />
                <span>{t('mlops.tab_active_learning')}</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('mlops.al_sec_sampling')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('mlops.al_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              {/* Strategy Algorithm Custom Dropdown */}
              <div className="space-y-1.5" ref={strategyRef}>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
                  {t('mlops.al_lbl_strategy')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStrategyDropdownOpen(!strategyDropdownOpen)
                      setAggDropdownOpen(false)
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-[#061115] border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                      strategyDropdownOpen
                        ? 'border-[#007b8b] ring-2 ring-[#007b8b]/20 dark:border-[#00c4de] dark:ring-[#00c4de]/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-gray-900 dark:text-white">
                      {selectedStrategy === 'least_confidence' ? 'Least Confidence' : selectedStrategy}
                    </span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`text-gray-400 transition-transform duration-200 ${
                        strategyDropdownOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {strategyDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                      {(strategiesData?.strategies || ['least_confidence']).map((s) => {
                        const isSelected = selectedStrategy === s
                        return (
                          <div
                            key={s}
                            onClick={() => {
                              setSelectedStrategy(s)
                              setStrategyDropdownOpen(false)
                            }}
                            className={`px-3.5 py-2.5 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{s === 'least_confidence' ? 'Least Confidence' : s}</span>
                            {isSelected && <Check size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 block">{t('mlops.al_strategy_least_confidence_desc')}</span>
              </div>

              {/* Aggregation Method Custom Dropdown */}
              <div className="space-y-1.5" ref={aggRef}>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
                  {t('mlops.al_lbl_aggregation')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAggDropdownOpen(!aggDropdownOpen)
                      setStrategyDropdownOpen(false)
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-[#061115] border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                      aggDropdownOpen
                        ? 'border-[#007b8b] ring-2 ring-[#007b8b]/20 dark:border-[#00c4de] dark:ring-[#00c4de]/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-gray-900 dark:text-white uppercase">
                      {selectedAggregation}
                    </span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`text-gray-400 transition-transform duration-200 ${
                        aggDropdownOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {aggDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                      {(strategiesData?.aggregation_methods || ['avg', 'max', 'min', 'sum']).map((m) => {
                        const isSelected = selectedAggregation === m
                        return (
                          <div
                            key={m}
                            onClick={() => {
                              setSelectedAggregation(m)
                              setAggDropdownOpen(false)
                            }}
                            className={`px-3.5 py-2.5 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className="uppercase">{m}</span>
                            {isSelected && <Check size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 block">{t('mlops.al_agg_desc')}</span>
              </div>

              {/* Top-K Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-mono">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('mlops.al_lbl_top_k')}</label>
                  <span className="font-bold text-[#007b8b] dark:text-[#00c4de] text-sm tabular-nums">
                    {topK} {t('mlops.al_samples_unit')}
                  </span>
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={10}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full accent-[#007b8b] cursor-pointer"
                  />
                </div>
                <span className="text-[11px] text-gray-400 block pt-0.5">{t('mlops.al_top_k_desc')}</span>
              </div>
            </div>

            {/* Uncertainty Formula & Threshold */}
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10 space-y-2.5">
              <label className="block font-mono font-bold text-gray-500 uppercase text-xs tracking-wide">
                {t('mlops.al_lbl_uncertainty')}
              </label>
              <input
                type="text"
                value={uncertaintyMargin}
                onChange={(e) => setUncertaintyMargin(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono text-xs bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
              />
              <p className="text-[11px] text-gray-400 pt-0.5">
                {t('mlops.al_uncertainty_desc')}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
                <Sparkle size={14} weight="fill" />
                {t('mlops.al_active_strategy_prefix')} {selectedStrategy} ({selectedAggregation}) • Top {topK}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveActiveLearning}
                  className="px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>{t('mlops.al_btn_save')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 100 DATASET CLASSES (/api/v1/classes)                               */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Header and Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Tag size={24} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {t('mlops.classes_total_label')} ({classesData?.total ?? 100})
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  {t('mlops.classes_desc')}
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-80">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('mlops.classes_search_placeholder')}
                value={classesSearch}
                onChange={(e) => setClassesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00c4de]"
              />
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
            {classesLoading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <CircleNotch size={28} className="animate-spin text-[#007b8b]" />
                <span className="text-xs font-mono">{t('mlops.classes_loading')}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="py-3 px-4 font-semibold w-24">{t('mlops.classes_th_id')}</th>
                      <th className="py-3 px-4 font-semibold w-64">{t('mlops.classes_th_name')}</th>
                      <th className="py-3 px-4 font-semibold w-56">{t('mlops.classes_th_human')}</th>
                      <th className="py-3 px-4 font-semibold">{t('mlops.classes_th_prompt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredClasses.map((c) => (
                      <tr key={c.class_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">
                          #{c.class_id.toString().padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                          {c.class_name}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                          {c.human_readable_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <code className="px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-purple-600 dark:text-purple-300 font-mono text-[11px]">
                            {c.prompt}
                          </code>
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

      {/* ========================================================================= */}
      {/* TAB 5: AI SYSTEM CONFIGURATION (/api/v1/config)                           */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Header Bar with View Switch & Copy Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">
                <GearSix size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {t('mlops.config_title')}
                </h2>
                <p className="text-xs text-gray-400">
                  {t('mlops.config_subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* View Switch */}
              <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setConfigViewMode('tree')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    configViewMode === 'tree'
                      ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal size={14} weight="bold" />
                  <span>{t('mlops.config_view_tree')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfigViewMode('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    configViewMode === 'json'
                      ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Code size={14} weight="bold" />
                  <span>{t('mlops.config_view_json')}</span>
                </button>
              </div>

              {/* Copy JSON Button */}
              <button
                type="button"
                onClick={handleCopyJson}
                disabled={!configData}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Copy size={15} weight="bold" />
                <span>{t('mlops.config_copy_json')}</span>
              </button>
            </div>
          </div>

          {configLoading ? (
            <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl">
              <CircleNotch size={32} className="animate-spin text-[#007b8b]" />
              <p className="font-mono text-xs">{t('mlops.config_loading')}</p>
            </div>
          ) : configData ? (
            configViewMode === 'json' ? (
              /* RAW JSON INSPECTOR VIEW */
              <div className="bg-[#0b1015] border border-white/10 rounded-2xl p-5 shadow-inner overflow-x-auto">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                  {JSON.stringify(configData, null, 2)}
                </pre>
              </div>
            ) : (
              /* SUBSYSTEMS OVERVIEW VIEW */
              <div className="space-y-6">
                {/* 1. ROOT CENTRAL NODE */}
                <div className="p-5 bg-linear-to-r from-teal-900/40 via-[#0A171C] to-purple-900/40 border-2 border-[#007b8b]/40 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-[#007b8b] text-white shadow-md shrink-0">
                      <Brain size={28} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#00c4de] uppercase tracking-wider">{t('mlops.config_root_badge')}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">{t('mlops.config_subsystems_active')}</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white">
                        {t('mlops.config_root_node')}
                      </h3>
                      <p className="text-xs font-mono text-gray-400">
                        {t('mlops.config_root_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-white/10 text-gray-200 border border-white/15">
                      Orin GPU Device: #{configData.system.default_device}
                    </span>
                  </div>
                </div>

                {/* 2. 5 SUBSYSTEM CONFIG CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* BRANCH 1: ACTIVE LEARNING */}
                  <div className="bg-white dark:bg-[#0A171C] border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                    <div
                      onClick={() => toggleBranch('active_learning')}
                      className="flex items-center justify-between cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          <SlidersHorizontal size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">active_learning</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600">9 params</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('mlops.config_branch_al')}
                          </h4>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                        {collapsedBranches['active_learning'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      </button>
                    </div>

                    {!collapsedBranches['active_learning'] && (
                      <div className="pl-4 border-l-2 border-dashed border-purple-500/25 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_strategy</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">"{configData.active_learning.default_strategy}"</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_aggregation</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">"{configData.active_learning.default_aggregation}"</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_top_k</span>
                          <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">{configData.active_learning.default_top_k}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">discrepancy_threshold</span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">{configData.active_learning.discrepancy_threshold}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">auto_trigger_training</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            {configData.active_learning.auto_trigger_training ? 'true (Active)' : 'false'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">min_batch_size_detector / classifier</span>
                          <span className="text-gray-800 dark:text-gray-200 font-bold">
                            {configData.active_learning.min_batch_size_detector} / {configData.active_learning.min_batch_size_classifier}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">dataset_store_path</span>
                          <span className="text-amber-600 dark:text-amber-400 text-[11px] truncate max-w-[240px]" title={configData.active_learning.dataset_store_path}>
                            "{configData.active_learning.dataset_store_path}"
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BRANCH 2: OBJECT DETECTOR */}
                  <div className="bg-white dark:bg-[#0A171C] border border-[#007b8b]/20 dark:border-[#00c4de]/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#007b8b]" />
                    <div
                      onClick={() => toggleBranch('detector')}
                      className="flex items-center justify-between cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                          <Package size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">detector</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">2 params</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('mlops.config_branch_detector')}
                          </h4>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                        {collapsedBranches['detector'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      </button>
                    </div>

                    {!collapsedBranches['detector'] && (
                      <div className="pl-4 border-l-2 border-dashed border-[#007b8b]/25 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">active_model</span>
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {configData.detector.active_model}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_conf</span>
                          <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">
                            {configData.detector.default_conf} ({(configData.detector.default_conf * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BRANCH 3: ZERO-SHOT CLASSIFIER */}
                  <div className="bg-white dark:bg-[#0A171C] border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                    <div
                      onClick={() => toggleBranch('classifier')}
                      className="flex items-center justify-between cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          <Tag size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">classifier</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600">3 params</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('mlops.config_branch_classifier')}
                          </h4>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                        {collapsedBranches['classifier'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      </button>
                    </div>

                    {!collapsedBranches['classifier'] && (
                      <div className="pl-4 border-l-2 border-dashed border-blue-500/25 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">active_model</span>
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {configData.classifier.active_model}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_conf</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {configData.classifier.default_conf} ({(configData.classifier.default_conf * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">prompt_template</span>
                          <code className="text-purple-600 dark:text-purple-300 text-[11px] bg-purple-500/10 px-2 py-0.5 rounded">
                            "{configData.classifier.prompt_template}"
                          </code>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BRANCH 4: SYSTEM RUNTIME & HARDWARE */}
                  <div className="bg-white dark:bg-[#0A171C] border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                    <div
                      onClick={() => toggleBranch('system')}
                      className="flex items-center justify-between cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <GearSix size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">system</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600">3 params</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('mlops.config_branch_system')}
                          </h4>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                        {collapsedBranches['system'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      </button>
                    </div>

                    {!collapsedBranches['system'] && (
                      <div className="pl-4 border-l-2 border-dashed border-emerald-500/25 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">default_device</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">GPU #{configData.system.default_device}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">model_idle_timeout_seconds</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{configData.system.model_idle_timeout_seconds}s (30 mins)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">log_level</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {configData.system.log_level}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BRANCH 5: OBJECT STORAGE */}
                  <div className="bg-white dark:bg-[#0A171C] border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden lg:col-span-2">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                    <div
                      onClick={() => toggleBranch('storage')}
                      className="flex items-center justify-between cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <Cloud size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">storage</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600">2 params</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('mlops.config_branch_storage')}
                          </h4>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                        {collapsedBranches['storage'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                      </button>
                    </div>

                    {!collapsedBranches['storage'] && (
                      <div className="pl-4 border-l-2 border-dashed border-amber-500/25 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">minio_bucket</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">"{configData.storage.minio_bucket}"</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                          <span className="text-gray-500">minio_endpoint</span>
                          <span className="text-gray-400 italic">
                            {configData.storage.minio_endpoint ? `"${configData.storage.minio_endpoint}"` : '(Local SSD Storage Mode)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  )
}
