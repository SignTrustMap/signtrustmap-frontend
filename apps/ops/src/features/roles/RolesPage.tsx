import { useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  CaretRight,
  Users,
  CheckSquare,
  Bank,
  FileText,
  FloppyDisk,
  CheckCircle,
} from '@phosphor-icons/react'

export interface RoleDefinition {
  id: string
  name: string
  desc: string
  isSystemDefault?: boolean
  permissions: {
    userMgt: { read: boolean; create: boolean; update: boolean; delete: boolean }
    taskApproval: { read: boolean; create: boolean; update: boolean; delete: boolean }
    financials: { read: boolean; create: boolean; update: boolean; delete: boolean }
    systemLogs: { read: boolean; create: boolean; update: boolean; delete: boolean }
  }
}

const initialRoles: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    desc: 'Full system access',
    isSystemDefault: true,
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: true },
      taskApproval: { read: true, create: true, update: true, delete: false },
      financials: { read: true, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'staff_mgr',
    name: 'Staff Manager',
    desc: 'Manage personnel & schedules',
    permissions: {
      userMgt: { read: true, create: true, update: true, delete: false },
      taskApproval: { read: true, create: true, update: true, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    desc: 'Read-only auditing access',
    permissions: {
      userMgt: { read: true, create: false, update: false, delete: false },
      taskApproval: { read: true, create: false, update: false, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    id: 'support',
    name: 'Support Agent',
    desc: 'Ticketing & basic logs',
    permissions: {
      userMgt: { read: true, create: false, update: false, delete: false },
      taskApproval: { read: false, create: false, update: false, delete: false },
      financials: { read: false, create: false, update: false, delete: false },
      systemLogs: { read: true, create: false, update: false, delete: false },
    },
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0]

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleTogglePermission(
    category: keyof RoleDefinition['permissions'],
    action: 'read' | 'create' | 'update' | 'delete'
  ) {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRole.id) return r
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [category]: {
              ...r.permissions[category],
              [action]: !r.permissions[category][action],
            },
          },
        }
      })
    )
  }

  function handleSave() {
    setToastMessage(`Permissions for "${selectedRole.name}" updated successfully.`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  function handleDiscard() {
    setRoles(initialRoles)
    setToastMessage('Changes discarded.')
    setTimeout(() => setToastMessage(null), 2000)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            System Access Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage global roles and granular module permissions.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>Create New Role</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN: Roles List (4 cols) ────────────────────── */}
        <div className="lg:col-span-4 bg-white border border-[#E8E4E3] rounded-[18px] p-4 shadow-xs space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F7F7] border border-[#E8E4E3] rounded-lg focus:outline-none focus:border-[#007b8b]"
            />
          </div>

          {/* Role Items */}
          <div className="space-y-1.5 pt-1">
            {filteredRoles.map((role) => {
              const isSelected = role.id === selectedRole.id
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#d3f7ff] text-[#007b8b] font-bold shadow-xs'
                      : 'hover:bg-[#F8F7F7] text-gray-700'
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? 'text-[#007b8b]' : 'text-gray-900'
                      }`}
                    >
                      {role.name}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        isSelected ? 'text-[#007b8b]/80 font-normal' : 'text-gray-400'
                      }`}
                    >
                      {role.desc}
                    </p>
                  </div>
                  {isSelected && <CaretRight size={16} weight="bold" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Permissions Matrix (8 cols) ───────────── */}
        <div className="lg:col-span-8 bg-white border border-[#E8E4E3] rounded-[18px] shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            {/* Header info */}
            <div className="border-b border-[#E8E4E3] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedRole.name} Permissions
                </h2>
                {selectedRole.isSystemDefault && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1] uppercase font-mono">
                    System Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Granular access control configuration for the selected role. Modifying
                core permissions may require secondary authorization.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="border border-[#E8E4E3] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F7F7] border-b border-[#E8E4E3] font-bold text-gray-600 font-mono">
                    <th className="py-3 px-5">Module Category</th>
                    <th className="py-3 px-4 text-center w-20">Read</th>
                    <th className="py-3 px-4 text-center w-20">Create</th>
                    <th className="py-3 px-4 text-center w-20">Update</th>
                    <th className="py-3 px-4 text-center w-20">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4E3]">
                  {/* Row 1: User Management */}
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <Users size={20} className="text-[#007b8b] mt-0.5 shrink-0" weight="duotone" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            User Management
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Control over user accounts and lifecycles
                          </p>
                        </div>
                      </div>
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.userMgt[act]}
                          onChange={() => handleTogglePermission('userMgt', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Task Approval */}
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <CheckSquare size={20} className="text-[#007b8b] mt-0.5 shrink-0" weight="duotone" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            Task Approval
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Workflow transitions and sign-offs
                          </p>
                        </div>
                      </div>
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.taskApproval[act]}
                          onChange={() => handleTogglePermission('taskApproval', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Financial Records */}
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <Bank size={20} className="text-[#007b8b] mt-0.5 shrink-0" weight="duotone" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            Financial Records
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Invoices, payroll, and ledger access
                          </p>
                        </div>
                      </div>
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.financials[act]}
                          onChange={() => handleTogglePermission('financials', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: System Logs */}
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <FileText size={20} className="text-[#007b8b] mt-0.5 shrink-0" weight="duotone" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            System Logs
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            Audit trails and error reporting
                          </p>
                        </div>
                      </div>
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.systemLogs[act]}
                          onChange={() => handleTogglePermission('systemLogs', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-0 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 px-6 bg-[#F8F7F7] border-t border-[#E8E4E3] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Update Role Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
