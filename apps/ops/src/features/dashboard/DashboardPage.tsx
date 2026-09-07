import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import {
  Users,
  WarningCircle,
  FolderSimple,
  ArrowUpRight,
  DotsThreeVertical,
  DownloadSimple,
  CalendarBlank,
  ShieldCheck,
  HardDrives,
  CheckSquare,
  Flag,
  Funnel,
} from '@phosphor-icons/react'
import {
  adminKpisData,
  staffKpisData,
  adminActivitiesData,
  staffActivitiesData,
} from '@/data'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation('ops')
  const isAdmin = user?.role === 'admin'

  const [timeRange, setTimeRange] = useState('30 ngày qua')
  const [feedFilter, setFeedFilter] = useState('all')

  // Icons map for KPIs
  const adminIcons = [
    <Users size={22} weight="bold" />,
    <ShieldCheck size={22} weight="bold" />,
    <HardDrives size={22} weight="bold" />,
    <WarningCircle size={22} weight="bold" />,
  ]

  const staffIcons = [
    <FolderSimple size={22} weight="bold" />,
    <Flag size={22} weight="bold" />,
    <CheckSquare size={22} weight="bold" />,
    <Users size={22} weight="bold" />,
  ]

  const baseKpis = isAdmin ? adminKpisData : staffKpisData
  const currentIcons = isAdmin ? adminIcons : staffIcons
  const rawActivities = isAdmin ? adminActivitiesData : staffActivitiesData

  // Localized KPIs
  const currentKpis = baseKpis.map((kpi, idx) => {
    let label = kpi.label
    let changeText = kpi.changeText

    if (isAdmin) {
      if (idx === 0) {
        label = t('dashboard.kpi_admin_users_label')
        changeText = t('dashboard.kpi_admin_users_sub')
      } else if (idx === 1) {
        label = t('dashboard.kpi_admin_staff_label')
        changeText = t('dashboard.kpi_admin_staff_sub')
      } else if (idx === 2) {
        label = t('dashboard.kpi_admin_audit_label')
        changeText = t('dashboard.kpi_admin_audit_sub')
      } else if (idx === 3) {
        label = t('dashboard.kpi_admin_security_label')
        changeText = t('dashboard.kpi_admin_security_sub')
      }
    } else {
      if (idx === 0) {
        label = t('dashboard.kpi_staff_candidates_label')
        changeText = t('dashboard.kpi_staff_candidates_sub')
      } else if (idx === 1) {
        label = t('dashboard.kpi_staff_reports_label')
        changeText = t('dashboard.kpi_staff_reports_sub')
      } else if (idx === 2) {
        label = t('dashboard.kpi_staff_tasks_label')
        changeText = t('dashboard.kpi_staff_tasks_sub')
      } else if (idx === 3) {
        label = t('dashboard.kpi_staff_credits_label')
        changeText = t('dashboard.kpi_staff_credits_sub')
      }
    }

    return {
      ...kpi,
      label,
      changeText,
    }
  })

  // Localized Activities
  const recentActivities = rawActivities.map((act) => {
    const prefix = isAdmin ? 'act_admin_' : 'act_staff_'
    const titleKey = `dashboard.${prefix}${act.id}_title`
    const descKey = `dashboard.${prefix}${act.id}_desc`

    return {
      ...act,
      title: t(titleKey, { defaultValue: act.title }),
      desc: t(descKey, { defaultValue: act.desc }),
    }
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isAdmin ? t('dashboard.admin_title') : t('dashboard.staff_title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin
              ? t('dashboard.admin_subtitle')
              : t('dashboard.staff_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Time Range Custom Dropdown */}
          <CustomSelect
            value={timeRange}
            onChange={setTimeRange}
            leftIcon={<CalendarBlank size={16} />}
            options={[
              { value: '7 ngày qua', label: t('dashboard.time_range_7') },
              { value: '30 ngày qua', label: t('dashboard.time_range_30') },
              { value: '90 ngày qua', label: t('dashboard.time_range_90') },
            ]}
          />

          {/* Export Button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} />
            <span>{t('dashboard.export_report')}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currentKpis.map((kpi, idx) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-5 shadow-sm flex flex-col justify-between hover:border-[#00c4de]/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 font-mono tracking-tight">
                  {kpi.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${kpi.iconBg}`}
              >
                {currentIcons[idx]}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
              {kpi.isPositive && (
                <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border dark:border-emerald-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                  <ArrowUpRight size={13} weight="bold" />
                  {kpi.change}
                </span>
              )}
              {kpi.isWarning && (
                <span className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border dark:border-red-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                  <ArrowUpRight size={13} weight="bold" />
                  {kpi.change}
                </span>
              )}
              {kpi.isNeutral && (
                <span className="text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 border dark:border-white/10 px-2 py-0.5 rounded font-bold">
                  {kpi.change}
                </span>
              )}
              <span className="text-gray-400 font-normal">{kpi.changeText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Growth / Workflow Pipeline Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isAdmin ? t('dashboard.chart_traffic_title') : t('dashboard.chart_pipeline_title')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin ? t('dashboard.chart_traffic_subtitle') : t('dashboard.chart_pipeline_subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-5 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16">
                  <circle
                    cx="8"
                    cy="8"
                    r="5.5"
                    fill="none"
                    className="stroke-[#007b8b] dark:stroke-[#00c4de]"
                    strokeWidth="2.5"
                  />
                </svg>
                <span>{isAdmin ? t('dashboard.legend_new_reg') : t('dashboard.legend_intake')}</span>
              </span>

              <span className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16">
                  <circle
                    cx="8"
                    cy="8"
                    r="5.5"
                    fill="none"
                    className="stroke-slate-500 dark:stroke-slate-300"
                    strokeWidth="2"
                    strokeDasharray="2.5 2"
                  />
                </svg>
                <span>{isAdmin ? t('dashboard.legend_active') : t('dashboard.legend_resolved')}</span>
              </span>

              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer">
                <DotsThreeVertical size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* SVG Area & Line Chart */}
          <div className="w-full h-64 relative pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 220"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00c4de" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00c4de" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="690"
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-white/10"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Y Axis Labels */}
              <text x="5" y="10" className="fill-gray-400 text-[10px] font-mono">3,000</text>
              <text x="5" y="60" className="fill-gray-400 text-[10px] font-mono">2,000</text>
              <text x="5" y="110" className="fill-gray-400 text-[10px] font-mono">1,500</text>
              <text x="5" y="160" className="fill-gray-400 text-[10px] font-mono">500</text>
              <text x="25" y="205" className="fill-gray-400 text-[10px] font-mono">0</text>

              {/* Area Under Curve 1 */}
              <path
                d="M 50 145 C 130 110, 180 125, 210 120 C 270 110, 320 150, 360 145 C 420 140, 480 90, 520 85 C 580 80, 630 40, 670 45 L 670 200 L 50 200 Z"
                fill="url(#growthGradient)"
              />

              {/* Line 1 (Solid Cyan/Teal) */}
              <path
                d="M 50 145 C 130 110, 180 125, 210 120 C 270 110, 320 150, 360 145 C 420 140, 480 90, 520 85 C 580 80, 630 40, 670 45"
                fill="none"
                stroke="#00c4de"
                strokeWidth="3"
              />

              {/* Points on Line 1 */}
              {[[50, 145], [210, 120], [360, 145], [520, 85], [670, 45]].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#007b8b"
                  strokeWidth="2.5"
                />
              ))}

              {/* Line 2 (Dashed Slate) */}
              <path
                d="M 50 170 C 130 160, 180 150, 210 150 C 270 150, 320 165, 360 160 C 420 155, 480 135, 520 130 C 580 125, 630 105, 670 100"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="5 5"
              />

              {/* Points on Line 2 */}
              {[[50, 170], [210, 150], [360, 160], [520, 130], [670, 100]].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between pl-10 pr-2 pt-2 text-[11px] font-mono text-gray-400">
              <span>{t('dashboard.week_1')}</span>
              <span>{t('dashboard.week_2')}</span>
              <span>{t('dashboard.week_3')}</span>
              <span>{t('dashboard.week_4')}</span>
              <span>{t('dashboard.week_5')}</span>
            </div>
          </div>
        </div>

        {/* Right: Category Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isAdmin ? t('dashboard.chart_donut_admin_title') : t('dashboard.chart_donut_staff_title')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin ? t('dashboard.chart_donut_admin_subtitle') : t('dashboard.chart_donut_staff_subtitle')}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1">
              <DotsThreeVertical size={18} weight="bold" />
            </button>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center my-4">
            <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
              {/* Background Track Ring */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="currentColor"
                className="text-gray-100 dark:text-white/10"
                strokeWidth="22"
                fill="transparent"
              />
              {/* Ring 1 - Cyan */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#00c4de"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="264"
                strokeLinecap="round"
              />
              {/* Ring 2 - Red */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#ef4444"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="316"
                strokeLinecap="round"
                className="transform rotate-144 origin-center"
              />
              {/* Ring 3 - Amber */}
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="#f59e0b"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset="360"
                strokeLinecap="round"
                className="transform rotate-245 origin-center"
              />
            </svg>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E8E4E3] dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00c4de] shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{isAdmin ? t('dashboard.legend_driver') : t('dashboard.legend_misleading')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{isAdmin ? t('dashboard.legend_violator') : t('dashboard.legend_safety')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{isAdmin ? t('dashboard.legend_surveyor') : t('dashboard.legend_poor_quality')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{t('dashboard.legend_other')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity Feed */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[18px] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E8E4E3] dark:border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('dashboard.recent_activities')}
            </h2>
          </div>

          <CustomSelect
            value={feedFilter}
            onChange={setFeedFilter}
            size="sm"
            leftIcon={<Funnel size={14} />}
            options={[
              { value: 'all', label: t('dashboard.filter_all_events') },
              { value: 'critical', label: t('dashboard.filter_critical_only') },
              { value: 'user', label: t('dashboard.filter_user_only') },
            ]}
          />
        </div>

        {/* Activity Feed List */}
        <div className="space-y-1.5 pt-1">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-100/70 dark:hover:bg-white/5 rounded-xl transition-all cursor-default"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${act.dotColor}`} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                    {act.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {act.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  {act.avatar ? (
                    <span className="w-6 h-6 rounded-full bg-[#d3f7ff] dark:bg-[#00c4de]/20 text-[#007b8b] dark:text-[#00c4de] font-bold text-[10px] flex items-center justify-center">
                      {act.avatar}
                    </span>
                  ) : null}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{act.user}</span>
                </div>
                <span className="font-mono text-gray-400 w-16 text-right">
                  {act.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
