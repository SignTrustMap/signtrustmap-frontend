import { useTranslation } from 'react-i18next'
import { Tag, CircleNotch } from '@phosphor-icons/react'
import { SearchBar } from '@/components/common/SearchBar'
import type { ClassesResponse } from '@/api/services/aiops.service'

interface ClassesTabProps {
  classesData: ClassesResponse | null
  classesLoading: boolean
  classesSearch: string
  setClassesSearch: (val: string) => void
}

export function ClassesTab({
  classesData,
  classesLoading,
  classesSearch,
  setClassesSearch,
}: ClassesTabProps) {
  const { t } = useTranslation('ops')

  const filteredClasses = (classesData?.classes || []).filter((c) => {
    const q = classesSearch.toLowerCase()
    return (
      c.class_id.toString().includes(q) ||
      c.class_name.toLowerCase().includes(q) ||
      c.human_readable_name.toLowerCase().includes(q) ||
      c.prompt.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Tag size={24} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t('mlops.classes_total_label')} ({classesData?.total ?? 100})
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              {t('mlops.classes_desc')}
            </p>
          </div>
        </div>

        <SearchBar
          value={classesSearch}
          onChange={setClassesSearch}
          placeholder={t('mlops.classes_search_placeholder')}
          className="w-full sm:w-80"
          inputClassName="font-mono"
        />
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        {classesLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <CircleNotch size={28} className="animate-spin text-[#007b8b]" />
            <span className="text-xs font-mono">{t('mlops.classes_loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold w-24">{t('mlops.classes_th_id')}</th>
                  <th className="py-3 px-4 font-semibold w-64">{t('mlops.classes_th_name')}</th>
                  <th className="py-3 px-4 font-semibold w-56">{t('mlops.classes_th_human')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.classes_th_prompt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredClasses.map((c) => (
                  <tr key={c.class_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">
                      #{c.class_id.toString().padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {c.class_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {c.human_readable_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-purple-600 dark:text-purple-300 font-mono text-[11px]">
                        {c.prompt}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
