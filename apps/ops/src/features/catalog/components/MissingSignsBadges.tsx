import { useTranslation } from 'react-i18next'
import { RocketLaunch, ArrowsMerge, Prohibit } from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data'

export function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation('ops')
  switch (category) {
    case 'prohibitory':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          {t('missing_signs.cat_prohibitory')}
        </span>
      )
    case 'warning':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('missing_signs.cat_warning')}
        </span>
      )
    case 'mandatory':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
          {t('missing_signs.cat_mandatory')}
        </span>
      )
    case 'guide':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('missing_signs.cat_guide')}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 whitespace-nowrap">
          {category}
        </span>
      )
  }
}

export function StatusBadge({ status }: { status: MissingSignTypeReport['status'] }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t('missing_signs.status_open')}
        </span>
      )
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          <RocketLaunch size={12} weight="bold" />
          {t('missing_signs.status_approved')}
        </span>
      )
    case 'Merged':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">
          <ArrowsMerge size={12} weight="bold" />
          {t('missing_signs.status_merged')}
        </span>
      )
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          <Prohibit size={12} />
          {t('missing_signs.status_rejected')}
        </span>
      )
  }
}
