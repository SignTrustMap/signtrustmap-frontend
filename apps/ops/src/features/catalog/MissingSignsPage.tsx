import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Question,
  CheckCircle,
  X,
} from '@phosphor-icons/react'
import { mockMissingSignTypeReports, type MissingSignTypeReport } from '@/data/catalogData'

export default function MissingSignsPage() {
  const { t } = useTranslation('ops')

  const [reports, setReports] = useState<MissingSignTypeReport[]>(mockMissingSignTypeReports)
  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2000)
  }

  function handleAction(reportId: string, actionName: string) {
    showToast(t('missing_signs.toast_processed', { id: reportId, action: actionName }))
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: actionName === 'Approve' ? 'Approved' : 'Merged' } : r
      )
    )
    setSelectedReport(null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
          <Question size={16} weight="bold" />
          <span>{t('missing_signs.tag')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('missing_signs.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('missing_signs.subtitle')}
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

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#007b8b] dark:text-[#00c4de]">
                    {report.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    report.status === 'Open'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-emerald-500/15 text-emerald-600'
                  }`}>
                    {report.status === 'Open'
                      ? t('missing_signs.status_open')
                      : t('missing_signs.status_approved')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {report.tempLabel}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {report.reporterNote}
                </p>
              </div>

              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-white/10">
                <span className="text-xs font-mono font-bold">CROP</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono">{t('missing_signs.lbl_location')}</span>
                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                  {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono">{t('missing_signs.lbl_reported_by')}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{report.reportedBy}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedReport(report)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                {t('missing_signs.btn_view_details')}
              </button>
              <button
                type="button"
                onClick={() => handleAction(report.id, 'Approve')}
                className="py-2 px-4 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {t('missing_signs.btn_approve')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('missing_signs.modal_title')}
              </h3>
              <button type="button" onClick={() => setSelectedReport(null)} className="text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>{t('missing_signs.lbl_sign_title')}</strong> {selectedReport.tempLabel}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>{t('missing_signs.lbl_description')}</strong> {selectedReport.reporterNote}
              </p>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-2">
                <span className="font-mono font-bold text-purple-600 block">
                  {t('missing_signs.lbl_admin_actions')}
                </span>
                <p className="text-gray-500">
                  {t('missing_signs.lbl_admin_desc')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'Merge')}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl font-bold cursor-pointer"
              >
                {t('missing_signs.btn_merge')}
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'Approve')}
                className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold cursor-pointer"
              >
                {t('missing_signs.btn_approve_catalog')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
