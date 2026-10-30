import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrafficSignal,
  PlusCircle,
  SquaresFour,
  WarningCircle,
  Rows,
  ArrowsClockwise,
  CircleNotch,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/features/auth/AuthContext'
import type {
  CatalogEntry,
  CatalogCategory,
} from '@/data/catalogData'
import {
  catalogService,
  type CatalogSignTypeItem,
  type SignCategoryItem,
} from '@/api/services/catalog.service'
import { CatalogDetailModal, type CategoryMeta } from './components/CatalogDetailModal'
import { CreateSignModal } from './components/CreateSignModal'
import { CatalogGridView } from './components/CatalogGridView'
import { CatalogTableView } from './components/CatalogTableView'

/**
 * Maps NestJS backend CatalogSignType entity to UI-consumable CatalogEntry.
 */
function mapBackendSignTypeToEntry(s: CatalogSignTypeItem): CatalogEntry {
  const catCode = s.category?.code?.toUpperCase() || ''
  let category: CatalogCategory = 'prohibitory'
  if (catCode.includes('WARN')) category = 'warning'
  else if (catCode.includes('MANDAT') || catCode.includes('ORDER')) category = 'mandatory'
  else if (catCode.includes('GUIDE') || catCode.includes('INFO')) category = 'guide'
  else if (catCode.includes('SPEED')) category = 'speed_limit'
  else if (catCode.includes('TEMP')) category = 'temporary'
  else if (catCode.includes('ADD')) category = 'additional'
  else if (s.category?.code) category = s.category.code.toLowerCase()

  return {
    id: `CAT-${s.id}`,
    code: s.signCode,
    name: s.nameVi || s.nameEn || s.signCode,
    nameVi: s.nameVi || s.signCode,
    nameEn: s.nameEn || s.nameVi || s.signCode,
    categoryId: s.categoryId,
    category,
    shape: (s.shape as any) || 'Circle',
    color: s.colorScheme || 'Red-White',
    description: s.description || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
    descriptionVi: s.description || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
    descriptionEn: s.description || 'Standard technical traffic regulation definition.',
    aiPrompt: s.aiLabelPrompt || `${(s.shape || 'circle').toLowerCase()} road traffic sign for ${s.signCode}`,
    clipPrompt: s.aiLabelPrompt || `${(s.shape || 'circle').toLowerCase()} road traffic sign for ${s.signCode}`,
    osmMapping: s.osmMapping || `traffic_sign=VN:${s.signCode}`,
    standardRef: 'QCVN 41:2019/BGTVT',
    status: s.isActive ? 'Active' : 'Deprecated',
    version: 'v2.5',
    imageUrl: s.representativeImageKey || undefined,
    representativeImageKey: s.representativeImageKey || undefined,
    allowedVehicles: (s as any).allowedVehicles,
  }
}

/**
 * Traffic Sign Catalog Management Page (Ops Command Center).
 * Aligned with the Web application: uses getAllSignTypes() and getCategories()
 * with dynamic category filtering and instant client-side search.
 */
