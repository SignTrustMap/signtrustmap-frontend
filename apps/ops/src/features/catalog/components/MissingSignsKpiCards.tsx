import { useTranslation } from 'react-i18next'
import { Lightbulb, Clock, RocketLaunch, ArrowsMerge } from '@phosphor-icons/react'

export interface MissingSignsKpiStats {
  total: number
  pending: number
  escalated: number
  merged: number
}

interface MissingSignsKpiCardsProps {
  stats: MissingSignsKpiStats
}

export function MissingSignsKpiCards({ stats }: MissingSignsKpiCardsProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Proposals */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
            {t('missing_signs.kpi_total_proposals')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
            <Lightbulb size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
            {stats.total}
          </span>
          <span className="text-xs text-gray-400 font-sans">{t('missing_signs.unit_proposals')}</span>
        </div>
      </div>

      {/* KPI 2: Pending Staff Review */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
            {t('missing_signs.kpi_pending_review')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
            {stats.pending}
          </span>
          <span className="text-xs text-amber-500/80 font-sans">{t('missing_signs.unit_pending')}</span>
        </div>
      </div>

      {/* KPI 3: Escalated to Admin */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00c4de] uppercase">
            {t('missing_signs.kpi_escalated_admin')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-[#00c4de]">
            <RocketLaunch size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-cyan-800 dark:text-[#00c4de]">
            {stats.escalated}
          </span>
          <span className="text-xs text-cyan-600 dark:text-cyan-400 font-sans">
            {t('missing_signs.unit_escalated')}
          </span>
        </div>
      </div>

      {/* KPI 4: Merged into Catalog */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
            {t('missing_signs.kpi_merged_catalog')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ArrowsMerge size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
            {stats.merged}
          </span>
          <span className="text-xs text-purple-500/80 font-sans">{t('missing_signs.unit_merged')}</span>
        </div>
      </div>
    </div>
  )
}
export default MissingSignsKpiCards
