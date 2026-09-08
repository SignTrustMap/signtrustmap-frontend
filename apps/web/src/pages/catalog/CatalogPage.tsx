import { useState, useMemo } from 'react'
import {
  Plus,
  Info,
  Sparkle,
  CheckCircle,
  TrafficSignal,
  WarningCircle,
  ArrowUpRight,
  Gauge,
  Compass,
  X,
  Copy,
  BookOpen,
  Certificate,
  Shapes,
  Palette,
  SquaresFour,
  Check,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { mockTrafficCatalog, type TrafficCatalogSign } from '@/data'
import { Modal } from '@/components/common/Modal'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { TrafficSignGraphic } from '@/components/catalog/TrafficSignGraphic'

export default function CatalogPage() {
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation('common')
  const toast = useToast()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'code' | 'name'>('code')
  const [selectedSign, setSelectedSign] = useState<TrafficCatalogSign | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalTempName, setProposalTempName] = useState('')
  const [proposalDesc, setProposalDesc] = useState('')
  const [proposalSuccess, setProposalSuccess] = useState(false)

  const isEnglish = i18n.language.startsWith('en')

  const getSignPrimaryName = (sign: TrafficCatalogSign) => {
    if (isEnglish) {
      return sign.nameEn
    }
    return sign.nameVi
  }

  const getSignSecondaryName = (sign: TrafficCatalogSign) => {
    if (isEnglish) {
      return sign.nameVi
    }
    return sign.nameEn
  }

  const getSignPrimaryDesc = (sign: TrafficCatalogSign) => {
    if (isEnglish) {
      return sign.descriptionEn
    }
    return sign.descriptionVi
  }

  const getSignSecondaryDesc = (sign: TrafficCatalogSign) => {
    if (isEnglish) {
      return sign.descriptionVi
    }
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
  }, [selectedCategory, searchQuery, sortBy, isEnglish])

  const paginatedSigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSigns.slice(start, start + pageSize)
  }, [filteredSigns, currentPage, pageSize])

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    toast.success(t('catalog.copied'))
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleProposeSign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalTempName.trim()) return
    setProposalSuccess(true)
    toast.success(t('catalog.proposal_success_title'), t('catalog.proposal_success_desc'))
    setTimeout(() => {
      setProposalSuccess(false)
      setShowProposalModal(false)
      setProposalTempName('')
      setProposalDesc('')
    }, 1500)
  }

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
        {/* ─── Page Header (Strictly styled like ProfilePage.tsx) ───────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isDark
                    ? 'bg-[#007b8b]/20 border-[#00c4de]/30 text-[#00c4de]'
                    : 'bg-teal-50 border-teal-200 text-[#007b8b]'
                }`}
              >
                <TrafficSignal size={14} weight="bold" />
                <span>{t('catalog.badge_standard')}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('catalog.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('catalog.subtitle')}
            </p>
          </div>

          {/* Quick Metrics & Propose Button */}
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

            <button
              type="button"
              onClick={() => setShowProposalModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
              }`}
            >
              <Plus size={16} weight="bold" />
              <span>{t('catalog.btn_propose')}</span>
            </button>
          </div>
        </div>

        {/* ─── Search & Category Filter Toolbar ────────────────────────── */}
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

        {/* ─── Catalog Signs Grid ─────────────────────────────────────── */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {paginatedSigns.map((sign) => {
                const meta = getCategoryMeta(sign.category)

                return (
                  <div
                    key={sign.code}
                    onClick={() => setSelectedSign(sign)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 duration-200 ${
                      isDark
                        ? 'bg-[#071317] border-white/10 hover:border-[#00c4de] hover:shadow-lg hover:shadow-[#00c4de]/5'
                        : 'bg-white border-[#E8E4E3] hover:border-[#007b8b] hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Row: Code Badge, Category Pill & Graphic */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex flex-col gap-1.5 text-left">
                          <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md border w-fit ${meta.badgeClass}`}>
                            {sign.code}
                          </span>
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </div>

                        {/* Visual Sign Graphic */}
                        <div
                          className={`w-14 h-14 p-1.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                            isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200 shadow-xs'
                          }`}
                        >
                          <TrafficSignGraphic sign={sign} className="w-full h-full drop-shadow-sm" />
                        </div>
                      </div>

                      {/* Sign Names */}
                      <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white transition-colors group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] line-clamp-1">
                        {getSignPrimaryName(sign)}
                      </h3>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {getSignSecondaryName(sign)}
                      </p>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                        {getSignPrimaryDesc(sign)}
                      </p>
                    </div>

                    {/* Card Bottom Meta */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                        QCVN 41:2019
                      </span>
                      <span className="text-[#007b8b] dark:text-[#00c4de] font-bold flex items-center gap-1 group-hover:underline">
                        <Info size={15} weight="bold" />
                        <span>{t('catalog.inspect')}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ─── Shared Pagination ──────────────────────────────────── */}
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

        {/* ─── Selected Sign Detail Modal ─────────────────────────────── */}
        {selectedSign && (
          <Modal
            isOpen={!!selectedSign}
            onClose={() => setSelectedSign(null)}
            maxWidth="max-w-2xl"
          >
            <div
              className={`w-full rounded-2xl border p-6 sm:p-7 relative overflow-hidden transition-all text-left ${
                isDark
                  ? 'bg-[#071317] border-white/15 text-white shadow-2xl shadow-black/80'
                  : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
              }`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedSign(null)}
                aria-label={t('catalog.btn_close')}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer z-10 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                }`}
              >
                <X size={18} weight="bold" />
              </button>

              {/* Header with Visual Sign Plate & Titles */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-white/10">
                {/* Traffic Sign Plate container */}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl flex items-center justify-center p-2 border shadow-inner ${
                    isDark
                      ? 'bg-black/40 border-white/10 shadow-black/50'
                      : 'bg-gray-50 border-gray-200 shadow-gray-200/50'
                  }`}
                >
                  <TrafficSignGraphic sign={selectedSign} className="w-full h-full drop-shadow-md" />
                </div>

                {/* Sign Details Header */}
                <div className="flex-1 pr-6 sm:pr-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md border ${
                        getCategoryMeta(selectedSign.category).badgeClass
                      }`}
                    >
                      {selectedSign.code}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${
                        getCategoryMeta(selectedSign.category).badgeClass
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getCategoryMeta(selectedSign.category).dot}`} />
                      {getCategoryMeta(selectedSign.category).label}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
                    {getSignPrimaryName(selectedSign)}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                    {getSignSecondaryName(selectedSign)}
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                {/* Description & Meaning */}
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    <BookOpen size={16} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} weight="bold" />
                    <span>{t('catalog.desc_and_meaning')}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-medium">
                    {getSignPrimaryDesc(selectedSign)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-white/10 italic leading-relaxed">
                    {getSignSecondaryDesc(selectedSign)}
                  </p>
                </div>

                {/* AI CLIP Visual Prompt Vector */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50/90 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkle size={16} className="text-amber-600 dark:text-amber-400" weight="fill" />
                      <span
                        className={`text-xs font-mono font-extrabold uppercase tracking-wider ${
                          isDark ? 'text-amber-300' : 'text-amber-950'
                        }`}
                      >
                        {t('catalog.clip_vector')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(selectedSign.clipPrompt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isDark
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                          : 'bg-white hover:bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                      }`}
                    >
                      {copiedPrompt ? (
                        <>
                          <Check size={14} className="text-emerald-500" weight="bold" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {t('catalog.copied')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} weight="bold" />
                          <span>{t('catalog.copy_prompt')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border font-mono text-xs leading-relaxed select-all break-words ${
                      isDark
                        ? 'bg-black/40 border-amber-500/20 text-amber-200'
                        : 'bg-white border-amber-200 text-amber-950 shadow-xs'
                    }`}
                  >
                    "{selectedSign.clipPrompt}"
                  </div>

                  <p
                    className={`text-[11px] mt-1.5 font-semibold ${
                      isDark ? 'text-amber-300/80' : 'text-amber-900'
                    }`}
                  >
                    💡 {t('catalog.clip_hint')}
                  </p>
                </div>

                {/* Specs 4-card grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Geometry */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                      <Shapes size={14} weight="bold" />
                      <span>{t('catalog.geometry')}</span>
                    </div>
                    <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {getShapeLabel(selectedSign.shape)}
                    </div>
                  </div>

                  {/* Colors */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                      <Palette size={14} weight="bold" />
                      <span>{t('catalog.colors')}</span>
                    </div>
                    <div>{renderColorDots(selectedSign.color)}</div>
                  </div>

                  {/* Category */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                      <SquaresFour size={14} weight="bold" />
                      <span>{t('catalog.category_lbl')}</span>
                    </div>
                    <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {getCategoryMeta(selectedSign.category).label}
                    </div>
                  </div>

                  {/* Standard Ref */}
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                      <Certificate size={14} weight="bold" />
                      <span>{t('catalog.standard_ref')}</span>
                    </div>
                    <div
                      className="font-mono font-bold text-xs text-gray-900 dark:text-white truncate"
                      title={selectedSign.standardRef}
                    >
                      {selectedSign.standardRef.split(' - ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* ─── Proposal Modal ─────────────────────────────────────────── */}
        {showProposalModal && (
          <Modal
            isOpen={showProposalModal}
            onClose={() => setShowProposalModal(false)}
            maxWidth="max-w-lg"
          >
            <div
              className={`w-full rounded-2xl border p-6 sm:p-7 text-left ${
                isDark
                  ? 'bg-[#071317] border-white/15 text-white shadow-2xl shadow-black/80'
                  : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
              }`}
            >
              {proposalSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle size={32} weight="bold" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {t('catalog.proposal_success_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                    {t('catalog.proposal_success_desc')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleProposeSign} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                      {t('catalog.propose_title')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? 'text-gray-400 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t('catalog.propose_name_lbl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalTempName}
                      onChange={(e) => setProposalTempName(e.target.value)}
                      placeholder={t('catalog.propose_name_ph')}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                        isDark
                          ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t('catalog.propose_desc_lbl')}
                    </label>
                    <textarea
                      rows={3}
                      value={proposalDesc}
                      onChange={(e) => setProposalDesc(e.target.value)}
                      placeholder={t('catalog.propose_desc_ph')}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                        isDark
                          ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                          : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {t('catalog.btn_cancel')}
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                      }`}
                    >
                      {t('catalog.btn_submit_proposal')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
