import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DownloadSimple,
  MapPin,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from '@phosphor-icons/react'

export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved'

export interface SignReportItem {
  id: string
  location: string
  reporter: {
    name: string
    initials: string
    avatarBg: string
  }
  dateSubmitted: string
  status: ReportStatus
}

const mockSignReports: SignReportItem[] = [
  {
    id: '#REP-2049',
    location: 'Terminal B, Gate 14',
    reporter: { name: 'John Doe', initials: 'JD', avatarBg: 'bg-[#dbeafe] text-[#1d4ed8]' },
    dateSubmitted: 'Oct 24, 2023',
    status: 'Pending',
  },
  {
    id: '#REP-2048',
    location: 'Concourse C, Restrooms',
    reporter: { name: 'Alice Smith', initials: 'AS', avatarBg: 'bg-[#ffedd5] text-[#c2410c]' },
    dateSubmitted: 'Oct 23, 2023',
    status: 'Investigating',
  },
  {
    id: '#REP-2045',
    location: 'Main Lobby, Exit 3',
    reporter: { name: 'Bob Wilson', initials: 'BW', avatarBg: 'bg-gray-200 text-gray-700' },
    dateSubmitted: 'Oct 20, 2023',
    status: 'Resolved',
  },
]

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case 'Pending':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-[#fee2e2] text-[#b91c1c]">
          Pending
        </span>
      )
    case 'Investigating':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-[#dbeafe] text-[#1d4ed8]">
          Investigating
        </span>
      )
    case 'Resolved':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600">
          Resolved
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

  const filteredReports = reports.filter((r) => {
    const matchesTab = activeTab === 'All' || r.status === activeTab
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  function handleExport() {
    const headers = ['ReportID,Location,Reporter,DateSubmitted,Status']
    const rows = filteredReports.map(
      (r) =>
        `"${r.id}","${r.location}","${r.reporter.name}","${r.dateSubmitted}","${r.status}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `missing_signs_report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Missing Signs Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and resolve reported missing or damaged signage.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E4E3] bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <DownloadSimple size={16} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Tabs bar */}
      <div className="border-b border-[#E8E4E3] flex items-center justify-between gap-4">
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
                    ? 'border-[#007b8b] text-[#007b8b]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>{tab === 'All' ? 'All Reports' : tab}</span>
                {count > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive
                        ? 'bg-[#d3f7ff] text-[#007b8b]'
                        : 'bg-gray-100 text-gray-600'
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
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-6">Report ID</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Reporter</th>
                <th className="py-4 px-6">Date Submitted</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] text-sm">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-[#F8F7F7]/50 transition-colors group"
                >
                  {/* Report ID */}
                  <td className="py-4 px-6 font-bold text-gray-900 font-mono text-xs">
                    {report.id}
                  </td>

                  {/* Location */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-gray-800 text-xs sm:text-sm font-medium">
                      <MapPin size={16} className="text-[#007b8b] shrink-0" />
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
                      <span className="font-medium text-gray-800 text-xs">
                        {report.reporter.name}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-xs font-mono text-gray-500 whitespace-nowrap">
                    {report.dateSubmitted}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 text-center">
                    <ReportStatusBadge status={report.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right space-x-3 whitespace-nowrap">
                    {report.status !== 'Resolved' ? (
                      <>
                        <button
                          type="button"
                          className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/candidates/${report.id.replace('#', '')}`
                            )
                          }
                          className="text-xs font-semibold text-[#007b8b] hover:underline cursor-pointer"
                        >
                          Review
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/candidates/${report.id.replace('#', '')}`)
                        }
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>Showing 1 to {filteredReports.length} of 24 results</span>

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
