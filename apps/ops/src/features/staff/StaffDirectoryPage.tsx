import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { UserPlus, Funnel, MapPin } from '@phosphor-icons/react'
import { mockSystemUsers, type SystemUser, type StaffStatus } from '@/data'

function StatusDot({ status }: { status: StaffStatus }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#dcfce7] text-[#15803d] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] dark:bg-[#4ade80]" />
          {t('staff.status_active')}
        </span>
      )
    case 'Suspended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] dark:bg-[#f87171]" />
          {t('staff.status_suspended')}
        </span>
      )
    case 'Inactive':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 dark:border dark:border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          {t('staff.status_inactive')}
        </span>
      )
  }
}

export default function StaffDirectoryPage() {
  const { t } = useTranslation('ops')
  const navigate = useNavigate()
  const [users] = useState<SystemUser[]>(mockSystemUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  function handleClearFilters() {
    setRoleFilter('all')
    setStatusFilter('all')
    setLocationFilter('all')
    setSearchQuery('')
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesRole = true
    if (roleFilter !== 'all') matchesRole = u.role === roleFilter

    let matchesStatus = true
    if (statusFilter !== 'all') matchesStatus = u.status === statusFilter

    let matchesLocation = true
    if (locationFilter !== 'all') matchesLocation = u.location.includes(locationFilter)

    return matchesSearch && matchesRole && matchesStatus && matchesLocation
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

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

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={t('staff.title')}
        actions={
          <button
            type="button"
            onClick={() => navigate('/staff/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus size={16} weight="bold" />
            <span>{t('staff.btn_add_user')}</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('staff.search_placeholder')}
      >
        <div className="w-36 sm:w-44">
          <CustomSelect
            value={roleFilter}
            onChange={setRoleFilter}
            className="w-full"
            buttonClassName="w-full"
            options={[
              { value: 'all', label: t('staff.role_all') },
              { value: 'Admin', label: 'Admin' },
              { value: 'Staff', label: 'Staff' },
              { value: 'Reviewer', label: 'Reviewer' },
              { value: 'Surveyor', label: 'Surveyor' },
              { value: 'Driver', label: 'Driver' },
            ]}
          />
        </div>

        <div className="w-36 sm:w-44">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
            buttonClassName="w-full"
            options={[
              { value: 'all', label: t('staff.status_all') },
              { value: 'Active', label: t('staff.status_active') },
              { value: 'Suspended', label: t('staff.status_suspended') },
              { value: 'Inactive', label: t('staff.status_inactive') },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          className="py-2 px-3 border border-[#E8E4E3] dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Funnel size={14} />
          <span>{t('staff.btn_clear_filter')}</span>
        </button>
      </DataFilterBar>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/60 dark:bg-[#061014] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                <th className="py-4 px-6 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedUserIds.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="py-4 px-6">{t('staff.th_user')}</th>
                <th className="py-4 px-6">{t('staff.th_role')}</th>
                <th className="py-4 px-6">{t('staff.th_status')}</th>
                <th className="py-4 px-6">{t('staff.th_location')}</th>
                <th className="py-4 px-6">{t('staff.th_last_active')}</th>
                <th className="py-4 px-6 text-right">{t('staff.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E3] dark:divide-white/10">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#F8F7F7]/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/staff/${user.id}`)}
                >
                  <td
                    className="py-4 px-6"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${user.avatarBg}`}
                      >
                        {user.initials}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusDot status={user.status} />
                  </td>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                      <span>{user.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {user.lastActive}
                  </td>
                  <td
                    className="py-4 px-6 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/staff/${user.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/25 dark:border-[#00c4de]/30 text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                    >
                      {t('staff.btn_details')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="px-6 py-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </div>
  )
}
