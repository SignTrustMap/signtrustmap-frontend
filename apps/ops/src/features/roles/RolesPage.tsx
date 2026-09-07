import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  FloppyDisk,
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

  const [roles, setRoles] = useState<RoleDefinition[]>(mockRoles)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('staff')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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
    setSaveSuccess(false)
  }

  function handleSave() {
    setHasChanges(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const actionLabels: Record<PermActionKey, string> = {
    read: t('roles.perm_read'),
    create: t('roles.perm_create'),
    update: t('roles.perm_update'),
    delete: t('roles.perm_delete'),
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <ShieldCheck size={16} weight="bold" />
            <span>{t('roles.tag')}</span>
          </div>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <FloppyDisk size={16} />
          <span>
            {hasChanges
              ? t('roles.btn_save')
              : saveSuccess
              ? t('roles.btn_saved')
              : t('roles.btn_save')}
          </span>
        </button>
      </div>

      {saveSuccess && (
        <div
          onClick={() => setSaveSuccess(false)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <Check size={16} weight="bold" />
          <span>{t('roles.toast_saved')}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Main 2-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-3">
              {t('roles.role_list_title')}
            </h2>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId
                const roleName = r.name[langKey] || r.name.vi
                const roleDesc = r.desc[langKey] || r.desc.vi

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(r.id)
                      setSaveSuccess(false)
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#d3f7ff]/40 dark:bg-[#00c4de]/10 border-[#007b8b] dark:border-[#00c4de] shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white font-mono">
                        {roleName}
                      </span>
                      {r.isSystemDefault && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                          {t('roles.badge_default')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {roleDesc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Permissions Detailed Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('roles.permissions_title')}: {selectedRole.name[langKey] || selectedRole.name.vi}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedRole.desc[langKey] || selectedRole.desc.vi}
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {PERMISSION_CATEGORIES.map((cat) => {
              return (
                <div key={cat.key} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {t(cat.nameKey)}
                    </span>
                    <span className="block text-[11px] font-mono text-gray-400 mt-0.5">
                      module: {cat.module}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {cat.actions.map((act) => {
                      const isChecked = selectedRole.permissions[cat.module][act]
                      return (
                        <label
                          key={act}
                          className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                            selectedRole.isSystemDefault ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                          } ${
                            isChecked
                              ? 'bg-[#007b8b]/10 border-[#007b8b]/30 text-[#007b8b] dark:text-[#00c4de] font-bold'
                              : 'border-gray-200 dark:border-white/10 text-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={selectedRole.isSystemDefault}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(cat.module, act)}
                            className="w-3.5 h-3.5 accent-[#007b8b] rounded"
                          />
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
