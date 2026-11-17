import type { MetricItem } from '@/api/services/aiops.service'
import { getMetricDisplayLabel, formatMetricValue } from '../../constants/mlopsLabels'

interface DynamicMetricsRendererProps {
  metrics: MetricItem[]
  comparisonWithActive?: Record<string, any>
  sampleCount?: number
}

export function DynamicMetricsRenderer({
  metrics,
  comparisonWithActive,
  sampleCount,
}: DynamicMetricsRendererProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-4 text-center text-xs font-mono text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg">
        Chưa có chỉ số evaluation
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sampleCount !== undefined && sampleCount > 0 && (
        <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Tập mẫu test set: <span className="font-bold text-gray-900 dark:text-white">{sampleCount.toLocaleString()}</span> mẫu
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {metrics.map((item, idx) => {
          const label = getMetricDisplayLabel(item.metric_name)
          const formattedVal = formatMetricValue(item.metric_name, item.metric_value)

          let deltaValue: string | null = null
          if (comparisonWithActive) {
            if (item.metric_name === 'top1_accuracy' && comparisonWithActive.delta_accuracy) {
              deltaValue = comparisonWithActive.delta_accuracy
            } else if (item.metric_name === 'macro_f1' && comparisonWithActive.delta_f1) {
              deltaValue = comparisonWithActive.delta_f1
            } else {
              const targetKey = `delta_${item.metric_name}`
              if (comparisonWithActive[targetKey]) {
                deltaValue = String(comparisonWithActive[targetKey])
              }
            }
          }

          const isPositive = deltaValue && (deltaValue.startsWith('+') || !deltaValue.startsWith('-'))
          const isNegative = deltaValue && deltaValue.startsWith('-')

          return (
            <div
              key={item.metric_name || idx}
              className="p-3 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10"
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono">
                {label}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-extrabold font-mono text-gray-900 dark:text-white">
                  {formattedVal}
                </span>
                {deltaValue && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isNegative
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                        : isPositive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {deltaValue}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
