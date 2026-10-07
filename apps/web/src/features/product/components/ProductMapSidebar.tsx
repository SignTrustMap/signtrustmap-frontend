import { useTranslation } from 'react-i18next'
import {
  MagnifyingGlass,
  X,
  FunnelSimple,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Flag,
} from '@phosphor-icons/react'
import { signCategories, type SignItem } from '@/data'

export interface CategoryMeta {
  code: string
  name: string
  bgHex: string
  badgeClass: string
}

interface ProductMapSidebarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onSelectCategory: (category: string) => void
  filteredSigns: SignItem[]
  selectedSignId: string | null
  onSelectSign: (sign: SignItem) => void
  onOpenReport: (signId?: string) => void
  isDark: boolean
  isDriver: boolean
  mobileTab: 'map' | 'list'
  getCategoryMeta: (cat: string) => CategoryMeta
}

export function ProductMapSidebar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  filteredSigns,
  selectedSignId,
  onSelectSign,
  onOpenReport,
  isDark,
  isDriver,
  mobileTab,
  getCategoryMeta,
}: ProductMapSidebarProps) {
  const { t } = useTranslation('product')

  return (
    <div
      className={`lg:col-span-4 rounded-2xl border p-5 flex flex-col h-[700px] transition-colors ${
        mobileTab === 'list' ? 'flex' : 'hidden lg:flex'
      } ${
        isDark
          ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
          : 'bg-white border-[#E8E4E3] shadow-xs'
      }`}
    >
      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('map_page.search_placeholder')}
            className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-xl border focus:outline-none transition-all ${
              isDark
                ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors"
              title={t('map_page.clear_search')}
            >
              <X size={15} weight="bold" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {t('map_page.group_label')}
            </span>
            {(selectedCategory !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('ALL')
                  onSearchChange('')
                }}
                className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
              >
                {t('map_page.reset_filter')}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {signCategories.map((cat) => {
              const active = selectedCategory === cat.id
              const localizedLabel = t(`map_page.groups.${cat.id}`)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/25'
                        : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/20'
                      : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                  }`}
                >
                  {localizedLabel}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Directory Header Bar */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-left">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          {t('map_page.sign_list_title')}
        </span>
        <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
          {filteredSigns.length} {t('map_page.signs_unit')}
        </span>
      </div>

      {/* Scrollable Sign Items List */}
      <div className="flex-1 overflow-y-auto mt-2.5 space-y-2.5 pr-1 text-left">
        {filteredSigns.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
              <FunnelSimple size={24} />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {t('map_page.no_results')}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('ALL')
                onSearchChange('')
              }}
              className="px-3.5 py-1.5 rounded-xl border text-xs font-bold bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black transition-opacity hover:opacity-90 cursor-pointer"
            >
              {t('map_page.reset_filter')}
            </button>
          </div>
        ) : (
          filteredSigns.map((sign) => {
            const isSelected = sign.id === selectedSignId
            const meta = getCategoryMeta(sign.category)
            return (
              <div
                key={sign.id}
                onClick={() => onSelectSign(sign)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? isDark
                      ? 'bg-[#00c4de]/10 border-[#00c4de] shadow-sm'
                      : 'bg-teal-50 border-[#007b8b] shadow-sm'
                    : isDark
                      ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-gray-200'
                      : 'bg-gray-50/80 hover:bg-gray-100/90 border-gray-200 text-gray-900'
                }`}
              >
                {/* Top Code & Trust Badges */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                    >
                      {sign.code}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                      {meta.name}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                    <CheckCircle size={12} weight="bold" />
                    {sign.trustScore}%
                  </span>
                </div>

                {/* Sign Title */}
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                  {sign.name}
                </h3>

                {/* Location text */}
                <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin size={13} className="shrink-0 text-gray-500 dark:text-gray-400" />
                  <span className="truncate">{sign.location}</span>
                </p>

                {/* Direction & Status metadata */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/70 dark:border-white/5 text-[11px]">
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                    {t('mini_map.popup_heading')} {sign.heading}°
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                      {t('map_page.status_verified')}
                    </span>

                    {isDriver && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenReport(sign.id)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                        title={t('map_page.btn_report_issue')}
                      >
                        <Flag size={11} weight="bold" />
                        <span>{t('map_page.btn_report_quick')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
