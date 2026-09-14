import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import {
  DownloadSimple,
  CalendarBlank,
} from '@phosphor-icons/react'
import { mockAuditLogs, type AuditLogItem, type EventType } from '@/data'

function EventTypeBadge({ type }: { type: EventType }) {
  const { t } = useTranslation('ops')
  switch (type) {
    case 'Permission':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          {t('audit.type_permission')}
        </span>
      )
    case 'Config':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#007b8b]/15 text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/40">
          {t('audit.type_config')}
        </span>
      )
    case 'Login':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          {t('audit.type_login')}
        </span>
      )
    case 'Alert':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
          {t('audit.type_alert')}
        </span>
      )
    case 'Data Access':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
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
  const [dateRange, setDateRange] = useState('01/08/2026 - 31/08/2026')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  function handleExport() {
    const headers = [
      `${t('audit.th_id', 'ID')},${t('audit.th_time')},${t('audit.th_user')},${t('audit.th_event')},${t('audit.th_target')},${t('audit.th_ip')},${t('audit.th_type')}`
    ]
    const rows = filteredLogs.map(
      (l) =>
        `"${l.id}","${l.timestamp}","${l.user.name}","${l.action}","${l.targetId}","${l.ipAddress}","${l.eventType}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header - Clean Title Only + Export Report Button */}
      <PageHeader
        title={t('audit.title')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>{t('dashboard.export_report')}</span>
          </button>
        }
      />

      {/* Unified Filter Bar */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('audit.search_placeholder')}
      >
        <div className="w-40 sm:w-48">
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

        {/* Date Range Selector representation */}
        <div className="w-48 sm:w-60 relative">
          <CalendarBlank
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/15 rounded-xl focus:outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] font-mono text-neutral-700 dark:text-neutral-300"
          />
        </div>
      </DataFilterBar>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
                <th className="py-3.5 px-4">{t('audit.th_time')}</th>
                <th className="py-3.5 px-4">{t('audit.th_user')}</th>
                <th className="py-3.5 px-4">{t('audit.th_event')}</th>
                <th className="py-3.5 px-4">{t('audit.th_target')}</th>
                <th className="py-3.5 px-4">{t('audit.th_ip')}</th>
                <th className="py-3.5 px-4 text-center">{t('audit.th_type')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 font-medium">
                    {t('audit.empty_state')}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${log.user.avatarBg}`}
                        >
                          {log.user.initials}
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white text-xs">
                          {log.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-white text-xs max-w-md">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 font-bold text-[#007b8b] dark:text-[#00c4de]">
                        {log.targetId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {log.ipAddress}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <EventTypeBadge type={log.eventType} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </div>
  )
}
