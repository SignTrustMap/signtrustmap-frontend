import { useTranslation } from 'react-i18next'
import {
  Brain,
  Pause,
  Play,
  Cpu,
  Lightning,
  Thermometer,
  Fan,
  HardDrives,
  WifiHigh,
  CircleNotch,
  RocketLaunch,
  Cloud,
} from '@phosphor-icons/react'
import type {
  SystemHardwareMetrics,
  SystemHealthResponse,
} from '@/api/services/aiops.service'

interface HardwareMetricsTabProps {
  metrics: SystemHardwareMetrics | null
  metricsLoading: boolean
  metricsError: string | null
  isStreaming: boolean
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>
  health: SystemHealthResponse | null
  lastUpdated: string
  formatUptime: (seconds: number) => string
}

export function HardwareMetricsTab({
  metrics,
  metricsLoading,
  metricsError,
  isStreaming,
  setIsStreaming,
  health,
  lastUpdated,
  formatUptime,
}: HardwareMetricsTabProps) {
  const { t } = useTranslation('ops')

  return (
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
  )
}
