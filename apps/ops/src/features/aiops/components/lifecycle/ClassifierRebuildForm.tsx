import { useState, useEffect } from 'react'
import {
  AiopsService,
  type ClassifierRebuildRequest,
  type ClassifierRebuildResponse,
} from '@/api/services/aiops.service'
import { getParamDisplayLabel } from '../../constants/mlopsLabels'

interface ClassifierRebuildFormProps {
  currentHyperparams?: Record<string, any>
  activeVersionTag?: string | null
  isEligible: boolean
  onRebuildSuccess: (result: ClassifierRebuildResponse) => void
}

export function ClassifierRebuildForm({
  currentHyperparams,
  activeVersionTag,
  isEligible,
  onRebuildSuccess,
}: ClassifierRebuildFormProps) {
  const generateSuggestedTag = (baseTag?: string | null): string => {
    if (!baseTag) {
      const now = new Date()
      return `classifier-v${now.getFullYear()}.${now.getMonth() + 1}`
    }
    const match = baseTag.match(/(.*-v)(\d+)\.(\d+)/)
    if (match) {
      const prefix = match[1]
      const major = match[2]
      const minor = parseInt(match[3], 10) + 1
      return `${prefix}${major}.${minor}`
    }
    return `${baseTag}-rebuild`
  }

  const [versionTag, setVersionTag] = useState('')
  const [note, setNote] = useState('Cập nhật mẫu xác thực mới')
  const [force, setForce] = useState(false)
  const [params, setParams] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (activeVersionTag && !versionTag) {
      setVersionTag(generateSuggestedTag(activeVersionTag))
    }
    if (currentHyperparams && Object.keys(currentHyperparams).length > 0) {
      setParams((prev) => {
        if (Object.keys(prev).length === 0) {
          return { ...currentHyperparams }
        }
        return prev
      })
    }
  }, [currentHyperparams, activeVersionTag, versionTag])

  const handleParamChange = (key: string, val: string) => {
    const num = Number(val)
    setParams((prev) => ({
      ...prev,
      [key]: isNaN(num) ? val : num,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!versionTag.trim()) {
      setErrorMsg('Vui lòng nhập tên phiên bản')
      return
    }

    if (!isEligible && !force) {
      setErrorMsg('Số lượng mẫu mới chưa đạt ngưỡng tối thiểu. Đánh dấu vào tùy chọn bắt buộc để tiếp tục.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    const payload: ClassifierRebuildRequest = {
      version_tag: versionTag.trim(),
      note: note.trim() || undefined,
      force,
      ...params,
    }

    try {
      const result = await AiopsService.rebuildClassifier(payload)
      onRebuildSuccess(result)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Không thể thực hiện cập nhật mô hình'
      setErrorMsg(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  const paramKeys = Object.keys(params)

  return (
    <div className="p-5 rounded-xl border bg-white dark:bg-[#0A171C] border-[#E8E4E3] dark:border-white/10 shadow-xs space-y-4 text-left">
      <div>
        <h4 className="text-sm font-bold font-mono text-gray-900 dark:text-white">
          Rebuild classifier
        </h4>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic fields: Version Tag & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Version tag
            </label>
            <input
              type="text"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              placeholder="ví dụ: classifier-v2.3"
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b] font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              Ghi chú cập nhật
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho phiên bản này..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b]"
            />
          </div>
        </div>

        {/* Dynamic Hyperparameters Grid */}
        {paramKeys.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Hyperparameters mặc định
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {paramKeys.map((key) => {
                const label = getParamDisplayLabel(key)
                return (
                  <div key={key} className="p-2.5 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10">
                    <label className="block text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={params[key] ?? ''}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submit controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
          <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer select-none text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              disabled={isSubmitting}
              className="rounded border-gray-300 dark:border-gray-700 text-[#007b8b] focus:ring-0"
            />
            <span>Bắt buộc rebuild</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-lg text-xs font-bold font-mono text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#007b8b] hover:bg-[#006876] shadow-xs'
            }`}
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
            )}
            <span>{isSubmitting ? 'Rebuild classifier...' : 'Rebuild classifier'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
