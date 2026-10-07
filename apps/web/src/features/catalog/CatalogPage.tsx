import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  TrafficSignal,
  WarningCircle,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  catalogService,
  type BackendCatalogSignType,
  type BackendSignCategory,
} from '@/api/services/catalog.service'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'
import { CatalogDetailModal, type CategoryMeta } from './components/CatalogDetailModal'
import { ProposeSignModal } from './components/ProposeSignModal'
import { CatalogGridView } from './components/CatalogGridView'

/**
 * Resolves visual badge styling for standard category codes.
 */
function getCategoryBadgeMeta(code?: string): CategoryMeta {
  const upper = (code || '').toUpperCase().trim()

  switch (upper) {
    case 'PROHIBITORY':
      return {
        label: 'Biển báo cấm',
        badgeClass:
          'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
        dot: 'bg-red-500',
      }
    case 'WARNING':
      return {
        label: 'Biển báo nguy hiểm',
        badgeClass:
          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        dot: 'bg-amber-500',
      }
    case 'MANDATORY':
      return {
        label: 'Biển báo hiệu lệnh',
        badgeClass:
          'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
        dot: 'bg-teal-500',
      }
    case 'SPEED_LIMIT':
      return {
        label: 'Biển giới hạn tốc độ',
        badgeClass:
          'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
        dot: 'bg-purple-500',
      }
    case 'INFORMATION':
      return {
        label: 'Biển chỉ dẫn',
        badgeClass:
          'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
        dot: 'bg-cyan-500',
      }
    case 'TEMPORARY':
      return {
        label: 'Biển tạm thời',
        badgeClass:
          'bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
        dot: 'bg-orange-500',
      }
    default:
      return {
        label: code || 'Biển báo',
        badgeClass:
          'bg-gray-200 text-gray-900 border-gray-300 dark:bg-white/10 dark:text-white dark:border-white/20',
        dot: 'bg-gray-400',
      }
  }
}


/**
 * Public Traffic Sign Reference Catalog Page (Web Portal).
 * Renders ONLY the exact data structure returned by the NestJS Catalog API without synthetic fields.
 */
