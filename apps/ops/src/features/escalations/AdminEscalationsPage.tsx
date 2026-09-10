import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect from '@/components/common/CustomSelect'
import { ModalPortal } from '@/components/common/ModalPortal'
import { X, CheckCircle, Prohibit, Scales } from '@phosphor-icons/react'
import { mockAdminEscalations, type AdminEscalationCase } from '@/data/adminGovernanceData'

export default function AdminEscalationsPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [escalations, setEscalations] = useState<AdminEscalationCase[]>(mockAdminEscalations)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedCase, setSelectedCase] = useState<AdminEscalationCase | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedCase) {
        setSelectedCase(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCase])

  // Filter logic
  const filteredEscalations = escalations.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.affectedResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.escalatedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesType && matchesPriority && matchesStatus
  })

  const paginatedEscalations = filteredEscalations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  function handleOpenModal(item: AdminEscalationCase) {
    setSelectedCase(item)
    setDecisionNotes('')
  }

  function handleResolve(actionType: 'Resolved' | 'Rejected') {
    if (!selectedCase) return

    if (!decisionNotes.trim() && actionType === 'Rejected') {
      toast.warning(t('escalations.toast_verdict_required', 'Vui lòng nhập căn cứ để lưu vết kiểm toán hệ thống!'))
      return
    }

    setEscalations((prev) =>
      prev.map((item) =>
        item.id === selectedCase.id
          ? { ...item, status: actionType }
          : item
      )
    )

    if (actionType === 'Resolved') {
      toast.success(t('escalations.toast_resolved', { id: selectedCase.id, defaultValue: `Đã phê chuẩn và thi hành ca ${selectedCase.id} thành công!` }))
    } else {
      toast.warning(t('escalations.toast_rejected', { id: selectedCase.id, defaultValue: `Đã bác bỏ yêu cầu chuyển tiếp ca ${selectedCase.id}.` }))
    }

    setSelectedCase(null)
    setDecisionNotes('')
  }

  const getTypeBadge = (type: AdminEscalationCase['type']) => {
    switch (type) {
      case 'Spatial Override':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            {t('escalations.type_spatial', 'Ghi đè Không gian')}
          </span>
        )
      case 'Catalog Modification':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            {t('escalations.type_catalog', 'Danh mục Biển báo')}
          </span>
        )
      case 'Credit Discrepancy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20">
            {t('escalations.type_credit', 'Bất thường Điểm thưởng')}
          </span>
        )
      case 'Privileged Moderation':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            {t('escalations.type_moderation', 'Chế tài Gian lận')}
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: AdminEscalationCase['priority']) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            {t('escalations.priority_critical', 'Khẩn cấp')}
          </span>
        )
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            {t('escalations.priority_high', 'Cao')}
          </span>
        )
      case 'Medium':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30">
            {t('escalations.priority_medium', 'Trung bình')}
          </span>
        )
    }
  }

  const getStatusBadge = (status: AdminEscalationCase['status']) => {
    switch (status) {
      case 'Pending Admin Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            {t('escalations.status_pending', 'Chờ duyệt')}
          </span>
        )
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            {t('escalations.status_resolved', 'Đã phê chuẩn')}
          </span>
        )
      case 'Rejected':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/15">
            {t('escalations.status_rejected', 'Đã bác bỏ')}
          </span>
        )
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-200">
      {/* Header - Clean, No subtitle or extra tag text as requested */}
      <PageHeader title={t('escalations.title')} />

      {/* Filter and Search Bar */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('escalations.search_placeholder', 'Tìm theo mã ca, đối tượng, nhân sự, từ khóa...')}
      >
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          size="sm"
          options={[
            { value: 'all', label: t('escalations.filter_all_types', 'Tất cả phân loại') },
            { value: 'Spatial Override', label: t('escalations.type_spatial', 'Ghi đè Không gian') },
            { value: 'Catalog Modification', label: t('escalations.type_catalog', 'Danh mục Biển báo') },
            { value: 'Credit Discrepancy', label: t('escalations.type_credit', 'Bất thường Điểm thưởng') },
            { value: 'Privileged Moderation', label: t('escalations.type_moderation', 'Chế tài Gian lận') },
          ]}
        />

        <CustomSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          size="sm"
          options={[
            { value: 'all', label: t('escalations.filter_all_priorities', 'Tất cả mức độ') },
            { value: 'Critical', label: t('escalations.priority_critical', 'Khẩn cấp') },
            { value: 'High', label: t('escalations.priority_high', 'Cao') },
            { value: 'Medium', label: t('escalations.priority_medium', 'Trung bình') },
          ]}
        />

        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          options={[
            { value: 'all', label: t('escalations.filter_all_statuses', 'Tất cả trạng thái') },
            { value: 'Pending Admin Review', label: t('escalations.status_pending', 'Chờ duyệt') },
            { value: 'Resolved', label: t('escalations.status_resolved', 'Đã phê chuẩn') },
            { value: 'Rejected', label: t('escalations.status_rejected', 'Đã bác bỏ') },
          ]}
        />
      </DataFilterBar>

      {/* Escalations Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">{t('escalations.th_case_id')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('escalations.th_type_target')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('escalations.th_staff')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('escalations.th_reason')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('escalations.th_priority')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('escalations.th_status')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('escalations.th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedEscalations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Không tìm thấy ca chuyển tiếp nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedEscalations.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenModal(item)}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {/* Case ID */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] group-hover:underline">
                        {item.id}
                      </span>
                    </td>

                    {/* Type & Affected Resource */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div>{getTypeBadge(item.type)}</div>
                      <span className="font-mono text-gray-700 dark:text-gray-300 font-medium block truncate max-w-[200px]">
                        {item.affectedResource}
                      </span>
                    </td>

                    {/* Escalated By & Time */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 dark:text-white block">
                        {item.escalatedBy}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {item.escalatedAt}
                      </span>
                    </td>

                    {/* Summary & Grounds */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-0.5">
                        {item.summary}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 line-clamp-1 text-[11px]">
                        {item.reason}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(item.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenModal(item)
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                          item.status === 'Pending Admin Review'
                            ? 'bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'
                        }`}
                      >
                        {item.status === 'Pending Admin Review'
                          ? t('escalations.btn_inspect', 'Xử lý')
                          : 'Xem lại'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredEscalations.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* ─── Resolution / Verdict Modal (Minimalist & Easy to Operate) ─── */}
      {selectedCase && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
            onClick={() => setSelectedCase(null)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto space-y-4 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Scales size={18} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {selectedCase.id}
                    </h3>
                    <span className="font-mono text-xs text-gray-400">— {t('escalations.modal_title')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getTypeBadge(selectedCase.type)}
                    {getPriorityBadge(selectedCase.priority)}
                    {getStatusBadge(selectedCase.status)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Case Information Overview */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <span className="text-gray-400 font-mono text-[10px] uppercase block mb-1">
                    {t('escalations.th_staff')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white block truncate">
                    {selectedCase.escalatedBy}
                  </span>
                  <span className="text-gray-400 font-mono text-[10px]">
                    {selectedCase.escalatedAt}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <span className="text-gray-400 font-mono text-[10px] uppercase block mb-1">
                    Đối tượng liên quan
                  </span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white block truncate">
                    {selectedCase.affectedResource}
                  </span>
                </div>
              </div>

              {/* Summary & Grounds */}
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                <div>
                  <span className="text-gray-400 font-mono text-[10px] uppercase block mb-0.5">
                    {t('escalations.lbl_summary')}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {selectedCase.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-white/5">
                  <span className="text-gray-400 font-mono text-[10px] uppercase block mb-0.5">
                    {t('escalations.lbl_staff_reason')}
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedCase.reason}
                  </p>
                </div>
              </div>

              {/* Admin Verdict Input (Only if pending, otherwise view state) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 dark:text-gray-300 block">
                  {t('escalations.lbl_admin_verdict')}
                </label>
                {selectedCase.status === 'Pending Admin Review' ? (
                  <textarea
                    rows={3}
                    required
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder={t('escalations.placeholder_verdict')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] text-xs resize-none"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-300 italic">
                    {selectedCase.status === 'Resolved'
                      ? 'Ca này đã được Quản trị viên phê chuẩn thi hành và ghi nhận Audit Log.'
                      : 'Yêu cầu này đã bị bác bỏ và chuyển trả kết quả cho Staff.'}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 gap-2">
                {selectedCase.status === 'Pending Admin Review' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolve('Rejected')}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/40 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Prohibit size={14} />
                      <span>{t('escalations.btn_reject')}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCase(null)}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors cursor-pointer"
                      >
                        Đóng
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResolve('Resolved')}
                        className="px-5 py-2 bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle size={15} weight="bold" />
                        <span>{t('escalations.btn_approve')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-end w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
