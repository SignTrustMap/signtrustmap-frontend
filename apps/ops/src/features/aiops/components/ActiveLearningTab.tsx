import { useTranslation } from 'react-i18next'
import { CircleNotch } from '@phosphor-icons/react'
import type { ActiveLearningStrategiesResponse } from '@/api/services/aiops.service'

interface ActiveLearningTabProps {
  strategiesData: ActiveLearningStrategiesResponse | null
  selectedStrategy: string
  setSelectedStrategy: React.Dispatch<React.SetStateAction<string>>
  selectedAggregation: string
  setSelectedAggregation: React.Dispatch<React.SetStateAction<string>>
  topK: number
  setTopK: React.Dispatch<React.SetStateAction<number>>
  uncertaintyMargin: string
  setUncertaintyMargin: React.Dispatch<React.SetStateAction<string>>
  onSave: () => void
  isSaving?: boolean
}

export function ActiveLearningTab({
  strategiesData,
  selectedStrategy,
  setSelectedStrategy,
  selectedAggregation,
  setSelectedAggregation,
  topK,
  setTopK,
  uncertaintyMargin,
  setUncertaintyMargin,
  onSave,
  isSaving = false,
}: ActiveLearningTabProps) {
  const { i18n } = useTranslation('ops')
  const isEn = i18n.language?.startsWith('en')

  const availableStrategies = Array.from(
    new Set(
      [
        ...(strategiesData?.strategies || []),
        strategiesData?.default_strategy,
        'least_confidence',
        'r3_cec',
        'margin',
        'entropy',
      ].filter(Boolean) as string[]
    )
  )

  const availableAggregations = strategiesData?.aggregation_methods?.length
    ? strategiesData.aggregation_methods
    : ['avg', 'max', 'min', 'sum']

  const strategyDescriptions: Record<string, string> = {
    least_confidence: isEn
      ? 'Selects bounding boxes with lowest prediction confidence score.'
      : 'Ưu tiên trích xuất các khung nhận diện có điểm tin cậy thấp nhất.',
    r3_cec: isEn
      ? 'Diversity-aware sampling combining uncertainty with sample representativeness.'
      : 'Cân bằng giữa độ bất định và tính đa dạng phân bổ hình ảnh trong cụm dữ liệu.',
    margin: isEn
      ? 'Calculates difference between top two predicted class probabilities.'
      : 'Đo lường độ chênh lệch xác suất giữa nhãn cao nhất và nhãn kế tiếp.',
    entropy: isEn
      ? 'Measures prediction entropy across all classes to find highly uncertain samples.'
      : 'Tính toán độ hỗn loạn entropy trên toàn bộ 100 lớp biển báo.',
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-5 shadow-xs space-y-6">
        {/* Header Description */}
        <div className="border-b border-gray-100 dark:border-white/10 pb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {isEn ? 'Active Learning Sampling Configuration' : 'Cấu hình lấy mẫu & Active learning'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">
            {isEn
              ? 'Active learning prioritizes low-confidence, borderline detections from reviewers for automated retraining cycles.'
              : 'Thuật toán Active learning tự động sàng lọc những phát hiện có độ tin cậy thấp hoặc có sự bất đồng từ reviewer để đưa vào chu trình huấn luyện lại.'}
          </p>
        </div>

        {/* 2-Column Clean Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* 1. Strategy Algorithm Selection */}
          <div className="space-y-1.5">
            <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase">
              {isEn ? 'Sampling Strategy' : 'Chiến lược lấy mẫu'}
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b] cursor-pointer"
            >
              {availableStrategies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">
              {strategyDescriptions[selectedStrategy] || strategyDescriptions.least_confidence}
            </p>
          </div>

          {/* 2. Aggregation Method */}
          <div className="space-y-1.5">
            <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase">
              {isEn ? 'Aggregation Method' : 'Phương thức gộp điểm'}
            </label>
            <select
              value={selectedAggregation}
              onChange={(e) => setSelectedAggregation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b] cursor-pointer uppercase"
            >
              {availableAggregations.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">
              {isEn ? 'Combines box confidence scores across multiple detections.' : 'Cách gộp điểm tin cậy khi một ảnh chứa nhiều khung phát hiện.'}
            </p>
          </div>

          {/* 3. Top-K Sampling Slider & Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <label className="font-bold text-gray-700 dark:text-gray-300 uppercase">
                {isEn ? 'Top-K Sample Budget' : 'Ngân sách mẫu Top-K'}
              </label>
              <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">
                {topK} {isEn ? 'samples' : 'mẫu'}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-[#007b8b] cursor-pointer"
              />
              <input
                type="number"
                min={10}
                max={500}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-right text-xs"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {isEn ? 'Number of uncertain instances extracted per batch.' : 'Số lượng mẫu bất định nhiều nhất được gom lại trong mỗi mẻ gán nhãn.'}
            </p>
          </div>

          {/* 4. Uncertainty Criteria / Threshold Formula */}
          <div className="space-y-1.5">
            <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase">
              {isEn ? 'Uncertainty Criterion / Margin' : 'Ngưỡng margin bất định'}
            </label>
            <input
              type="text"
              value={uncertaintyMargin}
              onChange={(e) => setUncertaintyMargin(e.target.value)}
              placeholder="Top-1 Conf - Top-2 Conf < 0.15"
              className="w-full px-3 py-2 font-mono text-xs bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:border-[#007b8b]"
            />
            <p className="text-[11px] text-gray-400">
              {isEn ? 'Triggers sampling when prediction margin falls below this rule.' : 'Kích hoạt lấy mẫu khi độ lệch xác suất thỏa mãn điều kiện này.'}
            </p>
          </div>
        </div>

        {/* Action & Summary Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            <span>{isEn ? 'Current configuration:' : 'Cấu hình hiện hành:'} </span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              {selectedStrategy} • {selectedAggregation} • Top {topK}
            </strong>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className="px-5 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <CircleNotch size={14} className="animate-spin" />}
            <span>{isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save configuration' : 'Lưu cấu hình Active learning')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
