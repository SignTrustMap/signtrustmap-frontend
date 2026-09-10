import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrafficSignal,
  PlusCircle,
  Sparkle,
  Copy,
  Check,
  X,
  Shapes,
  Palette,
  SquaresFour,
  Info,
  ArrowUpRight,
  Gauge,
  WarningCircle,
  Compass,
  Rows,
  BookOpen,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import CustomSelect from '@/components/common/CustomSelect'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { ModalPortal } from '@/components/common/ModalPortal'
import PageHeader from '@/components/common/PageHeader'
import {
  mockCatalogData,
  type CatalogEntry,
  type CatalogCategory,
} from '@/data/catalogData'
import { TrafficSignGraphic } from './components/TrafficSignGraphic'

export default function CatalogPage() {
  const { t, i18n } = useTranslation('ops')
  const toast = useToast()
  const isEnglish = i18n.language.startsWith('en')

  // Catalog State
  const [catalog, setCatalog] = useState<CatalogEntry[]>(mockCatalogData)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // Inspection Modal State
  const [selectedSign, setSelectedSign] = useState<CatalogEntry | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedOsm, setCopiedOsm] = useState(false)

  // Create Sign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [newShape, setNewShape] = useState<'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'>('Circle')
  const [newColor, setNewColor] = useState('Red-White')
  const [newDescriptionVi, setNewDescriptionVi] = useState('')
  const [newDescriptionEn, setNewDescriptionEn] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')

  // Handle Escape key to close modals
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

  // Helpers for bilingual naming
  const getSignPrimaryName = (sign: CatalogEntry) => {
    if (isEnglish) return sign.nameEn || sign.nameVi || sign.name
    return sign.nameVi || sign.name
  }

  const getSignSecondaryName = (sign: CatalogEntry) => {
    if (isEnglish) return sign.nameVi || sign.name
    return sign.nameEn || sign.name
  }

  const getSignPrimaryDesc = (sign: CatalogEntry) => {
    if (isEnglish) return sign.descriptionEn || sign.descriptionVi || sign.description
    return sign.descriptionVi || sign.description
  }

  const getSignSecondaryDesc = (sign: CatalogEntry) => {
    if (isEnglish) return sign.descriptionVi || sign.description
    return sign.descriptionEn || sign.description
  }

  const getShapeLabel = (shape: string) => {
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

  const getSignPrefixRank = (code: string) => {
    const prefix = code.charAt(0).toUpperCase()
    if (prefix === 'P') return 1 // Biển Cấm
    if (prefix === 'W') return 2 // Biển Cảnh báo & Nguy hiểm
    if (prefix === 'R') return 3 // Biển Hiệu lệnh
    if (prefix === 'I') return 4 // Biển Chỉ dẫn
    if (prefix === 'S') return 5 // Biển Phụ
    return 6
  }

  // Category Configuration
  const categories: {
    id: string
    label: string
    icon: typeof TrafficSignal
    badgeClass: string
    dot: string
  }[] = [
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

  // Filtered and sorted dataset
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

  // Paginated dataset
  const paginatedCatalog = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCatalog.slice(start, start + pageSize)
  }, [filteredCatalog, currentPage, pageSize])

  // Copy AI CLIP Prompt
  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    toast.success(t('catalog.copied'))
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  // Copy OSM Mapping
  const handleCopyOsm = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedOsm(true)
    toast.success(t('catalog.toast_copied_osm'))
    setTimeout(() => setCopiedOsm(false), 2000)
  }

  // Toggle Active / Deprecated status
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

  // Create new sign submission
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const newEntry: CatalogEntry = {
      id: `CAT-${newCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`,
      code: newCode.trim(),
      name: newNameVi.trim() || newNameEn.trim(),
      nameVi: newNameVi.trim() || newCode.trim(),
      nameEn: newNameEn.trim() || newNameVi.trim(),
      category: newCategory,
      shape: newShape,
      color: newColor,
      description: newDescriptionVi.trim() || 'Standard road sign regulation definition',
      descriptionVi: newDescriptionVi.trim() || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionEn: newDescriptionEn.trim() || 'Standard technical traffic regulation definition.',
      aiPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      clipPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      osmMapping: newOsmMapping.trim() || `traffic_sign=VN:${newCode}`,
      standardRef: 'QCVN 41:2019/BGTVT',
      status: 'Active',
      version: 'v2.5',
    }

    setCatalog((prev) => [newEntry, ...prev])
    setShowCreateModal(false)
    toast.success(t('catalog.toast_published'))

    // Reset Form
    setNewCode('')
    setNewNameVi('')
    setNewNameEn('')
    setNewDescriptionVi('')
    setNewDescriptionEn('')
    setNewAiPrompt('')
    setNewOsmMapping('')
    setCurrentPage(1)
  }

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
      {/* ─── Header: Standard Badge, Title, Metrics, Quick Actions ───────── */}
      <PageHeader
        title={t('catalog.title')}
        actions={
          <>
            {/* Sign Count Badge */}
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

            {/* Add New Sign Button */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#007b8b] hover:bg-[#00606d] text-white shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <PlusCircle size={17} weight="bold" />
              <span>{t('catalog.btn_add_sign')}</span>
            </button>
          </>
        }
      />

      {/* ─── Toolbar: Unified DataFilterBar ──────────────────────────────── */}
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
        {/* View Mode Switcher (Grid vs Table) */}
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

      {/* ─── Empty State ─────────────────────────────────────────────────── */}
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
      ) : viewMode === 'grid' ? (
        /* ─── Grid View: Rich Visual Traffic Sign Cards ─────────────────── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedCatalog.map((sign) => {
              const meta = getCategoryMeta(sign.category)
              const isActive = sign.status === 'Active'

              return (
                <div
                  key={sign.id || sign.code}
                  onClick={() => setSelectedSign(sign)}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] hover:border-[#007b8b] dark:hover:border-[#00c4de] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* Card Top: Code Pill, Category Dot, and SVG Graphic Plate */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-col gap-1.5">
                        <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border w-fit ${meta.badgeClass}`}>
                          {sign.code}
                        </span>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>

                      {/* Vector Traffic Sign Graphic Plate */}
                      <div className="w-16 h-16 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                        <TrafficSignGraphic sign={sign} className="w-full h-full drop-shadow-xs" />
                      </div>
                    </div>

                    {/* Sign Names */}
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors line-clamp-1">
                      {getSignPrimaryName(sign)}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {getSignSecondaryName(sign)}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                      {getSignPrimaryDesc(sign)}
                    </p>

                    {/* Quick Specs Chips */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                        {getShapeLabel(sign.shape)}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 flex items-center gap-1.5">
                        {renderColorPill(sign.color)}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                        {sign.version || 'v2.5'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {isActive ? t('catalog.status_active') : t('catalog.status_deprecated')}
                      </span>
                    </div>
                    <span className="text-[#007b8b] dark:text-[#00c4de] font-bold flex items-center gap-1 group-hover:underline">
                      <Info size={15} weight="bold" />
                      <span>{t('catalog.inspect')}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Shared Pagination */}
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
      ) : (
        /* ─── Table View: Data-Dense Operations Table ───────────────────── */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-center w-16">{t('catalog.th_preview')}</th>
                    <th className="py-3 px-4 font-semibold">{t('catalog.th_code_name')}</th>
                    <th className="py-3 px-4 font-semibold">{t('catalog.th_category')}</th>
                    <th className="py-3 px-4 font-semibold">{t('catalog.th_ai_prompt')}</th>
                    <th className="py-3 px-4 font-semibold">{t('catalog.th_osm_mapping')}</th>
                    <th className="py-3 px-4 font-semibold">{t('catalog.th_version')}</th>
                    <th className="py-3 px-4 font-semibold text-center">{t('catalog.th_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedCatalog.map((item) => {
                    const meta = getCategoryMeta(item.category)
                    const isActive = item.status === 'Active'

                    return (
                      <tr
                        key={item.id || item.code}
                        onClick={() => setSelectedSign(item)}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="w-10 h-10 p-1 mx-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] flex items-center justify-center">
                            <TrafficSignGraphic sign={item} className="w-full h-full drop-shadow-xs" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                              {item.code}
                            </span>
                            <p className="font-bold text-gray-900 dark:text-white mt-1">
                              {getSignPrimaryName(item)}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {getSignSecondaryName(item)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-gray-600 dark:text-gray-300">
                          {item.aiPrompt || item.clipPrompt}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#007b8b] dark:text-[#00c4de]">
                          {item.osmMapping}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-400">{item.version || 'v2.5'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {isActive ? t('catalog.status_active') : t('catalog.status_deprecated')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shared Pagination */}
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

      {/* ─── Sign Detail Inspection Modal (QCVN 41:2019 Specs) ─────────────── */}
      {selectedSign && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedSign(null)}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedSign(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X size={18} weight="bold" />
            </button>

            {/* Modal Header: Sign Plate + Titles + Categories */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-gray-200 dark:border-white/10 pr-8 sm:pr-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl p-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] flex items-center justify-center shadow-xs">
                <TrafficSignGraphic sign={selectedSign} className="w-full h-full drop-shadow-md" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md border ${getCategoryMeta(selectedSign.category).badgeClass}`}>
                    {selectedSign.code}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${getCategoryMeta(selectedSign.category).badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getCategoryMeta(selectedSign.category).dot}`} />
                    {getCategoryMeta(selectedSign.category).label}
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                    {selectedSign.standardRef || 'QCVN 41:2019/BGTVT'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
                  {getSignPrimaryName(selectedSign)}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                  {getSignSecondaryName(selectedSign)}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Description & Meaning */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  <BookOpen size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                  <span>{t('catalog.desc_and_meaning')}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                  {getSignPrimaryDesc(selectedSign)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-white/10 italic leading-relaxed">
                  {getSignSecondaryDesc(selectedSign)}
                </p>
              </div>

              {/* AI CLIP Visual Prompt Vector */}
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-mono font-extrabold uppercase tracking-wider">
                    <Sparkle size={16} className="text-amber-600 dark:text-amber-400" weight="fill" />
                    <span>{t('catalog.clip_vector')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(selectedSign.aiPrompt || selectedSign.clipPrompt || '')}
                    className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check size={14} className="text-emerald-500" weight="bold" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t('catalog.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} weight="bold" />
                        <span>{t('catalog.copy_prompt')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-black/40 text-amber-950 dark:text-amber-200 font-mono text-xs leading-relaxed select-all break-words shadow-xs">
                  "{selectedSign.aiPrompt || selectedSign.clipPrompt}"
                </div>

                <p className="text-[11px] text-amber-900 dark:text-amber-300/80 font-medium">
                  💡 {t('catalog.clip_hint')}
                </p>
              </div>

              {/* OSM Mapping Rule */}
              <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-500/10 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-300 font-mono font-extrabold uppercase tracking-wider">
                    <Compass size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                    <span>{t('catalog.osm_title')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyOsm(selectedSign.osmMapping || '')}
                    className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-cyan-300 dark:border-cyan-500/40 bg-white dark:bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedOsm ? (
                      <>
                        <Check size={14} className="text-emerald-500" weight="bold" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t('catalog.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} weight="bold" />
                        <span>{t('catalog.copy_osm')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20 bg-white dark:bg-black/40 text-cyan-950 dark:text-cyan-200 font-mono text-xs leading-relaxed select-all break-words shadow-xs">
                  {selectedSign.osmMapping}
                </div>
              </div>

              {/* 4 Technical Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                    <Shapes size={14} weight="bold" />
                    <span>{t('catalog.geometry')}</span>
                  </div>
                  <div className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                    {getShapeLabel(selectedSign.shape)}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                    <Palette size={14} weight="bold" />
                    <span>{t('catalog.colors')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-gray-900 dark:text-white mt-0.5">
                    {renderColorPill(selectedSign.color)}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                    <SquaresFour size={14} weight="bold" />
                    <span>{t('catalog.category_lbl')}</span>
                  </div>
                  <div className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                    {getCategoryMeta(selectedSign.category).label}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                    <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">v</span>
                    <span>{t('catalog.version_lbl')}</span>
                  </div>
                  <div className="font-extrabold text-xs font-mono text-gray-900 dark:text-white truncate">
                    {selectedSign.version || 'v2.5'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedSign.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSign.status === 'Active'
                    ? 'border-amber-300 text-amber-800 dark:border-amber-500/30 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                    : 'border-emerald-300 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                }`}
              >
                <span>{t('catalog.btn_toggle_status')}</span>
                <span className="font-mono">({selectedSign.status})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSign(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white shadow-xs transition-colors cursor-pointer"
              >
                {t('users.btn_close')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── Add Sign Modal ("Thêm Biển Báo Mới") ─────────────────────────── */}
      {showCreateModal && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setShowCreateModal(false)}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200 text-left"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                {t('catalog.modal_title')}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_code')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P.106a"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_category')} *
                  </label>
                  <CustomSelect
                    value={newCategory}
                    onChange={(val) => setNewCategory(val as CatalogCategory)}
                    className="w-full"
                    buttonClassName="w-full"
                    options={[
                      { value: 'prohibitory', label: t('catalog.cat_prohibitory') },
                      { value: 'warning', label: t('catalog.cat_warning') },
                      { value: 'mandatory', label: t('catalog.cat_mandatory') },
                      { value: 'speed_limit', label: t('catalog.cat_speed_limit') },
                      { value: 'guide', label: t('catalog.cat_guide') },
                      { value: 'additional', label: t('catalog.cat_additional') },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('catalog.field_name_placeholder')}
                    value={newNameVi}
                    onChange={(e) => setNewNameVi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_name_en')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('catalog.field_name_en_placeholder')}
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_shape')}
                  </label>
                  <CustomSelect
                    value={newShape}
                    onChange={(val) => setNewShape(val as any)}
                    className="w-full"
                    buttonClassName="w-full"
                    options={[
                      { value: 'Circle', label: t('catalog.shape_circle') },
                      { value: 'Triangle', label: t('catalog.shape_triangle') },
                      { value: 'Rectangle', label: t('catalog.shape_rectangle') },
                      { value: 'Octagon', label: t('catalog.shape_octagon') },
                      { value: 'Diamond', label: t('catalog.shape_diamond') },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_color')}
                  </label>
                  <CustomSelect
                    value={newColor}
                    onChange={(val) => setNewColor(val)}
                    className="w-full"
                    buttonClassName="w-full"
                    options={[
                      { value: 'Red-White', label: t('catalog.colors_red_white') },
                      { value: 'Yellow-Black', label: t('catalog.colors_yellow_black') },
                      { value: 'Blue-White', label: t('catalog.colors_blue_white') },
                      { value: 'Green-White', label: t('catalog.colors_green_white') },
                      { value: 'Black-White', label: t('catalog.colors_black_white') },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_ai_prompt')}
                </label>
                <textarea
                  rows={2}
                  placeholder="a circular red traffic sign with a black truck silhouette indicating no trucks"
                  value={newAiPrompt}
                  onChange={(e) => setNewAiPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_osm_mapping')}
                </label>
                <input
                  type="text"
                  placeholder="hgv=no; traffic_sign=VN:P.106a"
                  value={newOsmMapping}
                  onChange={(e) => setNewOsmMapping(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  {t('catalog.btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {t('catalog.btn_publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
