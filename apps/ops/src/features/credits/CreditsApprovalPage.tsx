import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  MagnifyingGlass,
  ShieldWarning,
} from '@phosphor-icons/react'
import { mockCreditApprovals, type CreditApprovalItem } from '@/data'

export default function CreditsApprovalPage() {
  const { t } = useTranslation('ops')
  const [items, setItems] = useState<CreditApprovalItem[]>(mockCreditApprovals)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function handleDecision(id: string, decision: 'Approved' | 'Rejected') {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    )
    setToast(
      decision === 'Approved'
        ? t('credits.toast_approved', { id })
        : t('credits.toast_rejected', { id })
    )
    setTimeout(() => setToast(null), 3000)
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de] shadow-xs"
          />
        </div>
      </div>

      {toast && (
        <div
          onClick={() => setToast(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toast}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">{t('credits.th_id')}</th>
                <th className="py-4 px-6">{t('credits.th_user')}</th>
                <th className="py-4 px-6">{t('credits.th_activity')}</th>
                <th className="py-4 px-6 text-center">{t('credits.th_amount')}</th>
                <th className="py-4 px-6 text-center">{t('credits.th_risk')}</th>
                <th className="py-4 px-6">{t('credits.th_evidence')}</th>
                <th className="py-4 px-6 text-right">{t('credits.th_decision')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    {item.id}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${item.user.avatarBg}`}
                      >
                        {item.user.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-xs">{item.user.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{item.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {item.activityType}
                  </td>
                  <td className="py-4 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{item.amount}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.riskLevel === 'Thấp' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dcfce7] text-[#15803d] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                        {t('credits.risk_safe')}
                      </span>
                    )}
                    {item.riskLevel === 'Cảnh báo gian lận' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
                        <ShieldWarning size={13} weight="bold" />
                        {t('credits.risk_fraud')}
                      </span>
                    )}
                    {item.riskLevel === 'Nghi vấn' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
                        {t('credits.risk_suspect')}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600 dark:text-gray-300 max-w-xs">
                    <p className="truncate">{item.evidenceSummary}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.createdAt}</p>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    {item.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
                        >
                          {t('credits.btn_approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'Rejected')}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-red-700 dark:text-red-400 border border-transparent dark:border-red-500/30 font-semibold rounded-lg transition-all active:scale-95 cursor-pointer text-xs"
                        >
                          {t('credits.btn_reject')}
                        </button>
                      </>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border dark:border-emerald-500/30'
                          : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border dark:border-red-500/30'
                      }`}>
                        {item.status === 'Approved' ? t('credits.tag_approved') : t('credits.tag_rejected')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
