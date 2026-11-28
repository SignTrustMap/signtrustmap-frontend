import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleNotch } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
import type { ClassesResponse, AiClassItem } from '@/api/services/aiops.service'

interface ClassesTabProps {
  classesData: ClassesResponse | null
  classesLoading: boolean
  classesSearch: string
  setClassesSearch: (val: string) => void
}

function getSignCategory(c: AiClassItem): 'P' | 'W' | 'R' | 'I' | 'OTHER' {
  const code = (c.standard_code || '').trim().toUpperCase()
  if (code.startsWith('P')) return 'P'
  if (code.startsWith('W')) return 'W'
  if (code.startsWith('R')) return 'R'
  if (code.startsWith('I')) return 'I'

  const cat = (c.category || '').trim().toUpperCase()
  if (cat.includes('PROHIBIT') || cat.includes('SPEED')) return 'P'
  if (cat.includes('WARN')) return 'W'
  if (cat.includes('MANDAT')) return 'R'
  if (cat.includes('INFO') || cat.includes('INDICAT')) return 'I'

  const prefix = (c.class_name || '').trim().toUpperCase().charAt(0)
  if (prefix === 'P') return 'P'
  if (prefix === 'W') return 'W'
  if (prefix === 'R') return 'R'
  if (prefix === 'I') return 'I'

  return 'OTHER'
}

export function ClassesTab({
  classesData,
  classesLoading,
  classesSearch,
  setClassesSearch,
}: ClassesTabProps) {
  const { i18n } = useTranslation('ops')
  const isEn = i18n.language?.startsWith('en')

  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'P' | 'W' | 'R' | 'I'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const rawClasses = useMemo(() => classesData?.classes || [], [classesData])

  // Count by group
  const counts = useMemo(() => {
    const c = { ALL: rawClasses.length, P: 0, W: 0, R: 0, I: 0, OTHER: 0 }
    rawClasses.forEach((item) => {
      const g = getSignCategory(item)
      if (g in c) c[g]++
    })
    return c
  }, [rawClasses])

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return rawClasses.filter((c) => {
      if (!c) return false
      if (selectedGroup !== 'ALL' && getSignCategory(c) !== selectedGroup) {
        return false
      }
      if (classesSearch.trim()) {
        const q = classesSearch.toLowerCase()
        return (
          (c.class_id != null ? c.class_id.toString() : '').includes(q) ||
          (c.standard_code || '').toLowerCase().includes(q) ||
          (c.class_name || '').toLowerCase().includes(q) ||
          (c.name_vi || '').toLowerCase().includes(q) ||
          (c.name_en || '').toLowerCase().includes(q) ||
          (c.human_readable_name || '').toLowerCase().includes(q) ||
          (c.prompt || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [rawClasses, selectedGroup, classesSearch])

  // Pagination
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredClasses.slice(start, start + pageSize)
  }, [filteredClasses, currentPage, pageSize])

  const handleGroupChange = (g: 'ALL' | 'P' | 'W' | 'R' | 'I') => {
    setSelectedGroup(g)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* ── Top Filter & Search Controls Bar ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-3 shadow-xs">
        {/* Category Pills */}
        <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold overflow-x-auto flex-nowrap scrollbar-none">
          <button
            type="button"
            onClick={() => handleGroupChange('ALL')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedGroup === 'ALL'
              ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-2xs font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span>{isEn ? 'All classes' : 'Tất cả'}</span>
            <span className="text-[10px] opacity-75 font-mono">{counts.ALL}</span>
          </button>
          <button
            type="button"
            onClick={() => handleGroupChange('P')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedGroup === 'P'
              ? 'bg-white dark:bg-[#0A171C] text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span>{isEn ? 'Prohibition P' : 'Biển cấm P'}</span>
            <span className="text-[10px] opacity-75 font-mono">{counts.P}</span>
          </button>
          <button
            type="button"
            onClick={() => handleGroupChange('W')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedGroup === 'W'
              ? 'bg-white dark:bg-[#0A171C] text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span>{isEn ? 'Warning W' : 'Biển cảnh báo W'}</span>
            <span className="text-[10px] opacity-75 font-mono">{counts.W}</span>
          </button>
          <button
            type="button"
            onClick={() => handleGroupChange('R')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedGroup === 'R'
              ? 'bg-white dark:bg-[#0A171C] text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span>{isEn ? 'Mandatory R' : 'Biển hiệu lệnh R'}</span>
            <span className="text-[10px] opacity-75 font-mono">{counts.R}</span>
          </button>
          <button
            type="button"
            onClick={() => handleGroupChange('I')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedGroup === 'I'
              ? 'bg-white dark:bg-[#0A171C] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span>{isEn ? 'Indication I' : 'Biển chỉ dẫn I'}</span>
            <span className="text-[10px] opacity-75 font-mono">{counts.I}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full lg:w-72">
          <input
            type="text"
            value={classesSearch}
            onChange={(e) => {
              setClassesSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={isEn ? 'Search by ID, code, name...' : 'Tìm theo ID, mã, tên biển...'}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b]"
          />
        </div>
      </div>

      {/* ── Classes Table ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
        {classesLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <CircleNotch size={24} className="animate-spin text-[#007b8b]" />
            <span className="text-xs font-mono">{isEn ? 'Loading dataset classes...' : 'Đang tải danh mục 100 lớp nhãn...'}</span>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-mono text-xs">
            {isEn ? 'No classes match the search query.' : 'Không tìm thấy lớp nhãn phù hợp.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono text-[11px] border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-16">ID</th>
                  <th className="py-2.5 px-4 font-semibold w-32">{isEn ? 'Sign Code' : 'Mã chuẩn'}</th>
                  <th className="py-2.5 px-4 font-semibold w-80">{isEn ? 'Sign Name' : 'Tên biển báo'}</th>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'CLIP Prompt' : 'CLIP prompt'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {paginatedClasses.map((c) => {
                  const grp = getSignCategory(c)
                  const displayCode = c.standard_code || c.class_name
                  const primaryName = c.name_vi || c.human_readable_name || c.class_name
                  const secondaryName = c.name_en || (c.human_readable_name !== primaryName ? c.human_readable_name : null)

                  return (
                    <tr key={c.class_id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-400">
                        #{c.class_id != null ? c.class_id.toString().padStart(2, '0') : '--'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs border ${grp === 'P'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : grp === 'W'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : grp === 'R'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                        >
                          {displayCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {primaryName}
                        </p>
                        {secondaryName && secondaryName !== primaryName && (
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                            {secondaryName}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        <span className="select-all">{c.prompt}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Standard Catalog Pagination Footer */}
        {filteredClasses.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredClasses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz)
                setCurrentPage(1)
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              itemLabel={isEn ? 'classes' : 'lớp'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
