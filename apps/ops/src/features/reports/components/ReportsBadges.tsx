import { useTranslation } from 'react-i18next'
import type { IssueType, ReportPriority, ReportStatus } from '@/data'

export function IssueTypeBadge({ type }: { type: IssueType }) {
  const { t } = useTranslation('ops')
  switch (type) {
    case 'damaged':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('reports.type_damaged')}
        </span>
      )
    case 'obscured':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">
          {t('reports.type_obscured')}
        </span>
      )
    case 'missing':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 whitespace-nowrap">
          {t('reports.type_missing')}
        </span>
      )
    case 'incorrect':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          {t('reports.type_incorrect')}
        </span>
      )
  }
}

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const { t } = useTranslation('ops')
  switch (priority) {
    case 'Cao':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {t('reports.priority_high')}
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('reports.priority_med')}
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 whitespace-nowrap">
          {t('reports.priority_low')}
        </span>
      )
  }
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          {t('reports.tab_pending')}
        </span>
      )
    case 'Investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          {t('reports.tab_investigating')}
        </span>
      )
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('reports.tab_resolved')}
        </span>
      )
  }
}
