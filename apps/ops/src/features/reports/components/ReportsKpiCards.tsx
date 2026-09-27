import { useTranslation } from 'react-i18next'
import {
  Megaphone,
  Clock,
  MagnifyingGlass,
  CheckCircle,
} from '@phosphor-icons/react'

export interface ReportsKpiStats {
  total: number
  pending: number
  investigating: number
  resolved: number
}

interface ReportsKpiCardsProps {
  kpiStats: ReportsKpiStats
}

export function ReportsKpiCards({ kpiStats }: ReportsKpiCardsProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Incidents */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
            {t('reports.kpi_total_reports')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
            <Megaphone size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
            {kpiStats.total}
          </span>
          <span className="text-xs text-gray-400 font-sans">{t('reports.unit_reports')}</span>
        </div>
      </div>

      {/* KPI 2: Pending Intake */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
            {t('reports.kpi_pending_reports')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Clock size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
            {kpiStats.pending}
          </span>
          <span className="text-xs text-red-500/80 font-sans">{t('reports.unit_urgent')}</span>
        </div>
      </div>

      {/* KPI 3: Investigating */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00c4de] uppercase">
            {t('reports.kpi_investigating_reports')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-[#00c4de]">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-cyan-800 dark:text-[#00c4de]">
            {kpiStats.investigating}
          </span>
          <span className="text-xs text-cyan-600 dark:text-cyan-400 font-sans">{t('reports.unit_in_progress')}</span>
        </div>
      </div>

      {/* KPI 4: Resolved */}
      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            {t('reports.kpi_resolved_reports')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {kpiStats.resolved}
          </span>
          <span className="text-xs text-gray-400 font-sans">{t('reports.unit_closed')}</span>
        </div>
      </div>
    </div>
  )
}
