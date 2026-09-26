import { useState, useMemo, useCallback } from 'react'
import {
  TrafficSignal,
  WarningCircle,
  ArrowUpRight,
  Gauge,
  Compass,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { mockTrafficCatalog, type TrafficCatalogSign } from '@/data'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { CatalogDetailModal } from './components/CatalogDetailModal'
import { ProposeSignModal } from './components/ProposeSignModal'
import { CatalogGridView } from './components/CatalogGridView'

/**
 * Public Traffic Sign Reference Catalog Page (Web Portal).
 * Allows community drivers and surveyors to look up Vietnamese traffic signs,
 * inspect visual definitions, and propose missing signs.
 */
export default function CatalogPage() {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation('common')

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [selectedSign, setSelectedSign] = useState<TrafficCatalogSign | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [showProposalModal, setShowProposalModal] = useState(false)

  const isEnglish = i18n.language.startsWith('en')

  /**
   * Resolves the primary localized sign name based on active locale.
   */
  const getSignPrimaryName = useCallback((sign: TrafficCatalogSign): string => {
    if (isEnglish) return sign.nameEn
    return sign.nameVi
  }, [isEnglish])

  /**
   * Resolves the secondary/subtitle sign name in alternate language.
   */
  const getSignSecondaryName = (sign: TrafficCatalogSign): string => {
    if (isEnglish) return sign.nameVi
    return sign.nameEn
  }

  /**
   * Resolves primary localized sign description.
   */
  const getSignPrimaryDesc = (sign: TrafficCatalogSign): string => {
    if (isEnglish) return sign.descriptionEn
    return sign.descriptionVi
  }

  /**
   * Resolves secondary sign description.
   */
  const getSignSecondaryDesc = (sign: TrafficCatalogSign): string => {
    if (isEnglish) return sign.descriptionVi
    return sign.descriptionEn
  }

  const categories = [
    {
      id: 'all',
      label: t('catalog.categories.all'),
      icon: TrafficSignal,
    },
    {
      id: 'prohibitory',
      label: t('catalog.categories.prohibitory'),
      icon: WarningCircle,
      badgeClass:
        'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
      dot: 'bg-red-500',
    },
    {
      id: 'warning',
      label: t('catalog.categories.warning'),
      icon: WarningCircle,
      badgeClass:
        'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      dot: 'bg-amber-500',
    },
    {
      id: 'mandatory',
      label: t('catalog.categories.mandatory'),
      icon: ArrowUpRight,
      badgeClass:
        'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
      dot: 'bg-teal-500',
    },
    {
      id: 'speed_limit',
      label: t('catalog.categories.speed_limit'),
      icon: Gauge,
      badgeClass:
        'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      dot: 'bg-purple-500',
    },
    {
      id: 'guide',
      label: t('catalog.categories.guide'),
      icon: Compass,
      badgeClass:
        'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
      dot: 'bg-cyan-500',
    },
  ]

  /**
   * Retrieves visual metadata and badge styling for a given sign category.
   */
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'prohibitory':
        return {
          label: t('catalog.categories.prohibitory'),
          badgeClass:
            'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
          dot: 'bg-red-500',
        }
      case 'warning':
        return {
          label: t('catalog.categories.warning'),
          badgeClass:
            'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
          dot: 'bg-amber-500',
        }
      case 'mandatory':
        return {
          label: t('catalog.categories.mandatory'),
          badgeClass:
            'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
          dot: 'bg-teal-500',
        }
      case 'speed_limit':
        return {
          label: t('catalog.categories.speed_limit'),
          badgeClass:
            'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
          dot: 'bg-purple-500',
        }
      case 'guide':
        return {
          label: t('catalog.categories.guide'),
          badgeClass:
            'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
          dot: 'bg-cyan-500',
        }
      default:
        return {
          label: cat,
          badgeClass:
            'bg-gray-200 text-gray-900 border-gray-300 dark:bg-white/10 dark:text-white dark:border-white/20',
          dot: 'bg-gray-400',
        }
    }
  }

  const filteredSigns = useMemo(() => {
    const list = mockTrafficCatalog.filter((sign) => {
      const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        sign.code.toLowerCase().includes(q) ||
        sign.nameVi.toLowerCase().includes(q) ||
        sign.nameEn.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return getSignPrimaryName(a).localeCompare(getSignPrimaryName(b))
      }
      return a.code.localeCompare(b.code)
    })
  }, [selectedCategory, searchQuery, sortBy, getSignPrimaryName])

  const paginatedSigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSigns.slice(start, start + pageSize)
  }, [filteredSigns, currentPage, pageSize])

  /**
   * Renders color swatch indicator dots for technical specs grid.
   */
  const renderColorDots = (color: string) => {
    switch (color) {
      case 'Red-White':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-black/20 dark:border-white/20 shrink-0 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-white border border-gray-400 shrink-0 shadow-xs" />
            <span>{t('catalog.colors_red_white')}</span>
          </span>
        )
      case 'Yellow-Black':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-black/20 shrink-0 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-zinc-900 border border-gray-600 shrink-0 shadow-xs" />
            <span>{t('catalog.colors_yellow_black')}</span>
          </span>
        )
      case 'Blue-White':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-black/20 dark:border-white/20 shrink-0 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-white border border-gray-400 shrink-0 shadow-xs" />
            <span>{t('catalog.colors_blue_white')}</span>
          </span>
        )
      case 'Green-White':
        return (
          <span className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-black/20 dark:border-white/20 shrink-0 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-white border border-gray-400 shrink-0 shadow-xs" />
            <span>{t('catalog.colors_green_white')}</span>
          </span>
        )
      default:
        return <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{t('catalog.colors_other')}</span>
    }
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
      default:
        return shape
    }
  }

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10 text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('catalog.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('catalog.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
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
                  QCVN 41:2019
                </span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {filteredSigns.length} / {mockTrafficCatalog.length}{' '}
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('catalog.sign_types_unit')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 sm:p-5 text-left transition-colors ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          <DataFilterBar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q)
              setCurrentPage(1)
            }}
            searchPlaceholder={t('catalog.search_placeholder')}
            categories={categories.map((c) => ({
              id: c.id,
              label: c.label,
              icon: <c.icon size={14} weight="bold" />,
              count:
                c.id === 'all'
                  ? mockTrafficCatalog.length
                  : mockTrafficCatalog.filter((s) => s.category === c.id).length,
            }))}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat)
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
        </div>

        {filteredSigns.length === 0 ? (
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
          <div className="space-y-6">
            <CatalogGridView
              signs={paginatedSigns}
              onSelectSign={setSelectedSign}
              isDark={isDark}
              getCategoryMeta={getCategoryMeta}
              getSignPrimaryName={getSignPrimaryName}
              getSignSecondaryName={getSignSecondaryName}
              getSignPrimaryDesc={getSignPrimaryDesc}
            />

            <div
              className={`p-4 sm:px-6 rounded-2xl border ${
                isDark ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40' : 'bg-white border-[#E8E4E3] shadow-xs'
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
          getCategoryMeta={getCategoryMeta}
          getSignPrimaryName={getSignPrimaryName}
          getSignSecondaryName={getSignSecondaryName}
          getSignPrimaryDesc={getSignPrimaryDesc}
          getSignSecondaryDesc={getSignSecondaryDesc}
          getShapeLabel={getShapeLabel}
          renderColorDots={renderColorDots}
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
