import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import {
  AiopsService,
  type SystemHardwareMetrics,
  type SystemHealthResponse,
  type ModelsResponse,
  type ActiveLearningStrategiesResponse,
  type ClassesResponse,
  type SystemConfigResponse,
} from '@/api/services/aiops.service'
import { HardwareMetricsTab } from './components/HardwareMetricsTab'
import { ModelsTab } from './components/ModelsTab'
import { ActiveLearningTab } from './components/ActiveLearningTab'
import { ClassesTab } from './components/ClassesTab'
import { SystemConfigTab } from './components/SystemConfigTab'
import { ModelLifecycleTab } from './components/lifecycle/ModelLifecycleTab'
import { ErrorBoundary } from '@shared/ui'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${Math.floor(seconds % 60)}s`
}

export default function AiopsPage() {
  const { t, i18n } = useTranslation('ops')
  const toast = useToast()
  const isEn = i18n.language?.startsWith('en')

  // Search Params for direct URL linking (?tab=versions hoặc ?tab=lifecycle)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const validTabs = ['metrics', 'models', 'active-learning', 'classes', 'config', 'evaluation', 'lifecycle', 'versions']

  // 6 Active Tabs: Metrics, Models, Active Learning, Classes, Config, and Model Versions
  const [activeTab, setActiveTabState] = useState<
    'metrics' | 'models' | 'active-learning' | 'classes' | 'config' | 'versions'
  >(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      if (tabFromUrl === 'evaluation' || tabFromUrl === 'lifecycle' || tabFromUrl === 'versions') {
        return 'versions'
      }
      return tabFromUrl as any
    }
    return 'metrics'
  })

  const setActiveTab = useCallback(
    (tab: 'metrics' | 'models' | 'active-learning' | 'classes' | 'config' | 'versions') => {
      setActiveTabState(tab)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', tab)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

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

  // Active Learning State (/api/v1/active-learning/strategies & /api/v1/mlops/active-learning/config)
  const [strategiesData, setStrategiesData] = useState<ActiveLearningStrategiesResponse | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('r3_cec')
  const [selectedAggregation, setSelectedAggregation] = useState<string>('avg')
  const [topK, setTopK] = useState<number>(50)
  const [uncertaintyMargin, setUncertaintyMargin] = useState<string>('Top-1 Conf - Top-2 Conf < 0.15')
  const [minSamplesForAutoRetrain, setMinSamplesForAutoRetrain] = useState<number>(50)
  const [alSaving, setAlSaving] = useState(false)
  const [alFetched, setAlFetched] = useState(false)

  // Classes State (/api/v1/classes)
  const [classesData, setClassesData] = useState<ClassesResponse | null>(null)
  const [classesLoading, setClassesLoading] = useState(false)
  const [classesSearch, setClassesSearch] = useState<string>('')

  // Config State (/api/v1/config)
  const [configData, setConfigData] = useState<SystemConfigResponse | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configFetched, setConfigFetched] = useState(false)
  const [savingGroup, setSavingGroup] = useState<string | null>(null)
  const [isResettingConfig, setIsResettingConfig] = useState(false)
  const [configViewMode, setConfigViewMode] = useState<'tree' | 'json'>('tree')
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({})

  // 1. Fetch One-Time Health Snapshot on Mount & Preload Tab Counts
  useEffect(() => {
    AiopsService.getSystemHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.warn('Could not fetch initial system health:', err))

    AiopsService.getModels()
      .then((data) => setModelsData(data))
      .catch(() => {})

    AiopsService.getClasses()
      .then((data) => setClassesData(data))
      .catch(() => {})
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

  // 3. Fetch Active Learning Strategies & Backend Config when Tab is Opened
  useEffect(() => {
    if (activeTab === 'active-learning' && !alFetched) {
      setAlFetched(true)
      Promise.allSettled([
        AiopsService.getStrategies(),
        AiopsService.getActiveLearningConfig(),
      ]).then(([stratRes, alConfigRes]) => {
        if (stratRes.status === 'fulfilled' && stratRes.value) {
          const data = stratRes.value
          setStrategiesData(data)
          if (data.default_strategy) setSelectedStrategy(data.default_strategy)
          if (data.default_aggregation) setSelectedAggregation(data.default_aggregation)
          if (data.default_top_k) setTopK(data.default_top_k)
        }
        if (alConfigRes.status === 'fulfilled' && alConfigRes.value) {
          const raw: any = (alConfigRes.value as any)?.data || alConfigRes.value
          if (raw?.uncertaintyMargin) setUncertaintyMargin(raw.uncertaintyMargin)
          if (raw?.minSamplesForAutoRetrain !== undefined) {
            setMinSamplesForAutoRetrain(Number(raw.minSamplesForAutoRetrain))
          }
          if (raw?.defaultStrategy) setSelectedStrategy(raw.defaultStrategy)
          if (raw?.defaultTopK !== undefined) setTopK(Number(raw.defaultTopK))
        }
      })
    }
  }, [activeTab, alFetched])

  // 4. Fetch Classes when Tab is Opened
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

  // 5. Fetch Full System Config Tree (/api/v1/config)
  const fetchFullConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const data = await AiopsService.getConfig()
      setConfigData(data)
    } catch (err: any) {
      console.warn('Failed to fetch config:', err)
      toast.error(err?.message || (isEn ? 'Failed to fetch AI configuration' : 'Không thể tải cấu hình AI'))
    } finally {
      setConfigLoading(false)
    }
  }, [toast, isEn])

  useEffect(() => {
    if (activeTab === 'config' && !configFetched) {
      setConfigFetched(true)
      fetchFullConfig()
    }
  }, [activeTab, configFetched, fetchFullConfig])

  // 6. Real-time SSE Stream (Single Persistent Connection)
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

  async function handleSaveActiveLearning() {
    setAlSaving(true)
    try {
      const [edgeRes, backendRes] = await Promise.allSettled([
        AiopsService.updateConfigGroup('active_learning', {
          default_strategy: selectedStrategy,
          default_aggregation: selectedAggregation,
          default_top_k: topK,
        }),
        AiopsService.updateActiveLearningConfig({
          uncertaintyMargin,
          minSamplesForAutoRetrain,
          defaultStrategy: selectedStrategy,
          defaultTopK: topK,
        }),
      ])

      const edgeOk = edgeRes.status === 'fulfilled'
      const backendOk = backendRes.status === 'fulfilled'

      if (edgeOk && backendOk) {
        toast.success(isEn ? 'Active learning settings saved' : 'Đã lưu cấu hình Active learning')
      } else if (edgeOk || backendOk) {
        toast.warning(
          isEn
            ? 'Saved partially across servers'
            : 'Đã lưu nhưng một máy chủ chưa đồng bộ được'
        )
      } else {
        toast.error(isEn ? 'Could not save active learning settings' : 'Không thể lưu cấu hình Active learning')
      }

      if (edgeOk && configFetched) {
        fetchFullConfig()
      }
    } finally {
      setAlSaving(false)
    }
  }

  async function handleSaveConfigGroup(groupName: string, payload: Record<string, any>) {
    setSavingGroup(groupName)
    try {
      await AiopsService.updateConfigGroup(groupName, payload)
      toast.success(
        isEn ? `Saved ${groupName} configuration` : `Đã lưu nhóm cấu hình ${groupName}`
      )
      await fetchFullConfig()
      if (groupName === 'active_learning') {
        if (payload.default_strategy) setSelectedStrategy(payload.default_strategy)
        if (payload.default_aggregation) setSelectedAggregation(payload.default_aggregation)
        if (payload.default_top_k !== undefined) setTopK(Number(payload.default_top_k))
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          (isEn ? 'Failed to save configuration group' : 'Không thể lưu nhóm cấu hình')
      )
    } finally {
      setSavingGroup(null)
    }
  }

  async function handleResetConfig() {
    setIsResettingConfig(true)
    try {
      const res = await AiopsService.resetConfig()
      if (res?.config) {
        setConfigData(res.config)
        if (res.config.active_learning) {
          setSelectedStrategy(res.config.active_learning.default_strategy)
          setSelectedAggregation(res.config.active_learning.default_aggregation)
          setTopK(res.config.active_learning.default_top_k)
        }
      } else {
        await fetchFullConfig()
      }
      toast.success(
        isEn ? 'AI configuration restored to defaults' : 'Đã khôi phục cấu hình AI về mặc định'
      )
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Failed to reset configuration' : 'Không thể khôi phục mặc định'))
    } finally {
      setIsResettingConfig(false)
    }
  }

  function handleCopyJson() {
    if (!configData) return
    navigator.clipboard.writeText(JSON.stringify(configData, null, 2))
    toast.success(t('mlops.config_copied'))
  }

  function toggleBranch(branchKey: string) {
    setCollapsedBranches((prev) => ({
      ...prev,
      [branchKey]: !prev[branchKey],
    }))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-5 w-full">
      {/* Page Title Only - Clean & Minimalist */}
      <PageHeader title={t('mlops.title')} />

      {/* Sleek Segmented Tab Navigation Bar - Compact, Icon-Free, Never Wraps */}
      <div className="p-1 bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 rounded-xl inline-flex items-center gap-1 shadow-2xs max-w-full overflow-x-auto flex-nowrap scrollbar-none">
        {/* Tab 1: Live Hardware Telemetry */}
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{t('mlops.tab_metrics')}</span>
          {isStreaming && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
        </button>

        {/* Tab 2: Model Weights Catalog */}
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'models'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{isEn ? 'Model Files' : 'Tệp mô hình'}</span>
          {modelsData && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
              {modelsData.total_detectors + modelsData.total_classifiers}
            </span>
          )}
        </button>

        {/* Tab 3: Active Learning Strategy */}
        <button
          type="button"
          onClick={() => setActiveTab('active-learning')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'active-learning'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{t('mlops.tab_active_learning')}</span>
        </button>

        {/* Tab 4: 100 Dataset Classes */}
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'classes'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{t('mlops.tab_classes')}</span>
          {Boolean(classesData?.total_classes || classesData?.total || classesData?.classes?.length) && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
              {classesData?.total_classes ?? classesData?.total ?? classesData?.classes?.length}
            </span>
          )}
        </button>

        {/* Tab 5: AI System Configuration */}
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'config'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{t('mlops.tab_config')}</span>
        </button>

        {/* Tab 6: Model Rebuild & Version Management */}
        <button
          type="button"
          onClick={() => setActiveTab('versions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'versions'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10 font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>{isEn ? 'Model Versions' : 'Quản lý phiên bản'}</span>
        </button>
      </div>

      {/* Tab Contents protected by ErrorBoundary */}
      <ErrorBoundary
        key={activeTab}
        variant="card"
        title="Module AI MLOps tạm thời gặp sự cố"
        description="Đã xảy ra lỗi khi kết nối hoặc dựng dữ liệu từ AI Service (ai.signmap.site). Vui lòng thử lại tab này."
      >
      {/* Tab 1: Live Hardware & AI Telemetry Stream */}
      {activeTab === 'metrics' && (
        <HardwareMetricsTab
          metrics={metrics}
          metricsLoading={metricsLoading}
          metricsError={metricsError}
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          health={health}
          lastUpdated={lastUpdated}
          formatUptime={formatUptime}
        />
      )}

      {/* Tab 2: AI Weights & Models Catalog */}
      {activeTab === 'models' && (
        <ModelsTab
          modelsData={modelsData}
          modelsLoading={modelsLoading}
          modelsSubTab={modelsSubTab}
          setModelsSubTab={setModelsSubTab}
        />
      )}

      {/* Tab 3: Active Learning Strategy */}
      {activeTab === 'active-learning' && (
        <ActiveLearningTab
          strategiesData={strategiesData}
          selectedStrategy={selectedStrategy}
          setSelectedStrategy={setSelectedStrategy}
          selectedAggregation={selectedAggregation}
          setSelectedAggregation={setSelectedAggregation}
          topK={topK}
          setTopK={setTopK}
          uncertaintyMargin={uncertaintyMargin}
          setUncertaintyMargin={setUncertaintyMargin}
          onSave={handleSaveActiveLearning}
          isSaving={alSaving}
        />
      )}

      {/* Tab 4: 100 Dataset Classes */}
      {activeTab === 'classes' && (
        <ClassesTab
          classesData={classesData}
          classesLoading={classesLoading}
          classesSearch={classesSearch}
          setClassesSearch={setClassesSearch}
        />
      )}

      {/* Tab 5: AI System Configuration */}
      {activeTab === 'config' && (
        <SystemConfigTab
          configData={configData}
          configLoading={configLoading}
          configViewMode={configViewMode}
          setConfigViewMode={setConfigViewMode}
          collapsedBranches={collapsedBranches}
          toggleBranch={toggleBranch}
          onCopyJson={handleCopyJson}
          onRefresh={fetchFullConfig}
          onSaveGroup={handleSaveConfigGroup}
          onResetConfig={handleResetConfig}
          savingGroup={savingGroup}
          isResetting={isResettingConfig}
        />
      )}

      {/* Tab 6: Model Rebuild & Version Management */}
      {activeTab === 'versions' && (
        <ModelLifecycleTab />
      )}
      </ErrorBoundary>
    </div>
  )
}
