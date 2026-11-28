import { useTranslation } from 'react-i18next'
import { Pause, Play, CircleNotch } from '@phosphor-icons/react'
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
    <div className="space-y-4">
      {/* Node Status & Stream Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative w-3 h-3 mt-1 sm:mt-0 shrink-0 flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${!isStreaming ? 'bg-gray-400' : metricsError ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {isStreaming && !metricsError && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                {t('mlops.metrics_live_node')}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums ${!isStreaming
                ? 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                {!isStreaming ? t('mlops.metrics_stream_paused') : t('mlops.metrics_stream_live')}
              </span>

              {/* AI Infrastructure Stack Badges */}
              {health?.dependencies && (
                <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-1">
                  {health.dependencies.cuda && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/10"
                      title={`NVIDIA CUDA Accelerator: ${health.dependencies.cuda.device || 'Orin'}`}
                    >
                      CUDA {health.dependencies.cuda.device || 'Orin'}
                    </span>
                  )}

                  {health.dependencies.tensorrt && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/10"
                      title={`NVIDIA TensorRT Engine v${health.dependencies.tensorrt.version || '10.3'}`}
                    >
                      TensorRT {health.dependencies.tensorrt.version ? `v${health.dependencies.tensorrt.version}` : 'v10.3'}
                    </span>
                  )}

                  {health.dependencies.minio && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/10"
                      title="MinIO Object Storage"
                    >
                      MinIO {health.dependencies.minio.status === 'healthy' ? 'Ready' : 'Not Configured'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] font-mono tabular-nums text-gray-400">
              {metricsError && !metrics ? (
                <span className="text-amber-500 font-bold">{metricsError}</span>
              ) : (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('mlops.metrics_status_online')}</span>
                  {metrics && (
                    <>
                      {' • '}
                      <span>{t('mlops.metrics_uptime')}: {formatUptime(metrics.uptime_seconds)}</span>
                    </>
                  )}
                  {lastUpdated && (
                    <>
                      {' • '}
                      <span>{t('mlops.metrics_live_data_at')} {lastUpdated}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setIsStreaming((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono font-medium hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isStreaming ? (
              <>
                <Pause size={13} weight="bold" />
                <span>{t('mlops.metrics_btn_pause')}</span>
              </>
            ) : (
              <>
                <Play size={13} weight="fill" className="text-emerald-500" />
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
        <div className="space-y-4">
          {/* TOP ROW: 4 EQUAL-HEIGHT METRIC CARDS (190px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. GPU & AI ACCELERATOR */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_gpu_card')}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.gpu?.load_percent != null ? metrics.gpu.load_percent.toFixed(1) : '0.0'}%
                  </span>
                  <span className="text-xs font-bold text-gray-400">{t('mlops.metrics_gpu_load')}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, metrics.gpu?.load_percent ?? 0))}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between items-center gap-1">
                <span className="truncate">{t('mlops.metrics_gpu_target')} {metrics.gpu?.device_name || 'NVIDIA Orin'}</span>
                <span className="text-emerald-600 font-bold shrink-0">{t('mlops.metrics_gpu_fp16_ready')}</span>
              </div>
            </div>

            {/* 2. CPU 6-CORE UTILIZATION */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_cpu_card')}
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.cpu?.total_percent != null ? metrics.cpu.total_percent.toFixed(1) : '0.0'}%
                  </span>
                  <span className="text-xs font-mono tabular-nums text-gray-400">
                    {metrics.cpu?.frequency_mhz ?? 0} MHz
                  </span>
                </div>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${(metrics.cpu?.per_core_percent || []).length || 6}, minmax(0, 1fr))`,
                  }}
                >
                  {(metrics.cpu?.per_core_percent || []).map((core, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className="w-full bg-gray-100 dark:bg-white/10 h-6.5 rounded-xs flex items-end p-0.5 overflow-hidden">
                        <div
                          className="w-full bg-[#007b8b] dark:bg-[#00c4de] rounded-2xs transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(5, core))}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-gray-400">C{i}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono text-gray-400 flex justify-between items-center">
                <span>{t('mlops.metrics_cpu_spec')}</span>
                <span className="text-gray-500">{t('mlops.metrics_cpu_arch')}</span>
              </div>
            </div>

            {/* 3. RAM & SWAP */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_ram_card')}
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.memory?.percent != null ? metrics.memory.percent.toFixed(1) : '0.0'}%
                  </span>
                  <span className="text-xs font-mono tabular-nums text-gray-400">
                    {((metrics.memory?.used_mb ?? 0) / 1024).toFixed(1)} / {((metrics.memory?.total_mb ?? 1) / 1024).toFixed(1)} GB
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, metrics.memory?.percent ?? 0))}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between items-center">
                <span>{t('mlops.metrics_swap')} {((metrics.memory?.swap_used_mb ?? 0) / 1024).toFixed(1)} GB • {(metrics.memory?.swap_percent ?? 0).toFixed(0)}%</span>
                <span>{t('mlops.metrics_free')} {((metrics.memory?.available_mb ?? 0) / 1024).toFixed(1)} GB</span>
              </div>
            </div>

            {/* 4. THERMAL & COOLING FAN */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_thermals_card')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-gray-400 font-mono">{t('mlops.metrics_temp_cpu')}</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.thermal?.cpu_temp_c != null ? metrics.thermal.cpu_temp_c.toFixed(1) : '0.0'}°C
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-mono">{t('mlops.metrics_temp_gpu')}</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.thermal?.gpu_temp_c != null ? metrics.thermal.gpu_temp_c.toFixed(1) : '0.0'}°C
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="text-gray-400">
                  {t('mlops.metrics_fan_prefix')} {(metrics.fan?.rpm ?? 0).toLocaleString()} RPM
                </span>
                <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">{(metrics.fan?.speed_percent ?? 0).toFixed(0)}% PWM</span>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: POWER, STORAGE & NETWORK (190px) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 5. POWER CONSUMPTION */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_power_card')}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-gray-900 dark:text-white">
                    {metrics.power?.power_w != null ? metrics.power.power_w.toFixed(2) : '0.00'} W
                  </span>
                </div>
                <p className="text-xs font-mono tabular-nums text-gray-400 mt-1">
                  {(metrics.power?.voltage_v ?? 0).toFixed(2)} V • {(metrics.power?.current_ma ?? 0).toFixed(0)} mA
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono text-emerald-600 font-bold">
                {t('mlops.metrics_power_rail_optimal')}
              </div>
            </div>

            {/* 6. STORAGE & DISK IO (Span 2) */}
            {(() => {
              const totalDiskUsed = (metrics.disks || []).reduce((acc, d) => acc + (d.used_gb ?? 0), 0)
              const totalDiskTotal = (metrics.disks || []).reduce((acc, d) => acc + (d.total_gb ?? 0), 0)
              const totalDiskPercent = totalDiskTotal > 0 ? (totalDiskUsed / totalDiskTotal) * 100 : 0

              return (
                <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs h-[190px] flex flex-col justify-between lg:col-span-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {t('mlops.metrics_storage_card')}
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                      {(metrics.disks || []).map((d, idx) => (
                        <div key={idx} className="space-y-1 text-xs min-w-0">
                          <div className="flex items-center justify-between gap-1.5 font-mono tabular-nums text-[11px]">
                            <span
                              className="font-bold text-gray-800 dark:text-gray-200 truncate"
                              title={`${d.mountpoint} • ${d.fstype}`}
                            >
                              {d.mountpoint} <span className="text-gray-400 font-normal">• {d.fstype}</span>
                            </span>
                            <span className="text-gray-400 shrink-0 text-[10px]">
                              {(d.used_gb ?? 0).toFixed(1)}/{(d.total_gb ?? 0).toFixed(0)}G • <strong className={(d.percent ?? 0) > 85 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>{d.percent ?? 0}%</strong>
                            </span>
                          </div>
                          <div className="w-full bg-gray-200/70 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${(d.percent ?? 0) > 85 ? 'bg-red-500' : 'bg-[#007b8b] dark:bg-[#00c4de]'}`}
                              style={{ width: `${Math.min(100, Math.max(0, d.percent ?? 0))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between items-center">
                    <span>{t('mlops.metrics_storage_total')}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {totalDiskUsed.toFixed(1)}G / {totalDiskTotal.toFixed(0)}G ({totalDiskPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* 7. NETWORK THROUGHPUT */}
            <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs h-[190px] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('mlops.metrics_network_card')}
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
                  <span className="text-gray-500">{t('mlops.metrics_net_dl')} <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network?.download_speed_kbps ?? 0}</strong> KB/s</span>
                  <span className="text-gray-500">{t('mlops.metrics_net_ul')} <strong className="text-gray-900 dark:text-white font-bold text-base">{metrics.network?.upload_speed_kbps ?? 0}</strong> KB/s</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-[11px] font-mono tabular-nums text-gray-400 flex justify-between items-center">
                <span>{t('mlops.metrics_net_total')}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {((metrics.network?.total_recv_mb ?? 0) / 1024).toFixed(1)}G / {((metrics.network?.total_sent_mb ?? 0) / 1024).toFixed(1)}G
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
