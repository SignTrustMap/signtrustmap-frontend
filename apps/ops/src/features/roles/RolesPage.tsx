import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  Check,
  FloppyDisk,
} from '@phosphor-icons/react'
import { mockRoles, type RoleDefinition } from '@/data'

export default function RolesPage() {
  const { t } = useTranslation('ops')
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('roles.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('roles.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <FloppyDisk size={16} />
          <span>{hasChanges ? t('roles.btn_save') : saveSuccess ? t('roles.btn_saved') : t('roles.btn_save')}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <Check size={18} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
          <span>{t('roles.btn_saved')}</span>
        </div>
      )}

      {/* Main 2-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-3">
              {t('roles.role_list_title')}
            </h2>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(r.id)
                      setHasChanges(false)
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#007b8b] dark:border-[#00c4de] bg-[#d3f7ff]/50 dark:bg-[#00c4de]/15 shadow-xs'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {r.name}
                      </span>
                      {r.isSystemDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          Hệ thống
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {r.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed Permissions Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
          <div className="border-b border-[#E8E4E3] dark:border-white/10 pb-4 mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('roles.permissions_matrix_title')}: {selectedRole.name}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedRole.desc}
            </p>
          </div>

          <div className="space-y-4">
            {(
              Object.keys(
                selectedRole.permissions
              ) as Array<keyof RoleDefinition['permissions']>
            ).map((cat) => {
              const perm = selectedRole.permissions[cat]
              const catLabels: Record<string, string> = {
                userMgt: 'Quản lý Người dùng & Nhân sự (User Management)',
                taskApproval: 'Kiểm duyệt Bằng chứng & Nhiệm vụ (Task Approval)',
                financials: 'Thanh toán & Phê duyệt Điểm thưởng (Credits)',
                systemLogs: 'Nhật ký Hoạt động & Kiểm toán (System Logs)',
              }

              return (
                <div
                  key={cat}
                  className="p-4 rounded-xl border border-[#E8E4E3] dark:border-white/10 bg-[#F8F7F7]/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {catLabels[cat] || cat}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Scope: system:{cat}:*
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {(['read', 'create', 'update', 'delete'] as const).map((action) => {
                      const isAllowed = perm[action]
                      const actionLabels: Record<string, string> = {
                        read: t('roles.perm_read'),
                        create: t('roles.perm_create'),
                        update: t('roles.perm_update'),
                        delete: t('roles.perm_delete'),
                      }

                      return (
                        <label
                          key={action}
                          className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => togglePermission(cat, action)}
                            className="rounded border-gray-300 dark:border-white/20 text-[#007b8b] focus:ring-[#007b8b]"
                          />
                          <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                            {actionLabels[action]}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
