import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain,
  ArrowsClockwise,
  Play,
  Pause,
  CheckCircle,
  Cpu,
  Lightning,
  Thermometer,
  Fan,
  HardDrives,
  WifiHigh,
  CircleNotch,
  Broadcast,
} from '@phosphor-icons/react'
import { mockTrainingRuns, type ModelRetrainingRun } from '@/data/adminGovernanceData'
import { AiopsService, type SystemHardwareMetrics } from '@/api/services/aiops.service'

export default function AiopsPage() {
  const { t, i18n } = useTranslation('ops')
  const isEn = i18n.language.startsWith('en')

  const [activeTab, setActiveTab] = useState<'metrics' | 'retraining' | 'pipeline' | 'active-learning'>('metrics')
  const [trainingRuns, setTrainingRuns] = useState<ModelRetrainingRun[]>(mockTrainingRuns)
  const [isTriggering, setIsTriggering] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Live Telemetry SSE Stream State
  const [metrics, setMetrics] = useState<SystemHardwareMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // 100% Pure Real-time SSE Stream (Single Persistent Connection)
  useEffect(() => {
    if (!isStreaming || activeTab !== 'metrics') return

    let isSubscribed = true
    let cleanupFn: (() => void) | null = null

    // 50ms debounce prevents React StrictMode from spawning an aborted request in DevTools
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
          setMetricsError('Đang kết nối lại luồng dữ liệu thời gian thực (SSE Stream)...')
        }
      )
    }, 50)

    return () => {
      isSubscribed = false
      clearTimeout(timer)
      if (cleanupFn) cleanupFn()
    }
  }, [isStreaming, activeTab])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleTriggerRetrain() {
    setIsTriggering(true)
    setTimeout(() => {
      const newRun: ModelRetrainingRun = {
        id: `RUN-2026-0${trainingRuns.length + 7}`,
        modelName: 'YOLO12-Detector',
        version: `yolo12-stm-v2.${trainingRuns.length + 2}`,
        triggeredBy: isEn ? 'Admin Manual Trigger' : 'Admin kích hoạt thủ công',
        startedAt: isEn ? 'Just now' : 'Vừa xong',
        duration: isEn ? 'Running...' : 'Đang xử lý...',
        trainingSamplesCount: 18200,
        metricBefore: 91.2,
        metricAfter: 93.5,
        metricGain: '+2.3%',
        status: 'Evaluating',
      }
      setTrainingRuns([newRun, ...trainingRuns])
      setIsTriggering(false)
      showToast(t('mlops.toast_triggered'))
    }, 1200)
  }

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Brain size={16} weight="bold" />
            <span>AIOPS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('mlops.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('mlops.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isTriggering}
            onClick={handleTriggerRetrain}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isTriggering ? <ArrowsClockwise size={18} className="animate-spin" /> : <Play size={18} weight="fill" />}
            <span>{t('mlops.btn_trigger')}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
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

        <button
          type="button"
          onClick={() => setActiveTab('retraining')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'retraining'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_history')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_pipeline')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active-learning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active-learning'
              ? 'bg-[#007b8b] text-white shadow-xs'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_active_learning')}
        </button>
      </div>

      {/* TAB 1: LIVE HARDWARE & AI TELEMETRY STREAM */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Node Status & Stream Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs min-h-[72px]">
            <div className="flex items-center gap-3">
              <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full ${!isStreaming ? 'bg-amber-500' : metricsError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {isStreaming && !metricsError && (
                  <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    {t('mlops.metrics_live_node')}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                    !isStreaming
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {!isStreaming ? 'Stream Paused' : 'SSE Stream (1s Live)'}
                  </span>
                </div>
                <p className="text-[11px] font-mono tabular-nums text-gray-400 mt-0.5">
                  {metricsError && !metrics ? (
                    <span className="text-amber-500 font-bold">{metricsError}</span>
                  ) : (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('mlops.metrics_status_online')}</span>
                      {' • '}
                      {metrics ? `${t('mlops.metrics_uptime')}: ${formatUptime(metrics.uptime_seconds)}` : ''}
                      {lastUpdated && ` • Live Data at ${lastUpdated}`}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsStreaming((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isStreaming
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Pause size={14} weight="bold" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play size={14} weight="fill" />
                    <span>Resume Live Stream</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {metricsLoading && !metrics ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
              <CircleNotch size={32} className="animate-spin text-[#007b8b]" />
              <p className="font-mono text-xs">Connecting to NVIDIA Jetson Orin telemetry stream...</p>
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
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.gpu.load_percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-400 truncate max-w-[120px]">
                        NVIDIA {metrics.gpu.device_name}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, metrics.gpu.load_percent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-500 flex justify-between">
                    <span>GPU Temp:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{metrics.thermal.gpu_temp_c}°C</span>
                  </div>
                </div>

                {/* 2. CPU (6 CORES) */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider">
                      {t('mlops.metrics_cpu_card')}
                    </span>
                    <Cpu size={20} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.cpu.total_percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono tabular-nums text-gray-400">
                        {metrics.cpu.frequency_mhz} MHz ({metrics.cpu.core_count}C)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-[#007b8b] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, metrics.cpu.total_percent)}%` }}
                      />
                    </div>
                  </div>
                  {/* 6-Core breakdown mini bars in footer */}
                  <div className="grid grid-cols-6 gap-1 pt-1 border-t border-gray-100 dark:border-white/10">
                    {metrics.cpu.per_core_percent.map((pct, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-0.5">
                        <div className="w-full bg-gray-100 dark:bg-white/10 h-4 rounded flex items-end overflow-hidden">
                          <div
                            className="w-full bg-[#007b8b]/70 transition-all duration-200"
                            style={{ height: `${Math.max(10, pct)}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-gray-400">C{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. MEMORY (RAM & SWAP) */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[210px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {t('mlops.metrics_ram_card')}
                    </span>
                    <HardDrives size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.memory.percent.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono tabular-nums text-gray-400">
                        {(metrics.memory.used_mb / 1024).toFixed(1)} / {(metrics.memory.total_mb / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${metrics.memory.percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-500 flex justify-between">
                    <span>Swap Used:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {(metrics.memory.swap_used_mb / 1024).toFixed(1)} GB ({metrics.memory.swap_percent.toFixed(0)}%)
                    </span>
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
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.thermal.cpu_temp_c}°C
                      </span>
                      <span className="text-xs font-mono tabular-nums text-emerald-600 font-bold flex items-center gap-1">
                        <Fan size={14} className={isStreaming ? 'animate-spin' : ''} />
                        {metrics.fan.rpm} RPM ({metrics.fan.speed_percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (metrics.thermal.cpu_temp_c / 85) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-500 flex justify-between">
                    <span>SOC / TJ:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {metrics.thermal.soc_temp_c}°C / {metrics.thermal.tj_temp_c}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: 3 EQUAL-HEIGHT METRIC CARDS (180px) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 5. POWER & VOLTAGE */}
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs h-[180px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                      {t('mlops.metrics_power_card')}
                    </span>
                    <Lightning size={20} className="text-amber-500 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono tabular-nums text-gray-900 dark:text-white">
                        {metrics.power.power_w.toFixed(2)} W
                      </span>
                      <span className="text-xs font-mono tabular-nums text-gray-400">
                        {metrics.power.voltage_v.toFixed(2)}V • {metrics.power.current_ma.toFixed(0)}mA
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono text-emerald-600 font-bold">
                    ⚡ Power Rail: Optimal (5V Input)
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
                      <span className="text-gray-500">DL: <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network.download_speed_kbps}</strong> KB/s</span>
                      <span className="text-gray-500">UL: <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network.upload_speed_kbps}</strong> KB/s</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between">
                    <span>Total Rx/Tx:</span>
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

      {/* TAB 2: MODEL RETRAINING HISTORY */}
      {activeTab === 'retraining' && (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_run_id')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_model_version')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_triggered_by')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_samples')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_metric')}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t('mlops.th_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {trainingRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{run.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-purple-600 dark:text-purple-400">{run.modelName}</p>
                      <span className="font-mono text-gray-400 text-[11px]">{run.version}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {run.triggeredBy}
                      <span className="block font-mono text-gray-400 text-[10px]">{run.startedAt} ({run.duration})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-gray-800 dark:text-gray-200">
                      {run.trainingSamplesCount.toLocaleString()} {isEn ? 'crops' : 'khung hình'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className="text-gray-400">{run.metricBefore}%</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="font-bold text-emerald-600">{run.metricAfter}%</span>
                      <span className="ml-1.5 text-xs text-emerald-600 font-bold">({run.metricGain})</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        run.status === 'Active Deployed'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {run.status === 'Active Deployed' ? t('mlops.status_active') : t('mlops.status_evaluating')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PIPELINE MONITOR */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2 h-[150px] flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_workers')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{t('mlops.card_workers_val')}</p>
            <p className="text-xs text-emerald-600 font-medium">{t('mlops.card_workers_desc')}</p>
          </div>
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2 h-[150px] flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_tracking')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">18 Tasks</p>
            <p className="text-xs text-gray-400 font-medium">{t('mlops.card_tracking_desc')}</p>
          </div>
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2 h-[150px] flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_vector')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{t('mlops.card_vector_val')}</p>
            <p className="text-xs text-purple-600 font-medium">{t('mlops.card_vector_desc')}</p>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE LEARNING */}
      {activeTab === 'active-learning' && (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {t('mlops.sec_al_title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">{t('mlops.lbl_uncertainty')}</label>
              <input
                type="text"
                defaultValue="Top-1 Conf - Top-2 Conf < 0.15"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">{t('mlops.lbl_min_samples')}</label>
              <input
                type="number"
                defaultValue={5000}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
