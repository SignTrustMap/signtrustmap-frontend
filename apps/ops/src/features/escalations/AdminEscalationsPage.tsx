import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldWarning,
  CheckCircle,
  X,
} from '@phosphor-icons/react'
import { mockAdminEscalations, type AdminEscalationCase } from '@/data/adminGovernanceData'

export default function AdminEscalationsPage() {
  const { t } = useTranslation('ops')

  const [escalations, setEscalations] = useState<AdminEscalationCase[]>(mockAdminEscalations)
  const [selectedCase, setSelectedCase] = useState<AdminEscalationCase | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleResolve(actionType: 'Resolved' | 'Rejected') {
    if (!selectedCase) return
    setEscalations((prev) =>
      prev.map((item) =>
        item.id === selectedCase.id
          ? { ...item, status: actionType }
          : item
      )
    )
    showToast(t('escalations.toast_resolved', { id: selectedCase.id, status: actionType }))
    setSelectedCase(null)
    setDecisionNotes('')
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
          <ShieldWarning size={16} weight="bold" />
          <span>{t('escalations.tag')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('escalations.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('escalations.subtitle')}
        </p>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Escalations Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('escalations.th_case_id')}</th>
                <th className="py-3 px-4 font-semibold">{t('escalations.th_type_target')}</th>
                <th className="py-3 px-4 font-semibold">{t('escalations.th_staff')}</th>
                <th className="py-3 px-4 font-semibold">{t('escalations.th_reason')}</th>
                <th className="py-3 px-4 font-semibold">{t('escalations.th_priority')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('escalations.th_status')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('escalations.th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {escalations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{item.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold block">{item.affectedResource}</span>
                    <span className="text-gray-400 font-mono text-[10px]">{item.escalatedAt}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-700 dark:text-gray-300">{item.escalatedBy}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-sm">
                    <p className="line-clamp-2">{item.summary}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.priority === 'Critical' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'
                    }`}>
                      {item.priority === 'Critical' ? t('escalations.priority_critical') : t('escalations.priority_high')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.status === 'Pending Admin Review'
                        ? 'bg-amber-500/15 text-amber-600'
                        : item.status === 'Resolved'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-gray-500/15 text-gray-600'
                    }`}>
                      {item.status === 'Pending Admin Review' ? t('escalations.status_pending') : item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCase(item)}
                      className="px-3 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      {t('escalations.btn_inspect')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('escalations.modal_title')}
              </h3>
              <button type="button" onClick={() => setSelectedCase(null)} className="text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                <p className="text-gray-400 font-mono text-[10px] uppercase">{t('escalations.lbl_staff_reason')}</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedCase.reason}</p>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-gray-500 uppercase">{t('escalations.lbl_admin_verdict')}</label>
                <textarea
                  rows={3}
                  placeholder={t('escalations.placeholder_verdict')}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleResolve('Rejected')}
                className="px-4 py-2 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl font-bold cursor-pointer"
              >
                {t('escalations.btn_reject')}
              </button>
              <button
                type="button"
                onClick={() => handleResolve('Resolved')}
                className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold cursor-pointer"
              >
                {t('escalations.btn_approve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
