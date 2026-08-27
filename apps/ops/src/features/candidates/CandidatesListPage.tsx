import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Eye,
} from '@phosphor-icons/react'
import { mockCandidates, type CandidateItem, type PriorityLevel, type CandidateStatus } from '@/data'

function PriorityTag({ priority }: { priority: PriorityLevel }) {
  const { t } = useTranslation('ops')
  switch (priority) {
    case 'Cao':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          {t('candidates.priority_high')}
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
          {t('candidates.priority_med')}
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          {t('candidates.priority_low')}
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Đang xem xét':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30">
          {t('candidates.status_reviewing')}
        </span>
      )
    case 'Chưa xử lý':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          {t('candidates.status_pending')}
        </span>
      )
    case 'Đã giải quyết':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          {t('candidates.status_resolved')}
        </span>
      )
  }
}

export default function CandidatesListPage() {
  const { t } = useTranslation('ops')
  const [candidates] = useState<CandidateItem[]>(mockCandidates)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesPriority = true
    if (priorityFilter === 'Cao') matchesPriority = c.priority === 'Cao'
    if (priorityFilter === 'Vừa') matchesPriority = c.priority === 'Vừa'
    if (priorityFilter === 'Thấp') matchesPriority = c.priority === 'Thấp'

    let matchesStatus = true
    if (statusFilter === 'Chưa xử lý') matchesStatus = c.status === 'Chưa xử lý'
    if (statusFilter === 'Đang xem xét') matchesStatus = c.status === 'Đang xem xét'
    if (statusFilter === 'Đã giải quyết') matchesStatus = c.status === 'Đã giải quyết'

    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('candidates.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('candidates.subtitle')}
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              {t('candidates.search_label')}
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('candidates.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              {t('candidates.priority_label')}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
            >
              <option value="all">{t('candidates.priority_all')}</option>
              <option value="Cao">{t('candidates.priority_high')}</option>
              <option value="Vừa">{t('candidates.priority_med')}</option>
              <option value="Thấp">{t('candidates.priority_low')}</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              {t('candidates.status_label')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
            >
              <option value="all">{t('candidates.status_all')}</option>
              <option value="Chưa xử lý">{t('candidates.status_pending')}</option>
              <option value="Đang xem xét">{t('candidates.status_reviewing')}</option>
              <option value="Đã giải quyết">{t('candidates.status_resolved')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">{t('candidates.th_id')}</th>
                <th className="py-4 px-6">{t('candidates.th_target')}</th>
                <th className="py-4 px-6">{t('candidates.th_date')}</th>
                <th className="py-4 px-6">{t('candidates.th_reason')}</th>
                <th className="py-4 px-6 text-center">{t('candidates.th_priority')}</th>
                <th className="py-4 px-6 text-center">{t('candidates.th_status')}</th>
                <th className="py-4 px-6 text-right">{t('candidates.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    {c.id}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 font-mono">{c.reportedDate}</td>
                  <td className="py-4 px-6 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">{c.reason}</td>
                  <td className="py-4 px-6 text-center">
                    <PriorityTag priority={c.priority} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/candidates/${c.id.replace('#', '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/25 dark:border-[#00c4de]/30 text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>{t('candidates.btn_review')}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('candidates.showing_results', { count: filteredCandidates.length, total: candidates.length })}
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              <CaretLeft size={14} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#007b8b] text-white font-bold text-xs">
              1
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
