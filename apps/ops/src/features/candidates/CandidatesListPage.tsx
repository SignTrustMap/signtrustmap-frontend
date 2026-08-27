import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  Plus,
  SlidersHorizontal,
  DotsThreeVertical,
  WarningOctagon,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'

export type Priority = 'HIGH' | 'MED' | 'LOW'
export type CandidateStatus = 'Unresolved' | 'In Review' | 'Action Taken'

export interface CandidateItem {
  id: string
  priority: Priority
  reportReason: string
  reportedBy: string
  date: string
  status: CandidateStatus
}

export const mockCandidates: CandidateItem[] = [
  {
    id: 'CAN-9932',
    priority: 'HIGH',
    reportReason: 'Thông tin không chính xác - Lịch sử công tác',
    reportedBy: 'J. Smith (Quản lý)',
    date: '24/10 09:12',
    status: 'Unresolved',
  },
  {
    id: 'CAN-8421',
    priority: 'MED',
    reportReason: 'Chất lượng ảnh và metadata chưa đạt chuẩn',
    reportedBy: 'A. Davis (Kiểm duyệt viên)',
    date: '23/10 14:45',
    status: 'In Review',
  },
  {
    id: 'CAN-7754',
    priority: 'LOW',
    reportReason: 'Nghi vấn trùng lặp hồ sơ khảo sát',
    reportedBy: 'Hệ thống tự động',
    date: '22/10 11:20',
    status: 'Action Taken',
  },
  {
    id: 'CAN-9912',
    priority: 'HIGH',
    reportReason: 'Phản ánh vi phạm quy chuẩn an toàn',
    reportedBy: 'M. Johnson (Người dùng)',
    date: '24/10 08:05',
    status: 'Unresolved',
  },
]

function PriorityBadge({ priority }: { priority: Priority }) {
  switch (priority) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fee2e2] text-[#b91c1c] uppercase">
          <WarningOctagon size={13} weight="bold" /> Cao
        </span>
      )
    case 'MED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fef3c7] text-[#b45309] uppercase">
          <WarningOctagon size={13} weight="bold" /> Vừa
        </span>
      )
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] uppercase">
          <WarningOctagon size={13} weight="bold" /> Thấp
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  switch (status) {
    case 'Unresolved':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]">
          Chưa xử lý
        </span>
      )
    case 'In Review':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-[#dbeafe] text-[#1d4ed8]">
          Đang xem xét
        </span>
      )
    case 'Action Taken':
      return (
        <span className="px-3 py-1 rounded text-xs font-bold bg-[#dcfce7] text-[#15803d]">
          Đã xử lý
        </span>
      )
  }
}

export default function CandidatesListPage() {
  const navigate = useNavigate()
  const [candidates] = useState<CandidateItem[]>(mockCandidates)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả đang mở')
  const [priorityFilter, setPriorityFilter] = useState('Tất cả')
  const [dateFilter, setDateFilter] = useState('7 ngày qua')

  const toggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(candidates.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reportReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'Tất cả' ||
      statusFilter === 'Tất cả đang mở' ||
      c.status === statusFilter

    const matchesPriority =
      priorityFilter === 'Tất cả' || c.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Hồ sơ kiểm duyệt
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hàng đợi kiểm duyệt cho các hồ sơ và dữ liệu bị gắn cờ cần quản trị viên xem xét.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm theo ID hoặc lý do..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b] shadow-xs"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Thêm hồ sơ</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-[14px] border border-[#E8E4E3] shadow-xs">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold font-mono">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E8E4E3] rounded-md px-2 py-1 bg-[#F8F7F7] text-gray-800 focus:outline-none font-medium"
            >
              <option value="Tất cả đang mở">Tất cả đang mở</option>
              <option value="Unresolved">Chưa xử lý</option>
              <option value="In Review">Đang xem xét</option>
              <option value="Action Taken">Đã xử lý</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold font-mono">Mức ưu tiên:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-[#E8E4E3] rounded-md px-2 py-1 bg-[#F8F7F7] text-gray-800 focus:outline-none font-medium"
            >
              <option value="Tất cả">Tất cả</option>
              <option value="HIGH">Cao</option>
              <option value="MED">Vừa</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold font-mono">Thời gian:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-[#E8E4E3] rounded-md px-2 py-1 bg-[#F8F7F7] text-gray-800 focus:outline-none font-medium"
            >
              <option value="7 ngày qua">7 ngày qua</option>
              <option value="30 ngày qua">30 ngày qua</option>
              <option value="Tất cả thời gian">Tất cả thời gian</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E8E4E3] hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition-colors"
        >
          <SlidersHorizontal size={14} />
          <span>Thao tác hàng loạt</span>
        </button>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === candidates.length &&
                      candidates.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Mã hồ sơ</th>
                <th className="py-4 px-4">Ưu tiên</th>
                <th className="py-4 px-6">Lý do báo cáo</th>
                <th className="py-4 px-4">Người báo cáo</th>
                <th className="py-4 px-4">Thời gian</th>
                <th className="py-4 px-4 text-center">Trạng thái</th>
                <th className="py-4 px-4 text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] text-sm">
              {filteredCandidates.map((c) => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    className={`hover:bg-[#F8F7F7]/60 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#d3f7ff]/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(c.id, e as unknown as React.MouseEvent)}
                        className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Candidate ID */}
                    <td className="py-4 px-4 font-bold text-gray-900 font-mono text-xs">
                      {c.id}
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    {/* Report Reason */}
                    <td className="py-4 px-6 font-medium text-gray-800 text-xs sm:text-sm">
                      {c.reportReason}
                    </td>

                    {/* Reported By */}
                    <td className="py-4 px-4 text-xs text-gray-600">
                      {c.reportedBy}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {c.date}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Menu dots */}
                    <td
                      className="py-4 px-4 text-right text-gray-400 hover:text-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                        <DotsThreeVertical size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>Hiển thị 1-{filteredCandidates.length} trong số 124 hồ sơ</span>

          <div className="flex items-center gap-2">
            <button className="p-1 rounded border border-[#E8E4E3] hover:bg-gray-50 disabled:opacity-40">
              <CaretLeft size={14} />
            </button>
            <span className="font-mono text-xs text-gray-700">Trang 1 / 32</span>
            <button className="p-1 rounded border border-[#E8E4E3] hover:bg-gray-50">
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