export default function CatalogPage() {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation('common')

  const [signs, setSigns] = useState<BackendCatalogSignType[]>([])
  const [categories, setCategories] = useState<BackendSignCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [selectedSign, setSelectedSign] = useState<BackendCatalogSignType | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [showProposalModal, setShowProposalModal] = useState(false)

  const isEnglish = i18n.language.startsWith('en')

  /**
   * Fetch official categories and all signs concurrently from backend API.
   */
  const fetchCatalogData = useCallback(() => {
    setIsLoading(true)
    setErrorMsg(null)

    Promise.all([
      catalogService.getCategories(),
      catalogService.getAllSignTypes(),
    ])
      .then(([cats, signsRes]) => {
        setCategories(cats || [])
        setSigns(signsRes.items || [])
      })
      .catch((err: any) => {
        console.error('[CatalogPage] Failed to fetch catalog data:', err)
        setErrorMsg(err?.message || 'Failed to load catalog data')
        setSigns([])
        setCategories([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchCatalogData()
  }, [fetchCatalogData])

  const getSignPrimaryName = useCallback(
    (sign: BackendCatalogSignType): string => {
      if (isEnglish) return sign.nameEn || sign.nameVi
      return sign.nameVi || sign.nameEn
    },
    [isEnglish]
  )

  const getSignSecondaryName = useCallback(
    (sign: BackendCatalogSignType): string => {
      if (isEnglish) return sign.nameVi || ''
      return sign.nameEn || ''
    },
    [isEnglish]
  )

  // Filter Bar Category options constructed directly from backend categories
  const filterCategories = useMemo(() => {
    const list = [
      {
        id: 'all',
        label: t('catalog.categories.all'),
        count: signs.length,
      },
    ]

    for (const cat of categories) {
      list.push({
        id: String(cat.id),
        label: isEnglish ? cat.nameEn : cat.nameVi,
        count: signs.filter((s) => s.categoryId === cat.id).length,
      })
    }

    return list
  }, [categories, signs, isEnglish, t])

  const filteredSigns = useMemo(() => {
    const list = signs.filter((sign) => {
      // Filter by real backend categoryId
      const matchesCategory =
        selectedCategory === 'all' || sign.categoryId === Number(selectedCategory)

      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        sign.signCode.toLowerCase().includes(q) ||
        (sign.nameVi && sign.nameVi.toLowerCase().includes(q)) ||
        (sign.nameEn && sign.nameEn.toLowerCase().includes(q)) ||
        (sign.description && sign.description.toLowerCase().includes(q))

      return matchesCategory && matchesQuery
    })

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return getSignPrimaryName(a).localeCompare(getSignPrimaryName(b))
      }
      return a.signCode.localeCompare(b.signCode)
    })
  }, [signs, selectedCategory, searchQuery, sortBy, getSignPrimaryName])

  const paginatedSigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSigns.slice(start, start + pageSize)
  }, [filteredSigns, currentPage, pageSize])

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title={t('catalog.title')}
          subtitle={t('catalog.subtitle')}
          bordered
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowProposalModal(true)}
                className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-xs'
                    : 'bg-white border-[#E8E4E3] hover:bg-gray-50 text-gray-900 shadow-xs'
                }`}
              >
                <span>{t('catalog.btn_propose')}</span>
              </button>

              <div
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                    : 'bg-white border-[#E8E4E3] shadow-xs'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SignTrustMap
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                    {filteredSigns.length} / {signs.length}{' '}
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {t('catalog.sign_types_unit')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          }
        />

        {/* Real Dynamic Categories Filter Bar (Pro Single-Row Layout) */}
        <DataFilterBar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q)
            setCurrentPage(1)
          }}
          searchPlaceholder={t('catalog.search_placeholder')}
          categoryFilterMode="select"
          categorySelectLabel={t('catalog.filter_category_label', 'Phân loại')}
          categories={filterCategories.map((c) => ({
            id: c.id,
            label: c.label,
            count: c.count,
          }))}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId)
            setCurrentPage(1)
          }}
          sortOptions={[
            { id: 'code', label: t('catalog.sort_code') },
            { id: 'name', label: t('catalog.sort_name') },
          ]}
          selectedSort={sortBy}
          onSelectSort={(val) => {
            setSortBy(val as 'code' | 'name')
            setCurrentPage(1)
          }}
        />

        {/* Loading State: Skeleton Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border animate-pulse space-y-4 ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="w-16 h-5 rounded-md bg-gray-200 dark:bg-white/10" />
                    <div className="w-24 h-4 rounded-md bg-gray-200 dark:bg-white/10" />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
                </div>
                <div className="w-3/4 h-5 rounded-md bg-gray-200 dark:bg-white/10" />
                <div className="w-1/2 h-4 rounded-md bg-gray-200 dark:bg-white/10" />
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <div className="w-full h-3 rounded bg-gray-200 dark:bg-white/10" />
                  <div className="w-5/6 h-3 rounded bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          /* Error State: Server Connection Issue */
          <div
            className={`py-12 px-6 text-center space-y-3 rounded-2xl border ${
              isDark
                ? 'bg-red-500/10 border-red-500/30 text-white'
                : 'bg-red-50 border-red-200 text-gray-900'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
              <WarningCircle size={32} weight="bold" />
            </div>
            <h3 className="text-base font-extrabold">{t('catalog.load_error_title')}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={fetchCatalogData}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black hover:opacity-90 transition-opacity cursor-pointer shadow-md mt-2"
            >
              <ArrowClockwise size={15} weight="bold" />
              <span>{t('catalog.retry')}</span>
            </button>
          </div>
        ) : filteredSigns.length === 0 ? (
          /* Empty State: No search results */
          <div
            className={`py-16 px-6 text-center space-y-3 rounded-2xl border ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
              <TrafficSignal size={28} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {t('catalog.no_results_title')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              {t('catalog.no_results_desc')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black hover:opacity-90 transition-opacity cursor-pointer inline-block mt-2"
            >
              {t('catalog.reset_search')}
            </button>
          </div>
        ) : (
          /* Success: Real Traffic Signs Grid View */
          <div className="space-y-6">
            <CatalogGridView
              signs={paginatedSigns}
              onSelectSign={setSelectedSign}
              isDark={isDark}
              getCategoryMeta={getCategoryBadgeMeta}
              getSignPrimaryName={getSignPrimaryName}
              getSignSecondaryName={getSignSecondaryName}
            />

            <div
              className={`p-4 sm:px-6 rounded-2xl border ${
                isDark
                  ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                  : 'bg-white border-[#E8E4E3] shadow-xs'
              }`}
            >
              <Pagination
                currentPage={currentPage}
                totalItems={filteredSigns.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[6, 12, 24]}
                itemLabel={t('catalog.unit_signs')}
              />
            </div>
          </div>
        )}

        <CatalogDetailModal
          sign={selectedSign}
          onClose={() => setSelectedSign(null)}
          isDark={isDark}
          getCategoryMeta={getCategoryBadgeMeta}
        />

        <ProposeSignModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          isDark={isDark}
        />
      </div>
    </div>
  )
}
