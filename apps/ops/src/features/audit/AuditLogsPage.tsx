import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import {
  DownloadSimple,
  CalendarBlank,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { mockAuditLogs, type AuditLogItem, type EventType } from '@/data'

function EventTypeBadge({ type }: { type: EventType }) {
  const { t } = useTranslation('ops')
  switch (type) {
    case 'Permission':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ffedd5] text-[#c2410c] dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
          {t('audit.type_permission')}
        </span>
      )
    case 'Config':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e0f2fe] text-[#0369a1] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30">
          {t('audit.type_config')}
        </span>
      )
    case 'Login':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e0f2fe]/70 text-[#0284c7] dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/30">
          {t('audit.type_login')}
        </span>
      )
    case 'Alert':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#dc2626] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          {t('audit.type_alert')}
        </span>
      )
    case 'Data Access':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ffedd5]/80 text-[#9a3412] dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
          {t('audit.type_data_access')}
        </span>
      )
  }
}

export default function AuditLogsPage() {
  const { t } = useTranslation('ops')
  const [logs] = useState<AuditLogItem[]>(mockAuditLogs)
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('01/10/2023 - 31/10/2023')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredLogs = logs.filter((log) => {
    const matchesEvent =
      selectedEventType === 'all' || log.eventType === selectedEventType
    const matchesSearch =
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesEvent && matchesSearch
  })

  function handleExport() {
    const headers = ['Mã sự kiện,Thời gian,Người thực hiện,Hành động,Đối tượng,IP,Phân loại']
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.timestamp}","${l.user.name}","${l.action}","${l.targetId}","${l.ipAddress}","${l.eventType}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `nhat_ky_audit_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('audit.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('audit.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <DownloadSimple size={16} />
          <span>{t('dashboard.export_report')}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('audit.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
            />
          </div>

          {/* Event type filter */}
          <div className="sm:col-span-3">
            <CustomSelect
              value={selectedEventType}
              onChange={setSelectedEventType}
              className="w-full"
              buttonClassName="w-full"
              options={[
                { value: 'all', label: t('audit.event_all') },
                { value: 'Permission', label: t('audit.type_permission') },
                { value: 'Config', label: t('audit.type_config') },
                { value: 'Login', label: t('audit.type_login') },
                { value: 'Alert', label: t('audit.type_alert') },
                { value: 'Data Access', label: t('audit.type_data_access') },
              ]}
            />
          </div>

          {/* Date range picker representation */}
          <div className="sm:col-span-3 relative">
            <CalendarBlank
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de] font-mono text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">{t('audit.th_time')}</th>
                <th className="py-4 px-6">{t('audit.th_user')}</th>
                <th className="py-4 px-6">{t('audit.th_event')}</th>
                <th className="py-4 px-6">{t('audit.th_target')}</th>
                <th className="py-4 px-6">{t('audit.th_ip')}</th>
                <th className="py-4 px-6 text-center">{t('audit.th_type')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${log.user.avatarBg}`}
                      >
                        {log.user.initials}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white text-xs">
                        {log.user.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white text-xs">
                    {log.action}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-600 dark:text-gray-300">
                    {log.targetId}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {log.ipAddress}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <EventTypeBadge type={log.eventType} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('audit.showing_results', { count: filteredLogs.length, total: logs.length })}
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40"
            >
              <CaretLeft size={14} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#007b8b] text-white font-bold text-xs">
              1
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
