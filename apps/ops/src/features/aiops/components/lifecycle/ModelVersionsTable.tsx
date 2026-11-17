import { useState, useMemo } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import { Pagination } from '@/components/common/Pagination'
import type { ModelVersionItem } from '@/api/services/aiops.service'
import { ModelEvaluationModal } from './ModelEvaluationModal'

interface ModelVersionsTableProps {
  modelType: 'CLASSIFIER' | 'DETECTOR'
  versions: ModelVersionItem[]
  loading: boolean
  onRollback: () => Promise<void>
  onSwitch: (versionId: number) => Promise<void>
  onRefresh: () => void
}

export function ModelVersionsTable({
  modelType,
  versions,
  loading,
  onRollback,
  onSwitch,
  onRefresh,
}: ModelVersionsTableProps) {
  const [selectedVersionForEval, setSelectedVersionForEval] = useState<ModelVersionItem | null>(null)
  const [confirmRollbackModal, setConfirmRollbackModal] = useState(false)
  const [confirmSwitchId, setConfirmSwitchId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const canRollback = versions.length > 1

  const paginatedVersions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return versions.slice(start, start + pageSize)
  }, [versions, currentPage, pageSize])

  const handleRollbackConfirm = async () => {
    setActionLoading(true)
    try {
      await onRollback()
      setConfirmRollbackModal(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSwitchConfirm = async () => {
    if (!confirmSwitchId) return
    setActionLoading(true)
    try {
      await onSwitch(confirmSwitchId)
      setConfirmSwitchId(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-xs overflow-hidden text-left">
      {/* Table Header Bar */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block">
            Lịch sử phiên bản mô hình
          </span>
          <h4 className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
            {modelType === 'CLASSIFIER' ? 'Danh sách phiên bản classifier' : 'Danh sách phiên bản detector'}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-mono font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => setConfirmRollbackModal(true)}
            disabled={!canRollback || actionLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              !canRollback
                ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10'
            }`}
          >
            Rollback về phiên bản trước
          </button>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-gray-400">
          Đang tải danh sách phiên bản...
        </div>
      ) : versions.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-gray-400">
          Chưa có phiên bản nào trong hệ thống
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-16">ID</th>
                <th className="py-2.5 px-4 font-semibold">Tên phiên bản</th>
                <th className="py-2.5 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-2.5 px-4 font-semibold">Ghi chú</th>
                <th className="py-2.5 px-4 font-semibold">Thời gian tạo</th>
                <th className="py-2.5 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedVersions.map((ver) => (
                <tr
                  key={ver.id}
                  className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                    ver.is_active ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-400 font-bold">{ver.id}</td>

                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    <span className="select-all">{ver.version_tag}</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {ver.is_active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                        Archived
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {ver.note || '-'}
                  </td>

                  <td className="py-3 px-4 text-gray-400 text-[11px]">
                    {ver.created_at ? new Date(ver.created_at).toLocaleString('vi-VN') : '-'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedVersionForEval(ver)}
                        className="px-2.5 py-1 rounded border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        Xem evaluation
                      </button>

                      {!ver.is_active && (
                        <button
                          type="button"
                          onClick={() => setConfirmSwitchId(ver.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded bg-[#007b8b] hover:bg-[#006876] text-white text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Standard Catalog Pagination Footer */}
      {!loading && versions.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={versions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="phiên bản"
          />
        </div>
      )}

      {/* Evaluation Modal */}
      {selectedVersionForEval && (
        <ModelEvaluationModal
          version={selectedVersionForEval}
          modelType={modelType}
          onClose={() => setSelectedVersionForEval(null)}
          onSwitch={() => {
            const verId = selectedVersionForEval.id
            setSelectedVersionForEval(null)
            setConfirmSwitchId(verId)
          }}
        />
      )}

      {/* Rollback Confirmation Modal */}
      {confirmRollbackModal && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setConfirmRollbackModal(false)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl p-5 space-y-4 text-left font-mono my-auto animate-in zoom-in-95"
            >
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Xác nhận rollback
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  Rollback về phiên bản trước
                </h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Hệ thống sẽ ngay lập tức rollback mô hình active về phiên bản hoạt động liền trước. Thao tác này có hiệu lực tức thì mà không cần khởi động lại máy chủ.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setConfirmRollbackModal(false)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleRollbackConfirm}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#007b8b] hover:bg-[#006876] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Đang chuyển đổi...' : 'Xác nhận rollback'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Switch Confirmation Modal */}
      {confirmSwitchId !== null && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setConfirmSwitchId(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl p-5 space-y-4 text-left font-mono my-auto animate-in zoom-in-95"
            >
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Xác nhận switch
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  Switch sang phiên bản {confirmSwitchId}
                </h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Bạn có chắc chắn muốn switch mô hình active sang phiên bản ID {confirmSwitchId} không?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setConfirmSwitchId(null)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSwitchConfirm}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#007b8b] hover:bg-[#006876] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Đang kích hoạt...' : 'Switch ngay'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
