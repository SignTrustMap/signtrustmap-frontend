import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  Plus,
  Funnel,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'

export type UserStatus = 'Active' | 'Suspended' | 'Inactive'

export interface SystemUser {
  id: string
  name: string
  email: string
  role: string
  status: UserStatus
  location: string
  lastActive: string
  avatarText: string
  avatarBg: string
}

const mockSystemUsers: SystemUser[] = [
  {
    id: 'USR-8492',
    name: 'Sarah Jenkins',
    email: 's.jenkins@enterprise.com',
    role: 'Quản trị viên',
    status: 'Active',
    location: 'Hà Nội',
    lastActive: 'Vừa xong',
    avatarText: 'SJ',
    avatarBg: 'bg-[#d3f7ff] text-[#007b8b]',
  },
  {
    id: 'USR-7731',
    name: 'Marcus Reed',
    email: 'm.reed@enterprise.com',
    role: 'Khảo sát viên',
    status: 'Active',
    location: 'TP. Hồ Chí Minh',
    lastActive: '2 giờ trước',
    avatarText: 'MR',
    avatarBg: 'bg-[#007b8b] text-white',
  },
  {
    id: 'USR-9012',
    name: 'David Chen',
    email: 'd.chen@enterprise.com',
    role: 'Kiểm duyệt viên',
    status: 'Suspended',
    location: 'Đà Nẵng',
    lastActive: '12/10/2023',
    avatarText: 'DC',
    avatarBg: 'bg-slate-800 text-white',
  },
  {
    id: 'USR-6621',
    name: 'Elena Lopez',
    email: 'e.lopez@enterprise.com',
    role: 'Tài xế',
    status: 'Inactive',
    location: 'Cần Thơ',
    lastActive: '05/09/2023',
    avatarText: 'EL',
    avatarBg: 'bg-indigo-100 text-indigo-700',
  },
]

function StatusDotBadge({ status }: { status: UserStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#15803d]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
          <span>Đang hoạt động</span>
        </span>
      )
    case 'Suspended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
          <span>Tạm ngưng</span>
        </span>
      )
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span>Không hoạt động</span>
        </span>
      )
  }
}

export default function StaffDirectoryPage() {
  const navigate = useNavigate()
  const [users] = useState<SystemUser[]>(mockSystemUsers)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [locationFilter, setLocationFilter] = useState('Tất cả khu vực')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map((u) => u.id))
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleClear() {
    setRoleFilter('Tất cả vai trò')
    setStatusFilter('Tất cả trạng thái')
    setLocationFilter('Tất cả khu vực')
    setSearchQuery('')
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'Tất cả vai trò' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'Tất cả trạng thái' || u.status === statusFilter
    const matchesLocation =
      locationFilter === 'Tất cả khu vực' || u.location === locationFilter

    return matchesSearch && matchesRole && matchesStatus && matchesLocation
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản lý nhân sự
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và giám sát toàn bộ nhân sự trên toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm nhân sự..."
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
            <span>Thêm nhân sự</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Role Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="Tất cả vai trò">Tất cả vai trò</option>
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Khảo sát viên">Khảo sát viên</option>
              <option value="Kiểm duyệt viên">Kiểm duyệt viên</option>
              <option value="Tài xế">Tài xế</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Active">Đang hoạt động</option>
              <option value="Suspended">Tạm ngưng</option>
              <option value="Inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Khu vực
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="Tất cả khu vực">Tất cả khu vực</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Cần Thơ">Cần Thơ</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-gray-600 bg-white border border-[#E8E4E3] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-center"
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-[#007b8b] hover:bg-[#00606d] rounded-lg transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Funnel size={14} />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] bg-[#F8F7F7]/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === users.length && users.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6">Nhân sự</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Khu vực</th>
                <th className="py-4 px-6">Hoạt động cuối</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3]">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id)
                return (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/staff/${user.id}`)}
                    className={`hover:bg-[#F8F7F7]/50 cursor-pointer transition-colors ${
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
                        onChange={(e) => toggleSelect(user.id, e as unknown as React.MouseEvent)}
                        className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${user.avatarBg}`}
                        >
                          {user.avatarText}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6 text-xs text-gray-700 font-medium">
                      {user.role}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <StatusDotBadge status={user.status} />
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6 text-xs text-gray-700">
                      {user.location}
                    </td>

                    {/* Last Active */}
                    <td className="py-4 px-6 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {user.lastActive}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-6 text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/staff/${user.id}`)}
                        className="text-xs font-semibold text-[#007b8b] hover:underline cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>Hiển thị 1 đến {filteredUsers.length} trong 97 kết quả</span>

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
              10
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
