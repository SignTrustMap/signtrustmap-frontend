import { useState } from 'react'
import {
  DownloadSimple,
  CalendarBlank,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { mockAuditLogs, type AuditLogItem, type EventType } from '@/data'

function EventTypeBadge({ type }: { type: EventType }) {
  switch (type) {
    case 'Permission':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffedd5] text-[#c2410c]">
          Phân quyền
        </span>
      )
    case 'Config':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0369a1]">
          Cấu hình
        </span>
      )
    case 'Login':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0f2fe]/70 text-[#0284c7]">
          Đăng nhập
        </span>
      )
    case 'Alert':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">
          Cảnh báo
        </span>
      )
    case 'Data Access':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffedd5]/80 text-[#9a3412]">
          Truy cập dữ liệu
        </span>
      )
  }
}

export default function AuditLogsPage() {
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

  function handleExportCsv() {
    const headers = ['Thời gian,Tài khoản,Loại sự kiện,Hành động thực hiện,Mã đối tượng,Địa chỉ IP']
    const rows = filteredLogs.map(
      (l) =>
        `"${l.timestamp}","${l.user.name}","${l.eventType}","${l.action.replace(/"/g, '""')}","${l.targetId}","${l.ipAddress}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `nhat_ky_hoat_dong_${Date.now()}.csv`)
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
            Nhật ký hoạt động
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi dấu vết hoạt động hệ thống và giám sát an ninh dữ liệu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <DownloadSimple size={16} weight="bold" />
          <span>Xuất tệp CSV</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Date range picker */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Khoảng thời gian
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
              Loại sự kiện
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="all">Tất cả sự kiện</option>
              <option value="Permission">Phân quyền</option>
              <option value="Config">Cấu hình</option>
              <option value="Login">Đăng nhập</option>
              <option value="Alert">Cảnh báo</option>
              <option value="Data Access">Truy cập dữ liệu</option>
            </select>
          </div>

          {/* Search by User ID or IP */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Tìm kiếm
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm theo mã tài khoản, IP hoặc hành động..."
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
                <th className="py-3.5 px-6">Thời gian</th>
                <th className="py-3.5 px-6">Tài khoản</th>
                <th className="py-3.5 px-6">Loại sự kiện</th>
                <th className="py-3.5 px-6">Hành động thực hiện</th>
                <th className="py-3.5 px-6">Mã đối tượng</th>
                <th className="py-3.5 px-6">Địa chỉ IP</th>
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
          <span>Hiển thị 1 đến {filteredLogs.length} trong 12.403 kết quả</span>

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
