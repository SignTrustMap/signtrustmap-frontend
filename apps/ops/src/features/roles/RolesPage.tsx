import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import {
  FloppyDisk,
  LockKey,
  Check,
} from '@phosphor-icons/react'
import {
  mockRoles,
  PERMISSION_CATEGORIES,
  type RoleDefinition,
  type PermModuleKey,
  type PermActionKey,
} from '@/data'

export default function RolesPage() {
  const { t, i18n } = useTranslation('ops')
  const langKey = i18n.language.startsWith('en') ? 'en' : 'vi'
  const toast = useToast()

  const [roles, setRoles] = useState<RoleDefinition[]>(mockRoles)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('staff')
  const [hasChanges, setHasChanges] = useState(false)

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0]

  function handleTogglePermission(module: PermModuleKey, action: PermActionKey) {
    if (selectedRole.isSystemDefault) return

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r
        const currentVal = r.permissions[module][action]
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [module]: {
              ...r.permissions[module],
              [action]: !currentVal,
            },
          },
        }
      })
    )
    setHasChanges(true)
  }

  function handleSetAllPermissions(enable: boolean) {
    if (selectedRole.isSystemDefault) return

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r
        const updatedPermissions = { ...r.permissions }
        PERMISSION_CATEGORIES.forEach((cat) => {
          updatedPermissions[cat.module] = {
            read: enable,
            create: enable,
            update: enable,
            delete: enable,
          }
        })
        return {
          ...r,
          permissions: updatedPermissions,
        }
      })
    )
    setHasChanges(true)
  }

  function handleSave() {
    setHasChanges(false)
    toast.success(t('roles.toast_saved'))
  }

  const actionLabels: Record<PermActionKey, string> = {
    read: t('roles.perm_read'),
    create: t('roles.perm_create'),
    update: t('roles.perm_update'),
    delete: t('roles.perm_delete'),
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header - Clean Title Only + Direct Save Action */}
      <PageHeader
        title={t('roles.title')}
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{t('roles.btn_save')}</span>
          </button>
        }
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Role Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('roles.role_list_title')}
            </h2>
            <span className="text-[11px] font-mono font-medium text-neutral-400">
              {roles.length} roles
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId
              const roleName = r.name[langKey] || r.name.vi
              const roleDesc = r.desc[langKey] || r.desc.vi

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#007b8b]/8 dark:bg-[#00c4de]/10 border-[#007b8b] dark:border-[#00c4de] ring-1 ring-[#007b8b]/30 dark:ring-[#00c4de]/30 shadow-xs'
                      : 'bg-transparent border-neutral-200/70 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      {roleName}
                    </span>

                    {r.isSystemDefault ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 font-semibold">
                        <LockKey size={11} weight="bold" />
                        {t('roles.badge_default')}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {roleDesc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Detailed Permissions Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          {/* Header of Selected Role */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/10">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {t('roles.permissions_title')}: {selectedRole.name[langKey] || selectedRole.name.vi}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {selectedRole.desc[langKey] || selectedRole.desc.vi}
              </p>
            </div>

            {/* Quick Bulk Actions for Editable Roles */}
            {!selectedRole.isSystemDefault ? (
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetAllPermissions(true)}
                  className="px-2.5 py-1 text-xs font-medium text-[#007b8b] dark:text-[#00c4de] hover:bg-[#007b8b]/10 rounded-lg transition-colors cursor-pointer"
                >
                  {t('roles.btn_select_all')}
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <button
                  type="button"
                  onClick={() => handleSetAllPermissions(false)}
                  className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  {t('roles.btn_deselect_all')}
                </button>
              </div>
            ) : null}
          </div>

          {/* System Default Notice Banner */}
          {selectedRole.isSystemDefault && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs leading-normal">
              <LockKey size={16} weight="bold" className="shrink-0 text-purple-600 dark:text-purple-400" />
              <span>{t('roles.locked_system_role')}</span>
            </div>
          )}

          {/* Permission Categories List */}
          <div className="divide-y divide-neutral-100 dark:divide-white/5">
            {PERMISSION_CATEGORIES.map((cat) => {
              return (
                <div
                  key={cat.key}
                  className="py-4.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 block truncate">
                      {t(cat.nameKey)}
                    </span>
                    <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                      module: {cat.module}
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {cat.actions.map((act) => {
                      const isChecked = selectedRole.permissions[cat.module][act]
                      return (
                        <label
                          key={act}
                          className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all select-none ${
                            selectedRole.isSystemDefault
                              ? 'cursor-not-allowed opacity-80'
                              : 'cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600'
                          } ${
                            isChecked
                              ? 'bg-[#007b8b]/15 border-[#007b8b]/40 text-[#007b8b] dark:bg-[#00c4de]/20 dark:border-[#00c4de]/40 dark:text-[#00c4de] font-bold shadow-2xs'
                              : 'border-neutral-200 dark:border-white/10 text-neutral-400 dark:text-neutral-500 bg-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSystemDefault}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(cat.module, act)}
                            className="sr-only"
                          />
                          {isChecked ? (
                            <Check size={13} weight="bold" className="shrink-0" />
                          ) : (
                            <span className="w-3.25 h-3.25 rounded-xs border border-neutral-300 dark:border-neutral-700 shrink-0 inline-block" />
                          )}
                          <span>{actionLabels[act]}</span>
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
