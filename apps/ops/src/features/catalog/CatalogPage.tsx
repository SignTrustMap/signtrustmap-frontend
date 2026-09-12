import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import {
  BookOpen,
  PlusCircle,
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  X,
  CaretLeft,
  CaretRight,
  CircleNotch,
} from '@phosphor-icons/react'
import {
  CatalogService,
  type CatalogSignTypeItem,
  type SignCategoryItem,
} from '@/api/services/catalog.service'

export default function CatalogPage() {
  const { t } = useTranslation('ops')

  const [catalog, setCatalog] = useState<CatalogSignTypeItem[]>([])
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null)
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')
  const [newImageKey, setNewImageKey] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishToast, setPublishToast] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await CatalogService.getCategories()
      if (Array.isArray(data)) {
        setCategories(data)
        if (data.length > 0 && newCategoryId === null) {
          setNewCategoryId(data[0].id)
        }
      }
    } catch {
      setCategories([])
    }
  }, [newCategoryId])

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        page,
        size: pageSize,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
        categoryId: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
        isActive: true,
      }
      const res = await CatalogService.getSignTypes(params)
      if (res && Array.isArray(res.content)) {
        setCatalog(res.content)
        setTotalPages(res.totalPages || 1)
        setTotalElements(res.totalElements || 0)
      } else {
        setCatalog([])
        setTotalPages(1)
        setTotalElements(0)
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh mục biển báo')
      setCatalog([])
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, searchTerm, categoryFilter])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setPage(0)
  }

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val)
    setPage(0)
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryId) return
    setIsSubmitting(true)
    try {
      await CatalogService.createSignType({
        categoryId: newCategoryId,
        signCode: newCode.trim().toUpperCase(),
        nameVi: newNameVi.trim(),
        nameEn: newNameEn.trim() || newNameVi.trim(),
        description: `Biển báo ${newNameVi.trim()} (${newCode.trim().toUpperCase()})`,
        aiLabelPrompt: newAiPrompt.trim() || `a photo of a ${newNameEn.trim()} traffic sign.`,
        osmMapping: newOsmMapping.trim() || undefined,
        representativeImageKey: newImageKey.trim() || undefined,
        isActive: true,
      })
      setShowCreateModal(false)
      setNewCode('')
      setNewNameVi('')
      setNewNameEn('')
      setNewAiPrompt('')
      setNewOsmMapping('')
      setNewImageKey('')
      setPublishToast(true)
      setTimeout(() => setPublishToast(false), 2500)
      await fetchCatalog()
    } catch (err: any) {
      alert(err?.message || 'Không thể thêm biển báo mới vào danh mục')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = [
    { value: 'all', label: t('catalog.cat_all') },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.nameVi ? `${c.nameVi} (${c.code})` : c.code,
    })),
  ]

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <BookOpen size={16} weight="bold" />
            <span>{t('catalog.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('catalog.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('catalog.subtitle')} ({totalElements} biển báo)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <PlusCircle size={18} weight="bold" />
          <span>{t('catalog.btn_add_sign')}</span>
        </button>
      </div>

      {publishToast && (
        <div
          onClick={() => setPublishToast(false)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{t('catalog.toast_published')}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('catalog.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <CustomSelect
            value={categoryFilter}
            onChange={handleCategoryChange}
            size="sm"
            leftIcon={<Funnel size={14} />}
            options={categoryOptions}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_code_name')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_category')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_ai_prompt')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_osm_mapping')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('catalog.th_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <CircleNotch size={24} className="animate-spin inline-block mr-2" />
                    <span>Đang tải dữ liệu biển báo...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-red-500 font-mono">
                    {error}
                  </td>
                </tr>
              ) : catalog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-mono">
                    Không tìm thấy biển báo nào phù hợp
                  </td>
                </tr>
              ) : (
                catalog.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.representativeImageKey ? (
                          <img
                            src={item.representativeImageKey}
                            alt={item.nameVi}
                            className="w-9 h-9 object-contain rounded-md bg-gray-100 dark:bg-white/10 p-1 shrink-0 border border-gray-200 dark:border-white/10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : null}
                        <div>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                            {item.signCode}
                          </span>
                          <p className="font-bold text-gray-900 dark:text-white mt-0.5">{item.nameVi}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.nameEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                        {item.category?.nameVi || item.category?.code || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate font-mono text-[11px]" title={item.aiLabelPrompt || ''}>
                      {item.aiLabelPrompt || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                      {item.osmMapping || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}>
                        {item.isActive ? t('catalog.status_active') : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500">
          <div>
            Trang {page + 1} / {totalPages} (Tổng {totalElements} biển báo)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <CaretLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('catalog.modal_title')}
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">{t('catalog.field_code')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P.102"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">{t('catalog.field_category')}</label>
                  <CustomSelect
                    value={String(newCategoryId || '')}
                    onChange={(val) => setNewCategoryId(Number(val))}
                    className="w-full"
                    buttonClassName="w-full"
                    options={categories.map((c) => ({
                      value: String(c.id),
                      label: c.nameVi || c.code,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">Tên tiếng Việt</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cấm đi ngược chiều"
                    value={newNameVi}
                    onChange={(e) => setNewNameVi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">English Name</label>
                  <input
                    type="text"
                    placeholder="e.g. No Entry"
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">{t('catalog.field_ai_prompt')}</label>
                <textarea
                  rows={2}
                  placeholder="a photo of a No Entry traffic sign."
                  value={newAiPrompt}
                  onChange={(e) => setNewAiPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">{t('catalog.field_osm_mapping')}</label>
                <input
                  type="text"
                  placeholder="traffic_sign=VN:P.102; oneway=yes"
                  value={newOsmMapping}
                  onChange={(e) => setNewOsmMapping(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono font-bold text-gray-500 uppercase tracking-wide">URL Ảnh / Icon</label>
                <input
                  type="text"
                  placeholder="https://cdn.signtrustmap.vn/signs/p102.png"
                  value={newImageKey}
                  onChange={(e) => setNewImageKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold cursor-pointer"
                >
                  {t('catalog.btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? <CircleNotch size={16} className="animate-spin" /> : null}
                  <span>{t('catalog.btn_publish')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
