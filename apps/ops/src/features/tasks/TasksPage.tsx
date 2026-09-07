import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Clock,
  CheckCircle,
  MagnifyingGlass,
  ArrowsClockwise,
  Eye,
  X,
  Sparkle,
} from '@phosphor-icons/react'
import { mockRevalidationTasks, type RevalidationTask } from '@/data'

export default function TasksPage() {
  const { t } = useTranslation('ops')

  const [tasks, setTasks] = useState<RevalidationTask[]>(mockRevalidationTasks)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<RevalidationTask | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleRevalidationDecision(taskId: string, decision: 'unchanged' | 'changed' | 'retired' | 'invalid') {
    if (decision === 'unchanged') {
      showToast(t('tasks.toast_confirmed', { taskId, reward: selectedTask?.rewardCredits || 50 }))
    } else if (decision === 'changed') {
      showToast(t('tasks.toast_updated', { taskId }))
    } else if (decision === 'retired') {
      showToast(t('tasks.toast_retired', { taskId }))
    } else if (decision === 'invalid') {
      showToast(t('tasks.toast_invalid', { taskId }))
    }

    setTasks((prev) =>
      prev.map((tItem) =>
        tItem.id === taskId
          ? {
              ...tItem,
              freshnessStatus: decision === 'unchanged' ? 'Stale' : tItem.freshnessStatus,
              lastVerifiedDate: t('tasks.just_now'),
            }
          : tItem
      )
    )
    setSelectedTask(null)
  }

  const filteredTasks = tasks.filter((tItem) => {
    const matchesSearch =
      tItem.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tItem.signName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tItem.location.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'critical') return matchesSearch && tItem.freshnessStatus === 'Critical'
    if (activeTab === 'pending') return matchesSearch && tItem.submittedEvidenceCount > 0
    return matchesSearch
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <ArrowsClockwise size={16} weight="bold" />
            <span>{t('tasks.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('tasks.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('tasks.subtitle')}
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#061115] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tasks.tab_all')} ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'critical'
                ? 'bg-white dark:bg-[#061115] text-red-600 dark:text-red-400 shadow-xs font-bold'
                : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            {t('tasks.tab_critical')} ({tasks.filter((tItem) => tItem.freshnessStatus === 'Critical').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs font-bold'
                : 'text-gray-500 hover:text-[#007b8b] dark:hover:text-[#00c4de]'
            }`}
          >
            {t('tasks.tab_pending')} ({tasks.filter((tItem) => tItem.submittedEvidenceCount > 0).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tasks.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00c4de]"
          />
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-6 font-semibold">{t('tasks.th_id')}</th>
                <th className="py-3 px-6 font-semibold">{t('tasks.th_sign')}</th>
                <th className="py-3 px-6 font-semibold">{t('tasks.th_location')}</th>
                <th className="py-3 px-6 font-semibold">{t('tasks.th_freshness')}</th>
                <th className="py-3 px-6 font-semibold text-center">{t('tasks.th_reward')}</th>
                <th className="py-3 px-6 font-semibold text-center">{t('tasks.th_evidence')}</th>
                <th className="py-3 px-6 font-semibold text-right">{t('tasks.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-900 dark:text-white">
                    {task.id}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-900 dark:text-white">{task.signCode}</span> - {task.signName}
                  </td>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                      <span>{task.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock size={15} className={task.freshnessStatus === 'Critical' ? 'text-red-500' : 'text-amber-500'} weight="bold" />
                      <span className={`font-mono font-medium ${task.freshnessStatus === 'Critical' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                        {task.lastVerifiedDate} {task.freshnessStatus === 'Critical' ? t('tasks.critical_badge') : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    +{task.rewardCredits}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      task.submittedEvidenceCount > 0
                        ? 'bg-[#dbeafe] text-[#1d4ed8] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30 font-bold'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                    }`}>
                      {t('tasks.evidence_files', { count: task.submittedEvidenceCount })}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="px-3.5 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer text-xs inline-flex items-center gap-1"
                    >
                      <Eye size={14} weight="bold" />
                      <span>{t('tasks.btn_inspect_comparative')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: SO SÁNH BẰNG CHỨNG TÁI KIỂM ĐỊNH (BEFORE / AFTER) ─── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <ArrowsClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{t('tasks.modal_title')} (#{selectedTask.id})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('tasks.modal_subtitle')}
                </p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Before vs After Side-by-Side Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: Previous Verified Record */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400">{t('tasks.lbl_original_record')}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600">{t('tasks.status_stale')}</span>
                </div>

                <div className="aspect-video bg-gray-200 dark:bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
                    alt="Original Sign Crop"
                    className="max-h-full object-contain p-2"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono">
                    {t('tasks.orig_date_label')}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedTask.signCode} - {selectedTask.signName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                    {t('tasks.lbl_location_prefix')} {selectedTask.location}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                    {t('tasks.lbl_last_verified_prefix')} {selectedTask.lastVerifiedDate}
                  </p>
                </div>
              </div>

              {/* Right: Newly Submitted Community Evidence */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">{t('tasks.lbl_new_evidence')}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 flex items-center gap-1">
                    <Sparkle size={12} /> {t('tasks.status_pending_review')}
                  </span>
                </div>

                <div className="aspect-video bg-gray-200 dark:bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80"
                    alt="New Evidence Crop"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono">
                    {t('tasks.new_date_label')}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>{t('tasks.lbl_sender_prefix')}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">GPS offset: 1.8m</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                    {t('tasks.lbl_field_notes')}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                    {t('tasks.lbl_reward_prefix')} +{selectedTask.rewardCredits} Credits
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Buttons according to Flow 8 */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleRevalidationDecision(selectedTask.id, 'invalid')}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('tasks.btn_reject_evidence')}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'retired')}
                  className="px-3.5 py-2 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {t('tasks.btn_retire_sign')}
                </button>
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'changed')}
                  className="px-3.5 py-2 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {t('tasks.btn_change_sign')}
                </button>
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'unchanged')}
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {t('tasks.btn_confirm_unchanged')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
