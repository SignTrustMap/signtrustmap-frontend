import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Eye,
} from '@phosphor-icons/react'
import { mockCandidates, type CandidateItem, type PriorityLevel, type CandidateStatus } from '@/data'

function PriorityTag({ priority }: { priority: PriorityLevel }) {
  switch (priority) {
    case 'Cao':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          Cao
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30">
          Vừa
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          Thấp
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  switch (status) {
    case 'Đang xem xét':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8] dark:bg-cyan-500/15 dark:text-[#00c4de] dark:border dark:border-cyan-500/30">
          Đang xem xét
        </span>
      )
    case 'Chưa xử lý':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          Chưa xử lý
        </span>
      )
    case 'Đã giải quyết':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          Đã giải quyết
        </span>
      )
  }
}

export default function CandidatesListPage() {
  const [candidates] = useState<CandidateItem[]>(mockCandidates)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('Tất cả mức độ')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPriority =
      priorityFilter === 'Tất cả mức độ' || c.priority === priorityFilter

    const matchesStatus =
      statusFilter === 'Tất cả trạng thái' || c.status === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Hồ sơ kiểm duyệt & Báo cáo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Danh sách hồ sơ ứng viên và khảo sát viên bị hệ thống hoặc cộng đồng gắn cờ cảnh báo.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              Tìm kiếm
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm theo mã hồ sơ, tên, lý do báo cáo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              Mức độ ưu tiên
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
            >
              <option value="Tất cả mức độ">Tất cả mức độ</option>
              <option value="Cao">Cao</option>
              <option value="Vừa">Vừa</option>
              <option value="Thấp">Thấp</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-mono uppercase text-[11px]">
              Trạng thái xử lý
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#061115] border border-[#E8E4E3] dark:border-white/15 rounded-lg focus:outline-none focus:border-[#00c4de]"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Chưa xử lý">Chưa xử lý</option>
              <option value="Đang xem xét">Đang xem xét</option>
              <option value="Đã giải quyết">Đã giải quyết</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6">Mã hồ sơ</th>
                <th className="py-4 px-6">Đối tượng báo cáo</th>
                <th className="py-4 px-6">Ngày báo cáo</th>
                <th className="py-4 px-6">Lý do gắn cờ</th>
                <th className="py-4 px-6 text-center">Mức độ</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white font-mono text-xs">
                    {c.id}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 font-mono">{c.reportedDate}</td>
                  <td className="py-4 px-6 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">{c.reason}</td>
                  <td className="py-4 px-6 text-center">
                    <PriorityTag priority={c.priority} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/candidates/${c.id.replace('#', '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/25 dark:border-[#00c4de]/30 text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>Xem xét</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Hiển thị 1 đến {filteredCandidates.length} trong {candidates.length} báo cáo
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 cursor-pointer"
            >
              <CaretLeft size={14} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#007b8b] text-white font-bold text-xs">
              1
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
