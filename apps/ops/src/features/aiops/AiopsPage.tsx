import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import {
  Broadcast,
  Package,
  SlidersHorizontal,
  Tag,
  GearSix,
  Scales,
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
import { HardwareMetricsTab } from './components/HardwareMetricsTab'
import { ModelsTab } from './components/ModelsTab'
import { ActiveLearningTab } from './components/ActiveLearningTab'
import { ClassesTab } from './components/ClassesTab'
import { SystemConfigTab } from './components/SystemConfigTab'
import { CandidateEvaluationTab } from './components/CandidateEvaluationTab'

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
  const toast = useToast()

  // 6 Active Tabs: Metrics, Models, Active Learning, Classes, Config, and Candidate Evaluation
  const [activeTab, setActiveTab] = useState<
    'metrics' | 'models' | 'active-learning' | 'classes' | 'config' | 'evaluation'
  >('metrics')

  // Model Evaluation & Governed Deployment State
  const [activeModelVersion, setActiveModelVersion] = useState('YOLOv11x-v2.3')
  const [candidateModelVersion] = useState('YOLOv11x-v2.4-retrained')
  const [candidateStatus, setCandidateStatus] = useState<'pending_review' | 'promoted' | 'rejected'>('pending_review')

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

  function handleSaveActiveLearning() {
    toast.success(t('mlops.al_toast_saved'))
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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Page Title Only - Clean & Minimalist */}
      <PageHeader title={t('mlops.title')} />

      {/* Sleek Segmented Tab Navigation Bar */}
      <div className="p-1 bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 rounded-2xl inline-flex flex-wrap items-center gap-1 shadow-2xs max-w-full overflow-x-auto">
        {/* Tab 1: Live Hardware Telemetry */}
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Broadcast
            size={15}
            weight={activeTab === 'metrics' ? 'bold' : 'regular'}
            className={activeTab === 'metrics' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>{t('mlops.tab_metrics')}</span>
          {isStreaming && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0" />
          )}
        </button>

        {/* Tab 2: Model Weights Catalog */}
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'models'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Package
            size={15}
            weight={activeTab === 'models' ? 'bold' : 'regular'}
            className={activeTab === 'models' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>{t('mlops.tab_models')}</span>
          {modelsData && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {modelsData.total_detectors + modelsData.total_classifiers}
            </span>
          )}
        </button>

        {/* Tab 3: Active Learning Strategy */}
        <button
          type="button"
          onClick={() => setActiveTab('active-learning')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'active-learning'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <SlidersHorizontal
            size={15}
            weight={activeTab === 'active-learning' ? 'bold' : 'regular'}
            className={activeTab === 'active-learning' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>{t('mlops.tab_active_learning')}</span>
        </button>

        {/* Tab 4: 100 Dataset Classes */}
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Tag
            size={15}
            weight={activeTab === 'classes' ? 'bold' : 'regular'}
            className={activeTab === 'classes' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>{t('mlops.tab_classes')}</span>
          {classesData && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {classesData.total}
            </span>
          )}
        </button>

        {/* Tab 5: AI System Configuration */}
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <GearSix
            size={15}
            weight={activeTab === 'config' ? 'bold' : 'regular'}
            className={activeTab === 'config' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>{t('mlops.tab_config')}</span>
        </button>

        {/* Tab 6: Candidate Evaluation & Controlled Deployment */}
        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'evaluation'
              ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Scales
            size={15}
            weight={activeTab === 'evaluation' ? 'bold' : 'regular'}
            className={activeTab === 'evaluation' ? 'text-[#007b8b] dark:text-[#00c4de]' : 'text-neutral-400'}
          />
          <span>Đánh giá & Triển khai</span>
          {candidateStatus === 'pending_review' && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Ứng viên v2.4
            </span>
          )}
        </button>
      </div>

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
        />
      )}

      {/* Tab 6: Candidate Model Evaluation & Controlled Deployment */}
      {activeTab === 'evaluation' && (
        <CandidateEvaluationTab
          activeModelVersion={activeModelVersion}
          setActiveModelVersion={setActiveModelVersion}
          candidateModelVersion={candidateModelVersion}
          candidateStatus={candidateStatus}
          setCandidateStatus={setCandidateStatus}
        />
      )}
    </div>
  )
}
