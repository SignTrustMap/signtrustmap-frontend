import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import {
  MagnifyingGlass,
  ShieldWarning,
  Eye,
  X,
  FileText,
} from '@phosphor-icons/react'
import { mockCreditApprovals, type CreditApprovalItem } from '@/data'

const roleBadgeStyles: Record<string, string> = {
  surveyor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
  reviewer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  contributor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  driver: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
}

export default function CreditsApprovalPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()
  const [items, setItems] = useState<CreditApprovalItem[]>(mockCreditApprovals)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<CreditApprovalItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  function handleDecision(id: string, decision: 'Approved' | 'Rejected') {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    )
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, status: decision } : null))
    }
    if (decision === 'Approved') {
      toast.success(t('credits.toast_approved', { id }))
    } else {
      toast.warning(t('credits.toast_rejected', { id }))
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('credits.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('credits.subtitle')}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('credits.search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de] shadow-xs"
          />
        </div>
      </div>


      {/* Table Container */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-3.5 px-4">{t('credits.th_id')}</th>
                <th className="py-3.5 px-4">{t('credits.th_user')}</th>
                <th className="py-3.5 px-4">{t('credits.th_activity')}</th>
                <th className="py-3.5 px-4 text-center">{t('credits.th_amount')}</th>
                <th className="py-3.5 px-4 text-center">{t('credits.th_risk')}</th>
                <th className="py-3.5 px-4 text-center">{t('credits.th_status')}</th>
                <th className="py-3.5 px-4 text-right">{t('credits.th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-[#F8F7F7]/60 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    <span className="group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors">
                      {item.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${item.user.avatarBg}`}
                      >
                        {item.user.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{item.user.name}</p>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              roleBadgeStyles[item.user.role] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/15'
                            }`}
                          >
                            {t(`credits.role_${item.user.role}`)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate">{item.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {t(`credits.activity_${item.activityKey}`)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{item.amount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.riskLevel === 'Thấp' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                        {t('credits.risk_safe')}
                      </span>
                    )}
                    {item.riskLevel === 'Cảnh báo gian lận' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
                        <ShieldWarning size={12} weight="bold" />
                        {t('credits.risk_fraud')}
                      </span>
                    )}
                    {item.riskLevel === 'Nghi vấn' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
                        {t('credits.risk_suspect')}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border dark:border-emerald-500/30'
                          : item.status === 'Rejected'
                          ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border dark:border-red-500/30'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border dark:border-amber-500/30'
                      }`}
                    >
                      {item.status === 'Approved'
                        ? t('credits.tag_approved')
                        : item.status === 'Rejected'
                        ? t('credits.tag_rejected')
                        : t('credits.status_pending')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItem(item)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/20 dark:border-[#00c4de]/30 text-[#007b8b] dark:text-[#00c4de] text-xs font-bold hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye size={14} weight="bold" />
                      <span>{t('credits.btn_inspect')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Container matching apps/web and RULE.md 2.4 */}
        <div className="px-6 pb-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
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

      {/* ─── Detail & Decision Inspection Modal ─────────────────── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de]">
                    {selectedItem.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedItem.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : selectedItem.status === 'Rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                  >
                    {selectedItem.status === 'Approved'
                      ? t('credits.tag_approved')
                      : selectedItem.status === 'Rejected'
                      ? t('credits.tag_rejected')
                      : t('credits.status_pending')}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {t('credits.modal_title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('credits.modal_subtitle')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Contributor Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${selectedItem.user.avatarBg}`}
                >
                  {selectedItem.user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                      {selectedItem.user.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        roleBadgeStyles[selectedItem.user.role] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/15'
                      }`}
                    >
                      {t(`credits.role_${selectedItem.user.role}`)}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-mono text-[11px] truncate">
                    {selectedItem.user.email}
                  </p>
                </div>
              </div>

              {/* Grid 2x2 Telemetry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">
                    {t('credits.lbl_activity')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">
                    {t(`credits.activity_${selectedItem.activityKey}`)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">
                    {t('credits.lbl_amount')}
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    +{selectedItem.amount} Credits
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">
                    {t('credits.lbl_risk')}
                  </span>
                  <div>
                    {selectedItem.riskLevel === 'Thấp' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        {t('credits.risk_safe')}
                      </span>
                    )}
                    {selectedItem.riskLevel === 'Cảnh báo gian lận' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        <ShieldWarning size={12} weight="bold" />
                        {t('credits.risk_fraud')}
                      </span>
                    )}
                    {selectedItem.riskLevel === 'Nghi vấn' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                        {t('credits.risk_suspect')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">
                    {t('credits.lbl_time')}
                  </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                    {selectedItem.createdAt}
                  </span>
                </div>
              </div>

              {/* Fraud Warning Callout */}
              {selectedItem.riskLevel === 'Cảnh báo gian lận' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-400">
                  <ShieldWarning size={16} className="shrink-0 mt-0.5" weight="fill" />
                  <p className="text-[11px] leading-relaxed">
                    {t('credits.risk_fraud_desc')}
                  </p>
                </div>
              )}

              {/* Evidence Section */}
              <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-mono text-[10px] uppercase font-bold">
                  <FileText size={14} />
                  <span>{t('credits.lbl_evidence')}</span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-xs bg-white dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                  {selectedItem.evidenceSummary}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t('credits.btn_close')}
              </button>

              {selectedItem.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedItem.id, 'Rejected')}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-xs"
                  >
                    {t('credits.btn_reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedItem.id, 'Approved')}
                    className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
                  >
                    {t('credits.btn_approve')}
                  </button>
                </div>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedItem.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border dark:border-emerald-500/30'
                      : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border dark:border-red-500/30'
                  }`}
                >
                  {selectedItem.status === 'Approved'
                    ? t('credits.tag_approved')
                    : t('credits.tag_rejected')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

