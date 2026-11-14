import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import PageHeader from '@/components/common/PageHeader'
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
  adminActivitiesData,
} from '@/data'
import {
  candidatesService,
  catalogService,
  revalidationService,
  escalationService,
} from '@/api/services'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation('ops')
  const isAdmin = user?.role === 'admin'

  const [timeRange, setTimeRange] = useState('30d')
  const [feedFilter, setFeedFilter] = useState('all')

  // Live real API stats for staff
  const [liveStaffStats, setLiveStaffStats] = useState({
    candidatesCount: 0,
    reportsCount: 0,
    tasksCount: 0,
    casesCount: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (isAdmin) return

    let active = true
    setIsLoadingStats(true)

    Promise.allSettled([
      candidatesService.getCandidates({ page: 1, pageSize: 1 }),
      catalogService.getMissingReports({ page: 1, pageSize: 1, status: 'PENDING' }),
      revalidationService.getTasks({ page: 1, pageSize: 1, status: 'ALL' }),
      escalationService.getCases({ page: 1, pageSize: 1, status: 'OPEN' }),
    ]).then(([qRes, mRes, tRes, cRes]) => {
      if (!active) return
      const candidatesCount = qRes.status === 'fulfilled' ? (qRes.value?.total ?? qRes.value?.items?.length ?? 0) : 0
      const reportsCount = mRes.status === 'fulfilled' ? (mRes.value?.total ?? 0) : 0
      const tasksCount = tRes.status === 'fulfilled' ? (tRes.value?.total ?? 0) : 0
      const casesCount = cRes.status === 'fulfilled' ? (cRes.value?.total ?? 0) : 0

      setLiveStaffStats({
        candidatesCount,
        reportsCount,
        tasksCount,
        casesCount,
      })
      setIsLoadingStats(false)
    })

    return () => {
      active = false
    }
  }, [isAdmin])

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

  const staffKpis = [
    {
      label: t('dashboard.kpi_staff_candidates_label', 'Hồ sơ biển báo cần duyệt'),
      value: isLoadingStats ? '...' : String(liveStaffStats.candidatesCount),
      change: `${liveStaffStats.candidatesCount}`,
      changeText: t('dashboard.kpi_staff_candidates_sub', 'hồ sơ trong hàng đợi'),
      isWarning: liveStaffStats.candidatesCount > 0,
      iconBg: 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de]',
    },
    {
      label: t('dashboard.kpi_staff_reports_label', 'Đề xuất loại biển mới'),
      value: isLoadingStats ? '...' : String(liveStaffStats.reportsCount),
      change: `${liveStaffStats.reportsCount}`,
      changeText: t('dashboard.kpi_staff_reports_sub', 'chờ xử lý'),
      isWarning: liveStaffStats.reportsCount > 0,
      iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    },
    {
      label: t('dashboard.kpi_staff_tasks_label', 'Nhiệm vụ tái xác thực'),
      value: isLoadingStats ? '...' : String(liveStaffStats.tasksCount),
      change: `${liveStaffStats.tasksCount}`,
      changeText: t('dashboard.kpi_staff_tasks_sub', 'đang mở trên hệ thống'),
      isPositive: true,
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    },
    {
      label: t('dashboard.kpi_staff_credits_label', 'Sự cố / ca tranh chấp'),
      value: isLoadingStats ? '...' : String(liveStaffStats.casesCount),
      change: `${liveStaffStats.casesCount}`,
      changeText: t('dashboard.kpi_staff_credits_sub', 'ca tiếp nhận'),
      isNeutral: true,
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
  ]

  const adminKpis = adminKpisData.map((kpi, idx) => {
    let label = kpi.label
    let changeText = kpi.changeText
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
    return { ...kpi, label, changeText }
  })

  const currentKpis = isAdmin ? adminKpis : staffKpis
  const currentIcons = isAdmin ? adminIcons : staffIcons

  // Admin activities fallback; staff activities is empty if no live events
  const recentActivities = isAdmin
    ? adminActivitiesData.map((act) => ({
        ...act,
        title: t(`dashboard.act_admin_${act.id}_title`, { defaultValue: act.title }),
        desc: t(`dashboard.act_admin_${act.id}_desc`, { defaultValue: act.desc }),
      }))
    : []

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <PageHeader
        title={isAdmin ? t('dashboard.admin_title') : t('dashboard.staff_title')}
        actions={
          <>
            {/* Time Range Custom Dropdown */}
            <CustomSelect
              value={timeRange}
              onChange={setTimeRange}
              leftIcon={<CalendarBlank size={16} />}
              options={[
                { value: '7d', label: t('dashboard.time_range_7') },
                { value: '30d', label: t('dashboard.time_range_30') },
                { value: '90d', label: t('dashboard.time_range_90') },
              ]}
            />

            {/* Export Button */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-white/5 border border-[#E8E4E3] dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors shadow-xs"
            >
              <DownloadSimple size={16} />
              <span>{t('dashboard.export_report')}</span>
            </button>
          </>
        }
      />

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {currentKpis.map((kpi, index) => {
          return (
            <div
              key={kpi.label}
              className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span
                  className={`p-2 rounded-xl transition-transform group-hover:scale-110 duration-200 ${kpi.iconBg}`}
                >
                  {currentIcons[index]}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {kpi.value}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {kpi.isPositive ? (
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <ArrowUpRight size={14} weight="bold" />
                    {kpi.change}
                  </span>
                ) : kpi.isWarning ? (
                  <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold">
                    <ArrowUpRight size={14} weight="bold" />
                    {kpi.change}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">{kpi.change}</span>
                )}
                <span className="text-gray-400 truncate">{kpi.changeText}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Grid: Charts Section (8 cols left, 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Operations Progress Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isAdmin ? t('dashboard.chart_line_admin_title') : t('dashboard.chart_line_staff_title')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAdmin ? t('dashboard.chart_line_admin_subtitle') : t('dashboard.chart_line_staff_subtitle')}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1">
              <DotsThreeVertical size={18} weight="bold" />
            </button>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-56 pt-2">
            <svg viewBox="0 0 720 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00c4de" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00c4de" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 50, 100, 150].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-100 dark:text-white/5"
                  strokeWidth="1"
                />
              ))}

              {/* Area under line 1 */}
              <polygon
                points="50,140 210,90 360,110 520,40 670,20 670,180 50,180"
                fill="url(#chartGradient)"
              />

              {/* Main Line 1 (Cyan) */}
              <polyline
                points="50,140 210,90 360,110 520,40 670,20"
                fill="none"
                stroke="#00c4de"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points on Line 1 */}
              {[[50, 140], [210, 90], [360, 110], [520, 40], [670, 20]].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="#00c4de"
                  className="stroke-white dark:stroke-[#0A171C]"
                  strokeWidth="2"
                />
              ))}

              {/* Main Line 2 (Dashed gray) */}
              <polyline
                points="50,170 210,150 360,160 520,130 670,100"
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
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
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
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="currentColor"
                className="text-gray-100 dark:text-white/10"
                strokeWidth="22"
                fill="transparent"
              />
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
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs">
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
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              {t('dashboard.no_activities', 'Không có hoạt động mới ghi nhận.')}
            </div>
          ) : (
            recentActivities.map((act) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
