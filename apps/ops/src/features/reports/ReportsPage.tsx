import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DownloadSimple,
  MapPin,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { mockSignReports, type SignReportItem, type ReportStatus } from '@/data'

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          Chờ xử lý
        </span>
      )
    case 'Investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#dbeafe] text-[#1d4ed8] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30">
          Đang xác minh
        </span>
      )
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          Đã giải quyết
        </span>
      )
  }
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [reports] = useState<SignReportItem[]>(mockSignReports)
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Investigating' | 'Resolved'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const tabLabels: Record<'All' | 'Pending' | 'Investigating' | 'Resolved', string> = {
    All: 'Tất cả báo cáo',
    Pending: 'Chờ xử lý',
    Investigating: 'Đang xác minh',
    Resolved: 'Đã giải quyết',
  }

  const filteredReports = reports.filter((r) => {
    const matchesTab = activeTab === 'All' || r.status === activeTab
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  function handleExport() {
    const headers = ['Mã báo cáo,Vị trí,Người gửi,Ngày gửi,Trạng thái']
    const rows = filteredReports.map(
      (r) =>
        `"${r.id}","${r.location}","${r.reporter.name}","${r.dateSubmitted}","${r.status}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `bao_cao_su_co_bien_bao_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Báo cáo sự cố biển báo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và giải quyết các phản ánh về biển báo bị hư hỏng, che khuất hoặc thiếu sót.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <DownloadSimple size={16} />
          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* Tabs bar */}
      <div className="border-b border-[#E8E4E3] dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex gap-6">
          {(['All', 'Pending', 'Investigating', 'Resolved'] as const).map((tab) => {
            const isActive = activeTab === tab
            const count =
              tab === 'All'
                ? reports.length
                : reports.filter((r) => r.status === tab).length

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer relative ${
                  isActive
                    ? 'border-[#007b8b] text-[#007b8b] dark:border-[#00c4de] dark:text-[#00c4de]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <span>{tabLabels[tab]}</span>
                {count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de]'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mini Search */}
        <div className="relative w-48 sm:w-60 mb-2">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm sự cố..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">Mã báo cáo</th>
                <th className="py-4 px-6">Vị trí phản ánh</th>
                <th className="py-4 px-6">Người báo cáo</th>
                <th className="py-4 px-6">Ngày gửi</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10 text-sm">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Report ID */}
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    {report.id}
                  </td>

                  {/* Location */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-medium">
                      <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                      <span>{report.location}</span>
                    </div>
                  </td>

                  {/* Reporter */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${report.reporter.avatarBg}`}
                      >
                        {report.reporter.initials}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                        {report.reporter.name}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {report.dateSubmitted}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 text-center">
                    <ReportStatusBadge status={report.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    {report.status !== 'Resolved' ? (
                      <>
                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                        >
                          Phân công
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/candidates/${report.id.replace('#', '')}`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/25 dark:border-[#00c4de]/30 text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                        >
                          Kiểm tra
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/candidates/${report.id.replace('#', '')}`)
                        }
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Hiển thị 1 đến {filteredReports.length} trong 24 kết quả</span>

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
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 text-xs">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 text-xs">
              3
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
