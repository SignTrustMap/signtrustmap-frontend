import { useEffect, useState } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  AiopsService,
  type EvaluationMetricsResponse,
  type ModelVersionItem,
} from '@/api/services/aiops.service'
import { DynamicMetricsRenderer } from './DynamicMetricsRenderer'

interface ModelEvaluationModalProps {
  version: ModelVersionItem | null
  modelType: 'CLASSIFIER' | 'DETECTOR'
  onClose: () => void
  onSwitch?: () => void
}

export function ModelEvaluationModal({
  version,
  modelType,
  onClose,
  onSwitch,
}: ModelEvaluationModalProps) {
  const [data, setData] = useState<EvaluationMetricsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!version) return

    setLoading(true)
    setError(null)
    const fetchEval =
      modelType === 'CLASSIFIER'
        ? AiopsService.getClassifierEvaluation(version.id)
        : AiopsService.getDetectorEvaluation(version.id)

    fetchEval
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || err?.message || 'Không thể tải chỉ số kiểm thử')
        setLoading(false)
      })
  }, [version, modelType])

  if (!version) return null

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-2xl overflow-hidden text-left my-auto animate-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Chỉ số evaluation phiên bản
              </span>
              {version.is_active && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              )}
            </div>
            <h3 className="text-base font-bold font-mono text-gray-900 dark:text-white mt-0.5">
              {version.version_tag}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-mono font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Metadata row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono bg-gray-50/50 dark:bg-[#061115] p-3 rounded-lg border border-gray-200 dark:border-white/10">
            <div>
              <span className="text-gray-400 block text-[10px]">Mã phiên bản:</span>
              <span className="font-bold text-gray-900 dark:text-white">{version.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Loại mô hình:</span>
              <span className="font-bold text-gray-900 dark:text-white">{version.model_type}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Thời gian tạo:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {version.created_at ? new Date(version.created_at).toLocaleString('vi-VN') : '-'}
              </span>
            </div>
          </div>

          {version.note && (
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-[#061115] p-3 rounded-lg border border-gray-200 dark:border-white/10">
              <span className="text-gray-400 block text-[10px] uppercase font-bold mb-0.5">Ghi chú</span>
              <span>{version.note}</span>
            </div>
          )}

          {/* Metrics section */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase text-gray-700 dark:text-gray-300 mb-2">
              Kết quả evaluation trên test set
            </h4>

            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-gray-400">
                Đang tải dữ liệu evaluation...
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-600 dark:text-rose-400">
                {error}
              </div>
            ) : data && data.metrics ? (
              <DynamicMetricsRenderer metrics={data.metrics} />
            ) : (
              <div className="p-4 text-center text-xs font-mono text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg">
                Không tìm thấy dữ liệu evaluation cho phiên bản này
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div>
            {!version.is_active && onSwitch && (
              <button
                type="button"
                onClick={onSwitch}
                className="px-4 py-1.5 text-xs font-bold font-mono bg-[#007b8b] hover:bg-[#006876] text-white rounded-lg transition-colors cursor-pointer"
              >
                Switch sang phiên bản này
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold font-mono border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  )
}
