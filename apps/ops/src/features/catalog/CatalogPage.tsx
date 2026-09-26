import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrafficSignal,
  PlusCircle,
  ArrowUpRight,
  Shapes,
  SquaresFour,
  Gauge,
  WarningCircle,
  Compass,
  Rows,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthContext'
import {
  mockCatalogData,
  type CatalogEntry,
} from '@/data/catalogData'
import { CatalogDetailModal } from './components/CatalogDetailModal'
import { CreateSignModal } from './components/CreateSignModal'
import { CatalogGridView } from './components/CatalogGridView'
import { CatalogTableView } from './components/CatalogTableView'

/**
 * Traffic Sign Catalog Management Page (Ops Command Center).
 * Provides full QCVN 41:2019/BGTVT catalog administration, AI prompt inspection,
 * OSM mapping rules, and sign status governance.
 */
export default function CatalogPage() {
  const { t, i18n } = useTranslation('ops')
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()
  const isEnglish = i18n.language.startsWith('en')

  const [catalog, setCatalog] = useState<CatalogEntry[]>(mockCatalogData)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [selectedSign, setSelectedSign] = useState<CatalogEntry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedSign) setSelectedSign(null)
        if (showCreateModal) setShowCreateModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSign, showCreateModal])

  /**
   * Resolves the primary localized sign name based on active locale.
   */
  const getSignPrimaryName = (sign: CatalogEntry): string => {
    if (isEnglish) return sign.nameEn || sign.nameVi || sign.name
    return sign.nameVi || sign.name
  }

  /**
   * Resolves the secondary/subtitle sign name in alternate language.
   */
  const getSignSecondaryName = (sign: CatalogEntry): string => {
    if (isEnglish) return sign.nameVi || sign.name
    return sign.nameEn || sign.name
  }

  /**
   * Resolves primary localized sign description.
   */
  const getSignPrimaryDesc = (sign: CatalogEntry): string => {
    if (isEnglish) return sign.descriptionEn || sign.descriptionVi || sign.description
    return sign.descriptionVi || sign.description
  }

  /**
   * Resolves secondary sign description.
   */
  const getSignSecondaryDesc = (sign: CatalogEntry): string => {
    if (isEnglish) return sign.descriptionVi || sign.description
    return sign.descriptionEn || sign.description
  }

  /**
   * Translates geometric shape into localized label.
   */
  const getShapeLabel = (shape: string): string => {
    switch (shape) {
      case 'Circle':
        return t('catalog.shape_circle')
      case 'Triangle':
        return t('catalog.shape_triangle')
      case 'Rectangle':
        return t('catalog.shape_rectangle')
      case 'Octagon':
        return t('catalog.shape_octagon')
      case 'Diamond':
        return t('catalog.shape_diamond')
      default:
        return shape
    }
  }

  /**
   * Sort hierarchy rank according to QCVN 41:2019 standard prefixes:
   * P (Prohibitory) -> W (Warning) -> R (Mandatory) -> I (Guide) -> S (Additional).
   */
  const getSignPrefixRank = (code: string): number => {
    const prefix = code.charAt(0).toUpperCase()
    if (prefix === 'P') return 1
    if (prefix === 'W') return 2
    if (prefix === 'R') return 3
    if (prefix === 'I') return 4
    if (prefix === 'S') return 5
    return 6
  }

  const categories = [
    {
      id: 'all',
      label: t('catalog.cat_all'),
      icon: TrafficSignal,
      badgeClass: 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/20',
      dot: 'bg-[#007b8b] dark:bg-[#00c4de]',
    },
    {
      id: 'prohibitory',
      label: t('catalog.cat_prohibitory'),
      icon: WarningCircle,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
      dot: 'bg-rose-500',
    },
    {
      id: 'warning',
      label: t('catalog.cat_warning'),
      icon: WarningCircle,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
      dot: 'bg-amber-500',
    },
    {
      id: 'mandatory',
      label: t('catalog.cat_mandatory'),
      icon: ArrowUpRight,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
      dot: 'bg-teal-500',
    },
    {
      id: 'speed_limit',
      label: t('catalog.cat_speed_limit'),
      icon: Gauge,
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
      dot: 'bg-purple-500',
    },
    {
      id: 'guide',
      label: t('catalog.cat_guide'),
      icon: Compass,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
      dot: 'bg-sky-500',
    },
    {
      id: 'additional',
      label: t('catalog.cat_additional'),
      icon: Shapes,
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
      dot: 'bg-slate-400',
    },
  ]

  /**
   * Retrieves visual metadata and badge styling for a given sign category.
   */
  const getCategoryMeta = (cat: string) => {
    const found = categories.find((c) => c.id === cat)
    if (found) return found
    return {
      id: cat,
      label: cat,
      icon: TrafficSignal,
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/20',
      dot: 'bg-gray-400',
    }
  }

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const list = catalog.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category === selectedCategory ||
        (selectedCategory === 'prohibitory' && item.category === ('prohibition' as any)) ||
        (selectedCategory === 'guide' && item.category === ('information' as any))

      const matchesQuery =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.nameVi?.toLowerCase().includes(q) ||
        item.nameEn?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.descriptionVi?.toLowerCase().includes(q) ||
        item.descriptionEn?.toLowerCase().includes(q) ||
        item.aiPrompt?.toLowerCase().includes(q) ||
        item.osmMapping?.toLowerCase().includes(q)

      return matchesCategory && matchesQuery
    })

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return getSignPrimaryName(a).localeCompare(getSignPrimaryName(b))
      }
      const rankA = getSignPrefixRank(a.code)
      const rankB = getSignPrefixRank(b.code)
      if (rankA !== rankB) return rankA - rankB
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [catalog, selectedCategory, searchQuery, sortBy, isEnglish])

  const paginatedCatalog = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCatalog.slice(start, start + pageSize)
  }, [filteredCatalog, currentPage, pageSize])

  /**
   * Toggles operational sign status between Active and Deprecated.
   */
  const handleToggleStatus = (signId: string) => {
    let nextStatus: 'Active' | 'Deprecated' = 'Active'
    setCatalog((prev) =>
      prev.map((item) => {
        if (item.id === signId) {
          nextStatus = item.status === 'Active' ? 'Deprecated' : 'Active'
          return { ...item, status: nextStatus }
        }
        return item
      })
    )
    if (selectedSign && selectedSign.id === signId) {
      setSelectedSign((prev) => (prev ? { ...prev, status: nextStatus } : null))
    }
    const currentCode = selectedSign?.code || signId
    toast.success(t('catalog.toast_status_updated', { code: currentCode, status: nextStatus }))
  }

  /**
   * Adds newly published sign to catalog state.
   */
  const handleCreateEntry = (newEntry: CatalogEntry) => {
    setCatalog((prev) => [newEntry, ...prev])
    toast.success(t('catalog.toast_published'))
    setCurrentPage(1)
  }

  /**
   * Renders color swatch pill for technical specs display.
   */
  const renderColorPill = (color: string) => {
    switch (color) {
      case 'Red-White':
        return (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black/20 dark:border-white/20 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 shrink-0" />
            <span>{t('catalog.colors_red_white')}</span>
          </>
        )
      case 'Yellow-Black':
        return (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black/20 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-gray-600 shrink-0" />
            <span>{t('catalog.colors_yellow_black')}</span>
          </>
        )
      case 'Blue-White':
        return (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-black/20 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 shrink-0" />
            <span>{t('catalog.colors_blue_white')}</span>
          </>
        )
      case 'Green-White':
        return (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-black/20 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 shrink-0" />
            <span>{t('catalog.colors_green_white')}</span>
          </>
        )
      case 'Black-White':
        return (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-gray-600 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 shrink-0" />
            <span>{t('catalog.colors_black_white')}</span>
          </>
        )
      default:
        return <span>{color}</span>
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full text-left">
      <PageHeader
        title={t('catalog.title')}
        actions={
          <>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  QCVN 41:2019
                </span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {filteredCatalog.length} / {catalog.length}{' '}
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {t('catalog.sign_types_unit')}
                  </span>
                </span>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#007b8b] hover:bg-[#00606d] text-white shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <PlusCircle size={17} weight="bold" />
                <span>{t('catalog.btn_add_sign')}</span>
              </button>
            )}
          </>
        }
      />

      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val)
          setCurrentPage(1)
        }}
        searchPlaceholder={t('catalog.search_placeholder')}
        categories={categories.map((cat) => ({
          id: cat.id,
          label: cat.label,
          count: cat.id === 'all' ? catalog.length : catalog.filter((s) => s.category === cat.id).length,
          icon: <span className={`w-2 h-2 rounded-full inline-block ${selectedCategory === cat.id ? 'bg-white' : cat.dot}`} />,
        }))}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id)
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
      >
        <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={t('catalog.view_grid')}
          >
            <SquaresFour size={15} weight="bold" />
            <span className="hidden sm:inline">{t('catalog.view_grid')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={t('catalog.view_table')}
          >
            <Rows size={15} weight="bold" />
            <span className="hidden sm:inline">{t('catalog.view_table')}</span>
          </button>
        </div>
      </DataFilterBar>

      {filteredCatalog.length === 0 ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
            <TrafficSignal size={28} />
          </div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            {t('catalog.no_results_title')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {t('catalog.no_results_desc')}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007b8b] text-white hover:bg-[#00606d] transition-colors cursor-pointer inline-block mt-2"
          >
            {t('catalog.reset_search')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <CatalogGridView
              signs={paginatedCatalog}
              onSelectSign={setSelectedSign}
              getCategoryMeta={getCategoryMeta}
              getSignPrimaryName={getSignPrimaryName}
              getSignSecondaryName={getSignSecondaryName}
              getSignPrimaryDesc={getSignPrimaryDesc}
              getShapeLabel={getShapeLabel}
              renderColorPill={renderColorPill}
            />
          ) : (
            <CatalogTableView
              signs={paginatedCatalog}
              onSelectSign={setSelectedSign}
              getCategoryMeta={getCategoryMeta}
              getSignPrimaryName={getSignPrimaryName}
              getSignSecondaryName={getSignSecondaryName}
            />
          )}

          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:px-6 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCatalog.length}
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
        onToggleStatus={handleToggleStatus}
        getCategoryMeta={getCategoryMeta}
        getSignPrimaryName={getSignPrimaryName}
        getSignSecondaryName={getSignSecondaryName}
        getSignPrimaryDesc={getSignPrimaryDesc}
        getSignSecondaryDesc={getSignSecondaryDesc}
        getShapeLabel={getShapeLabel}
        renderColorPill={renderColorPill}
      />

      {isAdmin && (
        <CreateSignModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEntry}
        />
      )}
    </div>
  )
}
