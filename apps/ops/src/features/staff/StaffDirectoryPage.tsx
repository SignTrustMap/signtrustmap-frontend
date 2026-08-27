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
    role: 'Admin',
    status: 'Active',
    location: 'New York',
    lastActive: 'Just now',
    avatarText: 'SJ',
    avatarBg: 'bg-[#d3f7ff] text-[#007b8b]',
  },
  {
    id: 'USR-7731',
    name: 'Marcus Reed',
    email: 'm.reed@enterprise.com',
    role: 'Surveyor',
    status: 'Active',
    location: 'London',
    lastActive: '2 hours ago',
    avatarText: 'MR',
    avatarBg: 'bg-[#007b8b] text-white',
  },
  {
    id: 'USR-9012',
    name: 'David Chen',
    email: 'd.chen@enterprise.com',
    role: 'Reviewer',
    status: 'Suspended',
    location: 'Singapore',
    lastActive: 'Oct 12, 2023',
    avatarText: 'DC',
    avatarBg: 'bg-slate-800 text-white',
  },
  {
    id: 'USR-6621',
    name: 'Elena Lopez',
    email: 'e.lopez@enterprise.com',
    role: 'Driver',
    status: 'Inactive',
    location: 'New York',
    lastActive: 'Sep 05, 2023',
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
          <span>Active</span>
        </span>
      )
    case 'Suspended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
          <span>Suspended</span>
        </span>
      )
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span>Inactive</span>
        </span>
      )
  }
}

export default function StaffDirectoryPage() {
  const navigate = useNavigate()
  const [users] = useState<SystemUser[]>(mockSystemUsers)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [locationFilter, setLocationFilter] = useState('All Locations')
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
    setRoleFilter('All Roles')
    setStatusFilter('All Statuses')
    setLocationFilter('All Locations')
    setSearchQuery('')
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'All Statuses' || u.status === statusFilter
    const matchesLocation =
      locationFilter === 'All Locations' || u.location === locationFilter

    return matchesSearch && matchesRole && matchesStatus && matchesLocation
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            System Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor all personnel across the organization.
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
              placeholder="Search users..."
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
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white border border-[#E8E4E3] rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Role Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="All Roles">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Surveyor">Surveyor</option>
              <option value="Reviewer">Reviewer</option>
              <option value="Driver">Driver</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg text-gray-800 focus:outline-none focus:border-[#007b8b] font-medium"
            >
              <option value="All Locations">All Locations</option>
              <option value="New York">New York</option>
              <option value="London">London</option>
              <option value="Singapore">Singapore</option>
              <option value="Seattle">Seattle</option>
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-gray-600 bg-white border border-[#E8E4E3] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer text-center"
            >
              Clear
            </button>
            <button
              type="button"
              className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-[#007b8b] hover:bg-[#00606d] rounded-lg transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Funnel size={14} />
              <span>Apply</span>
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
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Last Active</th>
                <th className="py-4 px-6 text-right">Actions</th>
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
                        View Details
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
          <span>Showing 1 to {filteredUsers.length} of 97 results</span>

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
