import { useTranslation } from 'react-i18next'
import { RocketLaunch, ArrowsMerge, Prohibit } from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data'

export function CategoryBadge({
  category,
  categoryId,
}: {
  category?: string
  categoryId?: number | null
}) {
  const { t } = useTranslation('ops')

  // Resolve numeric id if category is like "cat_1"
  let id = categoryId
  if (!id && category && category.startsWith('cat_')) {
    const parsed = parseInt(category.replace('cat_', ''), 10)
    if (!Number.isNaN(parsed)) id = parsed
  }

  if (id === 1 || category === 'prohibitory') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
        {t('missing_signs.cat_prohibitory', 'Biển báo cấm')}
      </span>
    )
  }
  if (id === 2 || category === 'warning') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
        {t('missing_signs.cat_warning', 'Biển cảnh báo')}
      </span>
    )
  }
  if (id === 3 || category === 'mandatory') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
        {t('missing_signs.cat_mandatory', 'Biển hiệu lệnh')}
      </span>
    )
  }
  if (id === 4 || category === 'guide' || category === 'information') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
        {t('missing_signs.cat_guide', 'Biển chỉ dẫn')}
      </span>
    )
  }
  if (id === 5 || category === 'supplementary') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">
        {t('missing_signs.cat_supplementary', 'Biển phụ')}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 whitespace-nowrap">
      {category || 'Khác'}
    </span>
  )
}

export function StatusBadge({ status }: { status: MissingSignTypeReport['status'] }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t('missing_signs.status_open', 'Chờ sơ thẩm')}
        </span>
      )
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap shadow-2xs">
          <RocketLaunch size={12} weight="bold" />
          {t('missing_signs.status_approved', 'Đã phê duyệt')}
        </span>
      )
    case 'Merged':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap shadow-2xs">
          <ArrowsMerge size={12} weight="bold" />
          {t('missing_signs.status_merged', 'Đã gộp Catalog')}
        </span>
      )
    case 'Escalated':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap shadow-2xs">
          <RocketLaunch size={12} weight="bold" />
          {t('missing_signs.status_escalated', 'Chờ Admin duyệt')}
        </span>
      )
    case 'Incomplete':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          {t('missing_signs.status_incomplete', 'Cần bổ sung')}
        </span>
      )
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap shadow-2xs">
          <Prohibit size={12} />
          {t('missing_signs.status_rejected', 'Đã từ chối')}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {status}
        </span>
      )
  }
}
