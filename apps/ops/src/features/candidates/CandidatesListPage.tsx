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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#b91c1c]">
          Cao
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#b45309]">
          Vừa
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
          Thấp
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  switch (status) {
    case 'Đang xem xét':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8]">
          Đang xem xét
        </span>
      )
    case 'Chưa xử lý':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c]">
          Chưa xử lý
        </span>
      )
    case 'Đã giải quyết':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Hồ sơ kiểm duyệt & Báo cáo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách hồ sơ ứng viên và khảo sát viên bị hệ thống hoặc cộng đồng gắn cờ cảnh báo.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-mono uppercase text-[11px] text-gray-400">
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
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-mono uppercase text-[11px] text-gray-400">
              Mức độ ưu tiên
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="Tất cả mức độ">Tất cả mức độ</option>
              <option value="Cao">Cao</option>
              <option value="Vừa">Vừa</option>
              <option value="Thấp">Thấp</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-mono uppercase text-[11px] text-gray-400">
              Trạng thái xử lý
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
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
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-6">Mã hồ sơ</th>
                <th className="py-4 px-6">Đối tượng báo cáo</th>
                <th className="py-4 px-6">Ngày báo cáo</th>
                <th className="py-4 px-6">Lý do gắn cờ</th>
                <th className="py-4 px-6">Mức độ</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3]">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8F7F7]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900 font-mono text-xs">
                    {c.id}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">{c.name}</td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-mono">{c.reportedDate}</td>
                  <td className="py-4 px-6 text-xs text-gray-700 max-w-xs truncate">{c.reason}</td>
                  <td className="py-4 px-6">
                    <PriorityTag priority={c.priority} />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/candidates/${c.id.replace('#', '')}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#007b8b] hover:underline"
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
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>
            Hiển thị 1 đến {filteredCandidates.length} trong {candidates.length} báo cáo
          </span>

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
