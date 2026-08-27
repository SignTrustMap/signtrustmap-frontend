import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  UserPlus,
  CaretLeft,
  CaretRight,
  MapPin,
  Funnel,
  CheckCircle,
} from '@phosphor-icons/react'
import { mockSystemUsers, type SystemUser, type StaffStatus } from '@/data'

function StatusDot({ status }: { status: StaffStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dcfce7] text-[#15803d] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] dark:bg-[#4ade80]" />
          Đang hoạt động
        </span>
      )
    case 'Suspended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] dark:bg-[#f87171]" />
          Tạm ngưng
        </span>
      )
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Không hoạt động
        </span>
      )
  }
}

export default function StaffDirectoryPage() {
  const navigate = useNavigate()
  const [users] = useState<SystemUser[]>(mockSystemUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [locationFilter, setLocationFilter] = useState('Tất cả khu vực')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id))
    } else {
      setSelectedUserIds([])
    }
  }

  function handleSelectOne(id: string) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function handleClearFilters() {
    setRoleFilter('Tất cả vai trò')
    setStatusFilter('Tất cả trạng thái')
    setLocationFilter('Tất cả khu vực')
    setSearchQuery('')
  }

  function handleApplyFilters() {
    setToastMessage('Đã áp dụng các tiêu chí lọc danh sách.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === 'Tất cả vai trò' || u.role === roleFilter

    const matchesStatus =
      statusFilter === 'Tất cả trạng thái' ||
      (statusFilter === 'Đang hoạt động' && u.status === 'Active') ||
      (statusFilter === 'Tạm ngưng' && u.status === 'Suspended') ||
      (statusFilter === 'Không hoạt động' && u.status === 'Inactive')

    const matchesLocation =
      locationFilter === 'Tất cả khu vực' || u.location.includes(locationFilter)

    return matchesSearch && matchesRole && matchesStatus && matchesLocation
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản lý nhân sự & Người dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản trị danh bạ tài khoản, phân bổ vai trò và trạng thái truy cập của nhân viên.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <UserPlus size={18} weight="bold" />
          <span>Thêm nhân sự mới</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Card Container */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
          <Funnel size={14} weight="bold" />
          <span>Bộ lọc nâng cao</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Role Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="Tất cả vai trò">Tất cả vai trò</option>
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Quản lý vận hành">Quản lý vận hành</option>
              <option value="Kiểm duyệt viên">Kiểm duyệt viên</option>
              <option value="Hỗ trợ">Hỗ trợ</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
              <option value="Không hoạt động">Không hoạt động</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Khu vực
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            >
              <option value="Tất cả khu vực">Tất cả khu vực</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Cần Thơ">Cần Thơ</option>
              <option value="Hải Phòng">Hải Phòng</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 py-2 px-3 border border-[#E8E4E3] hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 py-2 px-3 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Search & Bulk Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
          />
        </div>

        {selectedUserIds.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">
              Đã chọn {selectedUserIds.length} nhân sự
            </span>
            <button
              type="button"
              className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold transition-colors"
            >
              Khóa hàng loạt
            </button>
          </div>
        )}
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
                    onChange={handleSelectAll}
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUserIds.length === filteredUsers.length
                    }
                    className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Nhân sự</th>
                <th className="py-4 px-4">Vai trò</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-4">Khu vực</th>
                <th className="py-4 px-4">Hoạt động gần nhất</th>
                <th className="py-4 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3]">
              {filteredUsers.map((u) => {
                const isChecked = selectedUserIds.includes(u.id)
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-[#F8F7F7]/50 transition-colors ${
                      isChecked ? 'bg-[#d3f7ff]/15' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectOne(u.id)}
                        className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.avatarBg}`}
                        >
                          {u.initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusDot status={u.status} />
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-[#007b8b] shrink-0" />
                        <span>{u.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-gray-500">
                      {u.lastActive}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/staff/${u.id}`)}
                        className="text-xs font-semibold text-[#007b8b] hover:underline cursor-pointer"
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3.5 px-6 border-t border-[#E8E4E3] flex items-center justify-between text-xs text-gray-500">
          <span>
            Hiển thị 1 đến {filteredUsers.length} trong {users.length} tài khoản
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
