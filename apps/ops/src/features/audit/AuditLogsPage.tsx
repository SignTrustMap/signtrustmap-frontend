import { useState } from 'react'
import {
  DownloadSimple,
  CalendarBlank,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'

export type EventType = 'Permission' | 'Config' | 'Login' | 'Alert' | 'Data Access'

export interface AuditLogItem {
  id: string
  timestamp: string
  user: {
    name: string
    initials: string
    avatarBg: string
  }
  eventType: EventType
  action: string
  targetId: string
  ipAddress: string
}

const mockLogs: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2023-10-31 14:23:05',
    user: { name: 'john.doe', initials: 'JD', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    eventType: 'Permission',
    action: "Changed Role Permissions: Granted 'Admin' access to user #1042",
    targetId: 'USR-9942',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-2',
    timestamp: '2023-10-31 13:10:12',
    user: { name: 'admin.sys', initials: 'AS', avatarBg: 'bg-[#007b8b] text-white' },
    eventType: 'Config',
    action: 'Updated System Setting: Session Timeout changed from 30m to 60m',
    targetId: 'SYS-CFG-01',
    ipAddress: '10.0.0.12',
  },
  {
    id: 'log-3',
    timestamp: '2023-10-31 11:45:00',
    user: { name: 'm.klay', initials: 'MK', avatarBg: 'bg-gray-200 text-gray-700' },
    eventType: 'Login',
    action: 'Successful user authentication via SSO Google Workspace',
    targetId: '-',
    ipAddress: '203.0.113.89',
  },
  {
    id: 'log-4',
    timestamp: '2023-10-31 09:22:18',
    user: { name: 'SYSTEM', initials: 'SY', avatarBg: 'bg-[#fee2e2] text-[#b91c1c]' },
    eventType: 'Alert',
    action: 'Multiple failed login attempts detected on reviewer endpoint',
    targetId: 'USR-1022',
    ipAddress: '198.51.100.22',
  },
  {
    id: 'log-5',
    timestamp: '2023-10-30 16:55:40',
    user: { name: 'john.doe', initials: 'JD', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    eventType: 'Data Access',
    action: 'Exported Employee Roster to CSV with moderation stats',
    targetId: 'REP-EMP-04',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-6',
    timestamp: '2023-10-30 14:10:02',
    user: { name: 'l.jones', initials: 'LJ', avatarBg: 'bg-gray-200 text-gray-700' },
    eventType: 'Login',
    action: 'User logout and session destroyed successfully',
    targetId: '-',
    ipAddress: '198.51.100.144',
  },
]

function EventTypeBadge({ type }: { type: EventType }) {
  switch (type) {
    case 'Permission':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffedd5] text-[#c2410c]">
          Permission
        </span>
      )
    case 'Config':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0369a1]">
          Config
        </span>
      )
    case 'Login':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0f2fe]/70 text-[#0284c7]">
          Login
        </span>
      )
    case 'Alert':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">
          Alert
        </span>
      )
    case 'Data Access':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffedd5]/80 text-[#9a3412]">
          Data Access
        </span>
      )
  }
}

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogItem[]>(mockLogs)
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('Oct 1, 2023 - Oct 31, 2023')
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

  function handleExportCsv() {
    const headers = ['Timestamp,User,EventType,Action,TargetID,IPAddress']
    const rows = filteredLogs.map(
      (l) =>
        `"${l.timestamp}","${l.user.name}","${l.eventType}","${l.action.replace(/"/g, '""')}","${l.targetId}","${l.ipAddress}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            System activity tracking and security monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <DownloadSimple size={16} weight="bold" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Date range picker */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Date Range
            </label>
            <div className="relative">
              <CalendarBlank
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
              />
            </div>
          </div>

          {/* Event type dropdown */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Event Type
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="all">All Events</option>
              <option value="Permission">Permission</option>
              <option value="Config">Config</option>
              <option value="Login">Login</option>
              <option value="Alert">Alert</option>
              <option value="Data Access">Data Access</option>
            </select>
          </div>

          {/* Search by User ID or IP */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by User ID or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Event Type</th>
                <th className="py-3.5 px-6">Action Performed</th>
                <th className="py-3.5 px-6">Target ID</th>
                <th className="py-3.5 px-6">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8F7F7]/50 transition-colors">
                  {/* Timestamp */}
                  <td className="py-4 px-6 text-xs text-gray-600 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  {/* User */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${log.user.avatarBg}`}
                      >
                        {log.user.initials}
                      </span>
                      <span className="font-medium text-gray-800 text-xs">
                        {log.user.name}
                      </span>
                    </div>
                  </td>

                  {/* Event Type */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <EventTypeBadge type={log.eventType} />
                  </td>

                  {/* Action */}
                  <td className="py-4 px-6 text-xs text-gray-700 max-w-md truncate">
                    {log.action}
                  </td>

                  {/* Target ID */}
                  <td className="py-4 px-6 text-xs font-mono text-gray-500 whitespace-nowrap">
                    {log.targetId}
                  </td>

                  {/* IP */}
                  <td className="py-4 px-6 text-xs font-mono text-gray-500 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>Showing 1 to {filteredLogs.length} of 12,403 results</span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#E8E4E3] hover:bg-gray-50 disabled:opacity-40"
            >
              <CaretLeft size={14} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-[#007b8b] text-white font-bold text-xs">
              1
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-[#E8E4E3] hover:bg-gray-50 text-xs">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-[#E8E4E3] hover:bg-gray-50 text-xs">
              3
            </button>
            <span className="px-1 text-gray-400">...</span>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-[#E8E4E3] hover:bg-gray-50 text-xs">
              206
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#E8E4E3] hover:bg-gray-50"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
