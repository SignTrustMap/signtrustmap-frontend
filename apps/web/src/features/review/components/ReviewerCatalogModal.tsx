import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import {
  BookOpen,
  MagnifyingGlass,
  PlusCircle,
  Tag,
  CircleNotch,
} from '@phosphor-icons/react'
import { TrafficSignGraphic, CustomSelect } from '@shared/ui'
import {
  catalogService,
  type BackendCatalogSignType,
  type BackendSignCategory,
} from '@/api/services/catalog.service'
import { mockTrafficCatalog } from '@/data'

export interface ReviewerCatalogModalProps {
  isOpen: boolean
  isDark: boolean
  onClose: () => void
  onSelectSign: (signCode: string, signTypeId?: number, signObj?: BackendCatalogSignType) => void
  onOpenNewSignModal?: () => void
  // Optional backward compatibility props
  catalogSearch?: string
  catalogCat?: string
  filteredCatalog?: any[]
  onSearchChange?: (query: string) => void
  onCategoryChange?: (category: any) => void
}


export function ReviewerCatalogModal({
  isOpen,
  isDark,
  onClose,
  onSelectSign,
  onOpenNewSignModal,
}: ReviewerCatalogModalProps) {
  const { t } = useTranslation('common')

  const [search, setSearch] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<number | 'all'>('all')

  // Live Catalog State from Backend API
  const [signTypes, setSignTypes] = useState<BackendCatalogSignType[]>([])
  const [categories, setCategories] = useState<BackendSignCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Fetch live categories and all sign types when modal is opened
  useEffect(() => {
    if (!isOpen || hasLoaded) return

    let active = true
    setIsLoading(true)

    Promise.all([
      catalogService.getCategories().catch(() => []),
      catalogService.getAllSignTypes().catch(() => ({ items: [], total: 0 })),
    ])
      .then(([cats, signsRes]) => {
        if (!active) return

        if (cats && cats.length > 0) {
          setCategories(cats)
        }

        if (signsRes?.items && signsRes.items.length > 0) {
          setSignTypes(signsRes.items)
        } else {
          // Fallback to mock catalog if API returns empty
          const fallbackSigns: BackendCatalogSignType[] = mockTrafficCatalog.map((s, idx) => ({
            id: Number(s.code.replace(/\D/g, '')) || idx + 100,
            categoryId: 1,
            signCode: s.code,
            nameVi: s.nameVi,
            nameEn: s.nameEn,
            description: s.standardRef,
            shape: s.shape,
            colorScheme: s.color,
            isActive: true,
          }))
          setSignTypes(fallbackSigns)
        }
        setHasLoaded(true)
      })
      .catch((err) => {
        console.warn('[ReviewerCatalogModal] Failed to fetch live catalog, using mock fallback:', err)
        if (active) {
          const fallbackSigns: BackendCatalogSignType[] = mockTrafficCatalog.map((s, idx) => ({
            id: Number(s.code.replace(/\D/g, '')) || idx + 100,
            categoryId: 1,
            signCode: s.code,
            nameVi: s.nameVi,
            nameEn: s.nameEn,
            description: s.standardRef,
            shape: s.shape,
            colorScheme: s.color,
            isActive: true,
          }))
          setSignTypes(fallbackSigns)
          setHasLoaded(true)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, hasLoaded])

  // Memoized category options for CustomSelect dropdown
  // Memoized category options for CustomSelect dropdown (matches CatalogPage without icon dots)
  const categoryOptions = useMemo(() => {
    const allOption = {
      value: 'all',
      label: t('reviewer.catalog_cat_all', 'Tất cả'),
      count: signTypes.length,
    }

    const catOptions = categories.map((cat) => {
      const catCount = signTypes.filter(
        (s) => s.categoryId === cat.id || s.category?.id === cat.id
      ).length

      return {
        value: String(cat.id),
        label: cat.nameVi,
        count: catCount,
      }
    })

    return [allOption, ...catOptions]
  }, [categories, signTypes, t])

  // Filtered Sign Types based on Category and Search Query
  const filteredSigns = useMemo(() => {
    const q = search.trim().toLowerCase()

    return signTypes.filter((sign) => {
      // 1. Category Filter
      if (selectedCatId !== 'all') {
        const matchesCat =
          sign.categoryId === selectedCatId ||
          sign.category?.id === selectedCatId
        if (!matchesCat) return false
      }

      // 2. Search Query Filter
      if (!q) return true

      const matchCode = sign.signCode.toLowerCase().includes(q)
      const matchNameVi = sign.nameVi.toLowerCase().includes(q)
      const matchNameEn = (sign.nameEn || '').toLowerCase().includes(q)
      const matchDesc = (sign.description || '').toLowerCase().includes(q)

      return matchCode || matchNameVi || matchNameEn || matchDesc
    })
  }, [signTypes, selectedCatId, search])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" topSpacing="pt-6 sm:pt-10">
      <div
        className={`w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors ${isDark
            ? 'bg-[#071317] border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-900'
          }`}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
              <BookOpen size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                  {t('reviewer.modal_catalog_title', 'Danh mục Biển báo QCVN 41:2019')}
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {signTypes.length} {t('reviewer.catalog_signs_count', 'biển báo')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t(
                  'reviewer.modal_catalog_subtitle',
                  'Chọn đúng loại biển báo theo quy chuẩn để cập nhật và duyệt ứng viên'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter Toolbar (Pro Single-Row Layout) */}
        <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/30 shrink-0 relative z-20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'reviewer.modal_search_placeholder',
                  'Tìm theo mã hiệu (P.102, W.244...), tên biển báo hoặc từ khóa...'
                )}
                className={`w-full pl-10 pr-9 py-2 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${isDark
                    ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-2 focus:ring-[#00c4de]/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                  }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md cursor-pointer transition-colors"
                  title={t('common.clear', 'Xóa')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown via CustomSelect */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap hidden sm:inline">
                {t('catalog.filter_category_label', 'Phân loại')}:
              </span>
              <CustomSelect
                direction="down"
                align="right"
                size="sm"
                value={String(selectedCatId)}
                onChange={(val) => setSelectedCatId(val === 'all' ? 'all' : Number(val))}
                options={categoryOptions}
                className="w-full sm:w-56 md:w-64 shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Signs Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 p-3 sm:p-4 min-h-[260px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <CircleNotch size={32} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
              <p className="text-xs text-gray-500">
                {t('reviewer.catalog_loading', 'Đang tải toàn bộ danh mục biển báo QCVN 41...')}
              </p>
            </div>
          ) : filteredSigns.length > 0 ? (
            <div className="space-y-1.5">
              {filteredSigns.map((sign) => {
                const categoryName = sign.category?.nameVi || ''

                return (
                  <div
                    key={sign.id}
                    title={`${sign.signCode} - ${sign.nameVi}${categoryName ? ` (${categoryName})` : ''}`}
                    onClick={() => {
                      onSelectSign(sign.signCode, sign.id, sign)
                      onClose()
                    }}
                    className={`py-2 px-3 sm:px-3.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-[#00c4de]/40 shadow-2xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50/80 hover:border-[#007b8b]/40 shadow-2xs'
                    }`}
                  >
                    {/* Left: Sign Visual Graphic & Essential Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Sign Graphic Thumbnail */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg p-1 flex items-center justify-center bg-gray-50 dark:bg-black/40 border border-gray-200/80 dark:border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                        <TrafficSignGraphic
                          sign={{
                            code: sign.signCode,
                            nameVi: sign.nameVi,
                            shape: sign.shape || undefined,
                            color: sign.colorScheme || undefined,
                            imageUrl: sign.representativeImageKey || undefined,
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Code, Name & Category in single cohesive line */}
                      <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 shrink-0">
                          {sign.signCode}
                        </span>
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {sign.nameVi}
                        </h4>
                        {categoryName && (
                          <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shrink-0 hidden sm:inline">
                            {categoryName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Select & Approve Action Button */}
                    <div className="shrink-0 flex items-center">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] group-hover:bg-[#007b8b] group-hover:text-white dark:group-hover:bg-[#00c4de] dark:group-hover:text-black">
                        {t('reviewer.btn_select_approve', 'Chọn mã này')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 mx-auto flex items-center justify-center">
                <Tag size={24} />
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {t('reviewer.catalog_no_match', 'Không tìm thấy biển báo phù hợp')}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {t(
                  'reviewer.catalog_no_match_desc',
                  'Thử tìm với từ khóa khác hoặc gửi đề xuất biển báo mới nếu biển này chưa có trong QCVN 41.'
                )}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSelectedCatId('all')
                  }}
                  className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                >
                  {t('reviewer.catalog_clear_filters', 'Xóa bộ lọc tìm kiếm')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Propose Missing Sign Prompt */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs bg-gray-50/70 dark:bg-white/[0.01] shrink-0">
          <span className="text-gray-500 dark:text-gray-400">
            {t(
              'reviewer.catalog_not_found',
              'Không tìm thấy biển báo cần thiết trong quy chuẩn QCVN 41?'
            )}
          </span>
          {onOpenNewSignModal && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenNewSignModal()
              }}
              className="inline-flex items-center gap-1.5 font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
            >
              <PlusCircle size={15} weight="bold" />
              <span>{t('reviewer.catalog_report_prompt', 'Đề xuất thêm biển mới')}</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ReviewerCatalogModal
