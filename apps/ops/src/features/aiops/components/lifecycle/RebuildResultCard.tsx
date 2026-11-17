import { useState } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import type { ClassifierRebuildResponse, MetricItem } from '@/api/services/aiops.service'
import { DynamicMetricsRenderer } from './DynamicMetricsRenderer'

interface RebuildResultCardProps {
  result: ClassifierRebuildResponse
  onDeploy: (versionId: number) => Promise<void>
  onDismiss: () => void
}

export function RebuildResultCard({
  result,
  onDeploy,
  onDismiss,
}: RebuildResultCardProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const newModel = result.new_model
  const evalMetrics = result.evaluation_metrics
  const comparison = evalMetrics?.comparison_with_active

  const metricsList: MetricItem[] = []
  if (evalMetrics) {
    if (evalMetrics.top1_accuracy !== undefined) {
      metricsList.push({ metric_name: 'top1_accuracy', metric_value: evalMetrics.top1_accuracy, split: 'test' })
    }
    if (evalMetrics.top5_accuracy !== undefined) {
      metricsList.push({ metric_name: 'top5_accuracy', metric_value: evalMetrics.top5_accuracy, split: 'test' })
    }
    if (evalMetrics.macro_f1 !== undefined) {
      metricsList.push({ metric_name: 'macro_f1', metric_value: evalMetrics.macro_f1, split: 'test' })
    }
    if (evalMetrics.latency_ms !== undefined) {
      metricsList.push({ metric_name: 'latency_ms', metric_value: evalMetrics.latency_ms, split: 'test' })
    }
    Object.keys(evalMetrics).forEach((key) => {
      if (
        !['sample_count', 'top1_accuracy', 'top5_accuracy', 'macro_f1', 'latency_ms', 'comparison_with_active'].includes(key) &&
        typeof evalMetrics[key] === 'number'
      ) {
        metricsList.push({ metric_name: key, metric_value: evalMetrics[key], split: 'test' })
      }
    })
  }

  const isAccuracyDegraded = comparison?.delta_accuracy && String(comparison.delta_accuracy).startsWith('-')

  const handleDeployClick = () => {
    if (isAccuracyDegraded) {
      setShowWarningModal(true)
      return
    }
    executeDeploy()
  }

  const executeDeploy = async () => {
    setIsDeploying(true)
    try {
      await onDeploy(newModel.version_id)
      onDismiss()
    } finally {
      setIsDeploying(false)
      setShowWarningModal(false)
    }
  }

  return (
    <div className="p-5 rounded-xl border bg-white dark:bg-[#0A171C] border-[#007b8b]/30 dark:border-[#00c4de]/30 shadow-xs space-y-4 text-left ring-1 ring-[#007b8b]/10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#007b8b] dark:text-[#00c4de]">
              Rebuild classifier thành công
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20">
              {newModel.version_tag}
            </span>
          </div>
          <h4 className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-1">
            Kết quả đánh giá test set
          </h4>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
          <span>Mã phiên bản: <strong className="text-gray-900 dark:text-white">{newModel.version_id}</strong></span>
          <span>•</span>
          <span>Số vector shot: <strong className="text-gray-900 dark:text-white">{newModel.sample_count || '-'}</strong></span>
        </div>
      </div>

      {/* Metrics Grid */}
      <DynamicMetricsRenderer
        metrics={metricsList}
        comparisonWithActive={comparison}
        sampleCount={evalMetrics?.sample_count}
      />

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5 font-mono text-xs">
        <span className="text-gray-500 text-[11px]">
          Phiên bản mới đang ở trạng thái chờ. Bạn có thể deploy ngay hoặc lưu trữ để kiểm tra thêm.
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDeploying}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            Để sau
          </button>

          <button
            type="button"
            onClick={handleDeployClick}
            disabled={isDeploying}
            className="px-4 py-1.5 rounded-lg bg-[#007b8b] hover:bg-[#006876] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isDeploying && (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
            )}
            <span>{isDeploying ? 'Đang deploy...' : 'Deploy ngay'}</span>
          </button>
        </div>
      </div>

      {/* Warning Modal when accuracy is degraded */}
      {showWarningModal && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowWarningModal(false)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl p-5 space-y-4 text-left font-mono my-auto animate-in zoom-in-95"
            >
              <div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Cảnh báo suy giảm accuracy
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  Xác nhận deploy phiên bản mới
                </h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Mô hình mới có độ chính xác Top-1 thay đổi <strong className="text-rose-600 dark:text-rose-400">{comparison?.delta_accuracy}</strong> so với phiên bản active. Bạn có chắc chắn muốn deploy phiên bản này không?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeDeploy}
                  disabled={isDeploying}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isDeploying ? 'Đang deploy...' : 'Vẫn deploy'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
