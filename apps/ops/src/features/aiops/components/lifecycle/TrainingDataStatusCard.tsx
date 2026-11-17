import { useState } from 'react'
import type {
  TrainingDataStatusResponse,
  ClassDistributionDiffResponse,
} from '@/api/services/aiops.service'
import { ClassDistributionDiffModal } from './ClassDistributionDiffModal'
import { CatalogDistributionModal } from './CatalogDistributionModal'

interface TrainingDataStatusCardProps {
  statusData: TrainingDataStatusResponse | null
  diffData: ClassDistributionDiffResponse | null
  loading: boolean
  onRefresh: () => void
}

export function TrainingDataStatusCard({
  statusData,
  diffData,
  loading,
  onRefresh,
}: TrainingDataStatusCardProps) {
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [showCatalogModal, setShowCatalogModal] = useState(false)

  const pool = statusData?.classifier_pool
  const totalVerified = statusData?.total_verified_signs_platform ?? 0
  const newCrops = pool?.new_verified_crops_since_active_model ?? 0
  const affectedClasses = pool?.affected_classes_count ?? 0
  const minThreshold = pool?.min_samples_threshold ?? 100
  const isEligible = pool?.is_eligible_for_rebuild ?? false

  const addedCount = diffData?.added_classes?.length ?? 0
  const changedCount = diffData?.changed_classes?.length ?? 0

  return (
    <div className="p-5 rounded-xl border bg-white dark:bg-[#0A171C] border-[#E8E4E3] dark:border-white/10 shadow-xs space-y-4 text-left">
      {/* Top row: Title and Eligibility Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
            Dữ liệu huấn luyện classifier
          </span>
          <h4 className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
            Trạng thái tập mẫu verified
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs font-mono text-gray-400">Đang đồng bộ...</span>
          ) : isEligible ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              Đủ điều kiện rebuild
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              Chưa đủ điều kiện rebuild
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Tổng mẫu verified hệ thống
          </span>
          <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">
            {totalVerified.toLocaleString()}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Mẫu mới tích lũy
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-extrabold ${
                newCrops >= minThreshold
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {newCrops.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">/ {minThreshold} tối thiểu</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Số class biến động
          </span>
          <span className="text-lg font-extrabold text-[#007b8b] dark:text-[#00c4de] mt-0.5 block">
            {affectedClasses}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-gray-50/50 dark:bg-[#061115] border border-gray-200 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Phiên bản active
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white mt-1 block truncate">
            {pool?.active_version_tag || 'Chưa xác định'}
          </span>
        </div>
      </div>

      {/* Action buttons to open Diff and Catalog modals */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-white/5 text-xs font-mono">
        <div className="text-[11px] text-gray-500">
          {addedCount > 0 || changedCount > 0 ? (
            <span>
              Phát hiện {addedCount} class mới và {changedCount} class thay đổi số lượng mẫu
            </span>
          ) : (
            <span>Không có biến động class so với phiên bản active</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiffModal(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 font-bold transition-colors cursor-pointer"
          >
            Xem diff tập mẫu
          </button>
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 font-bold transition-colors cursor-pointer"
          >
            Xem catalog 429 biển báo QCVN 41:2019
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDiffModal && (
        <ClassDistributionDiffModal
          diffData={diffData}
          loading={loading}
          onClose={() => setShowDiffModal(false)}
        />
      )}

      {showCatalogModal && (
        <CatalogDistributionModal onClose={() => setShowCatalogModal(false)} />
      )}
    </div>
  )
}