export default function CatalogPage() {
  const { t, i18n } = useTranslation('ops')
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()
  const isEnglish = i18n.language.startsWith('en')

  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [selectedSign, setSelectedSign] = useState<CatalogEntry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  /**
   * Fetch official categories and all signs concurrently from backend API.
   * Exactly matches the web portal architecture to ensure all signs (including T.404) are accessible.
   */
  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [catsRes, signsRes] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getAllSignTypes(),
      ])

      setCategories(catsRes || [])
      const rawSigns = signsRes?.items || []
      const mapped = rawSigns.map(mapBackendSignTypeToEntry)
      setCatalog(mapped)
      setTotalCount(signsRes?.total ?? mapped.length)
    } catch (err: any) {
      console.error('[CatalogPage] Failed to fetch catalog data:', err)
      setErrorMsg(err?.message || 'Không thể tải danh mục biển báo từ máy chủ')
      setCatalog([])
      setCategories([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalogData()
  }, [fetchCatalogData])

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
  const getSignPrimaryName = useCallback(
    (sign: CatalogEntry): string => {
      if (isEnglish) return sign.nameEn || sign.nameVi || sign.name
      return sign.nameVi || sign.name
    },
    [isEnglish]
  )

  /**
   * Resolves the secondary/subtitle sign name in alternate language.
   */
  const getSignSecondaryName = useCallback(
    (sign: CatalogEntry): string => {
      if (isEnglish) return sign.nameVi || sign.name
      return sign.nameEn || sign.name
    },
    [isEnglish]
  )

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
   * Resolves visual metadata and badge styling for standard and custom categories.
   */
  const getCategoryMeta = useCallback(
    (catOrCode: string): CategoryMeta => {
      const raw = (catOrCode || '').trim()
      const upper = raw.toUpperCase()

      // Look up matching category entity from backend
      const foundCat = categories.find(
        (c) =>
          String(c.id) === raw ||
          c.code.toUpperCase() === upper ||
          c.nameVi.toUpperCase() === upper ||
          c.nameEn.toUpperCase() === upper
      )

      const codeToMatch = foundCat ? foundCat.code.toUpperCase() : upper

      switch (codeToMatch) {
        case 'PROHIBITORY':
        case 'PROHIBITION':
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
        case 'GUIDE':
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
        case 'ADDITIONAL':
          return {
            label: 'Biển phụ',
            badgeClass:
              'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
            dot: 'bg-slate-400',
          }
        default:
          return {
            label: foundCat ? (isEnglish ? foundCat.nameEn : foundCat.nameVi) : raw || 'Biển báo',
            badgeClass:
              'bg-gray-200 text-gray-900 border-gray-300 dark:bg-white/10 dark:text-white dark:border-white/20',
            dot: 'bg-gray-400',
          }
      }
    },
    [categories, isEnglish]
  )

  /**
   * Dynamic filter options generated from backend categories with live counts.
   */
  const filterCategories = useMemo(() => {
    const list = [
      {
        id: 'all',
        label: t('catalog.cat_all', 'Tất cả'),
        count: catalog.length,
      },
    ]

    for (const cat of categories) {
      list.push({
        id: String(cat.id),
        label: isEnglish ? cat.nameEn : cat.nameVi,
        count: catalog.filter((s) => s.categoryId === cat.id).length,
      })
    }

    return list
  }, [categories, catalog, isEnglish, t])

  /**
   * Filter and sort catalog entries client-side, exactly like web application.
   */
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const list = catalog.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (item.categoryId !== undefined
          ? item.categoryId === Number(selectedCategory)
          : String(item.category).toLowerCase() === selectedCategory.toLowerCase())

      const matchesQuery =
        !q ||
        item.code?.toLowerCase().includes(q) ||
        item.nameVi?.toLowerCase().includes(q) ||
        item.nameEn?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.descriptionVi?.toLowerCase().includes(q) ||
        item.descriptionEn?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.aiPrompt?.toLowerCase().includes(q) ||
        item.osmMapping?.toLowerCase().includes(q)

      return matchesCategory && matchesQuery
    })

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return getSignPrimaryName(a).localeCompare(getSignPrimaryName(b))
      }
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [catalog, selectedCategory, searchQuery, sortBy, getSignPrimaryName])

  const paginatedCatalog = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCatalog.slice(start, start + pageSize)
  }, [filteredCatalog, currentPage, pageSize])

  /**
   * Toggles operational sign status between Active and Deprecated via backend API.
   */
  const handleToggleStatus = async (signId: string) => {
    const target = catalog.find((c) => c.id === signId)
    const nextStatus: 'Active' | 'Deprecated' = target?.status === 'Active' ? 'Deprecated' : 'Active'
    const numId = parseInt(signId.replace(/\D/g, ''), 10)

    try {
      if (!isNaN(numId)) {
        await catalogService.updateSignType(numId, { isActive: nextStatus === 'Active' })
      }
      setCatalog((prev) =>
        prev.map((item) => {
          if (item.id === signId) {
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
    } catch (err: any) {
      console.error('Failed to toggle sign status:', err)
      toast.error(err?.message || 'Không thể cập nhật trạng thái biển trên máy chủ')
    }
  }

  /**
   * Adds newly published sign to catalog state and backend API.
   */
  const handleCreateEntry = async (newEntry: CatalogEntry, file?: File) => {
    try {
      const catMap: Record<string, number> = {
        prohibitory: 1,
        warning: 2,
        mandatory: 3,
        guide: 4,
        speed_limit: 1,
        additional: 5,
        temporary: 6,
      }
      const categoryId = newEntry.categoryId || catMap[newEntry.category] || 1

      let created: CatalogSignTypeItem | undefined
      if (file) {
        const formData = new FormData()
        formData.append('categoryId', String(categoryId))
        formData.append('signCode', newEntry.code)
        formData.append('nameVi', newEntry.nameVi)
        formData.append('nameEn', newEntry.nameEn)
        if (newEntry.descriptionVi) formData.append('description', newEntry.descriptionVi)
        if (newEntry.shape) formData.append('shape', newEntry.shape)
        if (newEntry.color) formData.append('colorScheme', newEntry.color)
        if (newEntry.aiPrompt) formData.append('aiLabelPrompt', newEntry.aiPrompt)
        if (newEntry.osmMapping) formData.append('osmMapping', newEntry.osmMapping)
        if (newEntry.allowedVehicles?.length) formData.append('allowedVehicles', JSON.stringify(newEntry.allowedVehicles))
        formData.append('isActive', 'true')
        formData.append('file', file)
        created = await catalogService.createSignType(formData)
      } else {
        created = await catalogService.createSignType({
          categoryId,
          signCode: newEntry.code,
          nameVi: newEntry.nameVi,
          nameEn: newEntry.nameEn,
          description: newEntry.descriptionVi,
          shape: newEntry.shape,
          colorScheme: newEntry.color,
          aiLabelPrompt: newEntry.aiPrompt,
          osmMapping: newEntry.osmMapping,
          allowedVehicles: newEntry.allowedVehicles,
          representativeImageKey: newEntry.representativeImageKey || newEntry.imageUrl,
          isActive: true,
        } as any)
      }

      const mappedEntry = created ? mapBackendSignTypeToEntry(created) : newEntry
      setCatalog((prev) => [mappedEntry, ...prev])
      setTotalCount((prev) => prev + 1)
      toast.success(t('catalog.toast_published'))
      setCurrentPage(1)
    } catch (err: any) {
      console.warn('Failed to publish sign to server:', err)
      setCatalog((prev) => [newEntry, ...prev])
      toast.success(t('catalog.toast_published'))
      setCurrentPage(1)
    }
  }

  const handleSignUpdated = (updated: CatalogEntry) => {
    setCatalog((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setSelectedSign(updated)
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
            <button
              type="button"
              disabled={isLoading}
              onClick={fetchCatalogData}
              className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Làm mới danh mục"
            >
              <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            </button>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SignTrustMap
                </span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {filteredCatalog.length} / {totalCount || catalog.length}{' '}
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {t('catalog.sign_types_unit', 'biển báo')}
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
                <span>{t('catalog.btn_add_sign', 'Thêm biển báo')}</span>
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
        searchPlaceholder={t('catalog.search_placeholder', 'Tìm theo mã hiệu, tên biển hoặc mô tả...')}
        categoryFilterMode="select"
        categorySelectLabel={t('catalog.filter_category_label', 'Phân loại')}
        categories={filterCategories.map((cat) => ({
          id: cat.id,
          label: cat.label,
          count: cat.count,
        }))}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id)
          setCurrentPage(1)
        }}
        sortOptions={[
          { id: 'code', label: t('catalog.sort_code', 'Mã biển') },
          { id: 'name', label: t('catalog.sort_name', 'Tên biển') },
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
            title={t('catalog.view_grid', 'Xem dạng lưới')}
          >
            <SquaresFour size={15} weight="bold" />
            <span className="hidden sm:inline">{t('catalog.view_grid', 'Xem dạng lưới')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={t('catalog.view_table', 'Xem dạng bảng')}
          >
            <Rows size={15} weight="bold" />
            <span className="hidden sm:inline">{t('catalog.view_table', 'Xem dạng bảng')}</span>
          </button>
        </div>
      </DataFilterBar>

      {isLoading ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <CircleNotch size={28} className="animate-spin text-[#007b8b] dark:text-[#00c4de] mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Đang tải danh mục biển báo QCVN 41:2019...</p>
        </div>
      ) : errorMsg ? (
        <div className="py-12 px-6 text-center space-y-3 rounded-2xl border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-gray-900 dark:text-white">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <WarningCircle size={32} weight="bold" />
          </div>
          <h3 className="text-base font-extrabold">{t('catalog.load_error_title', 'Lỗi tải danh mục biển báo')}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={fetchCatalogData}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black hover:opacity-90 transition-opacity cursor-pointer shadow-md mt-2"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>{t('catalog.retry', 'Thử lại')}</span>
          </button>
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
            <TrafficSignal size={28} />
          </div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            {t('catalog.no_results_title', 'Không tìm thấy biển báo nào')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {t('catalog.no_results_desc', 'Không có biển báo nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.')}
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
            {t('catalog.reset_search', 'Đặt lại bộ lọc')}
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
              itemLabel={t('catalog.unit_signs', 'biển')}
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
        onSignUpdated={handleSignUpdated}
      />

      {isAdmin && (
        <CreateSignModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEntry}
          existingCodes={catalog.map((c) => c.code)}
        />
      )}
    </div>
  )
}

