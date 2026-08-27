import { useState } from 'react'
import {
  ShieldCheck,
  Check,
  Plus,
  Trash,
  FloppyDisk,
  WarningCircle,
} from '@phosphor-icons/react'
import { mockRoles, type RoleDefinition } from '@/data'

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>(mockRoles)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const selectedRole =
    roles.find((r) => r.id === selectedRoleId) || roles[0]

  function togglePermission(
    category: keyof RoleDefinition['permissions'],
    action: 'read' | 'create' | 'update' | 'delete'
  ) {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [category]: {
                ...role.permissions[category],
                [action]: !role.permissions[category][action],
              },
            },
          }
        }
        return role
      })
    )
    setHasChanges(true)
    setSaveSuccess(false)
  }

  function handleSave() {
    setHasChanges(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4E3] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Phân quyền hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý vai trò bảo mật và phân bổ ma trận quyền hạn cho nhân sự.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <Check size={14} weight="bold" /> Đã lưu quyền thành công
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Role List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              Vai trò hệ thống ({roles.length})
            </h2>
            <button
              type="button"
              className="text-xs font-semibold text-[#007b8b] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Tạo vai trò</span>
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = role.id === selectedRoleId
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-[#007b8b] ring-2 ring-[#007b8b]/15 shadow-sm'
                      : 'bg-white border-[#E8E4E3] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={18}
                        weight={isSelected ? 'fill' : 'regular'}
                        className={
                          isSelected ? 'text-[#007b8b]' : 'text-gray-400'
                        }
                      />
                      <span className="font-bold text-sm text-gray-900">
                        {role.name}
                      </span>
                    </div>
                    {role.isSystemDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600 font-semibold">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 pl-6">
                    {role.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Permission Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E8E4E3] rounded-[18px] p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-[#E8E4E3] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {selectedRole.name}
                </h3>
                {selectedRole.isSystemDefault && (
                  <span className="text-[10px] font-mono bg-[#d3f7ff] text-[#007b8b] px-2 py-0.5 rounded font-bold">
                    HỆ THỐNG
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRole.desc}
              </p>
            </div>

            {!selectedRole.isSystemDefault && (
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1.5 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              >
                <Trash size={14} />
                <span>Xóa vai trò</span>
              </button>
            )}
          </div>

          {/* Granular Permission Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              Ma trận quyền hạn chi tiết
            </h4>

            <div className="border border-[#E8E4E3] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F7] border-b border-[#E8E4E3] font-mono font-bold text-gray-500 uppercase text-[10px]">
                    <th className="py-3 px-4">Nhóm quyền</th>
                    <th className="py-3 px-3 text-center">Xem (Read)</th>
                    <th className="py-3 px-3 text-center">Tạo (Create)</th>
                    <th className="py-3 px-3 text-center">Sửa (Update)</th>
                    <th className="py-3 px-3 text-center">Xóa (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4E3]">
                  {/* User Management */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      Quản lý người dùng
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.userMgt[act]}
                          onChange={() => togglePermission('userMgt', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Task Approval */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      Phê duyệt nhiệm vụ & Hồ sơ
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.taskApproval[act]}
                          onChange={() => togglePermission('taskApproval', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Financials & Payouts */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      Báo cáo tài chính & Thưởng
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.financials[act]}
                          onChange={() => togglePermission('financials', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* System Logs */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      Nhật ký hệ thống & Kiểm toán
                    </td>
                    {(['read', 'create', 'update', 'delete'] as const).map((act) => (
                      <td key={act} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions.systemLogs[act]}
                          onChange={() => togglePermission('systemLogs', act)}
                          className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <WarningCircle size={18} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Lưu ý:</strong> Thay đổi quyền hạn sẽ có hiệu lực ngay trong phiên làm việc tiếp theo của người dùng được gán vai trò này.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
