import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  PlusCircle,
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  X,
} from '@phosphor-icons/react'
import { mockCatalogData, type CatalogEntry } from '@/data/catalogData'

export default function CatalogPage() {
  const { t } = useTranslation('ops')

  const [catalog, setCatalog] = useState<CatalogEntry[]>(mockCatalogData)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<'prohibition' | 'warning' | 'mandatory' | 'information'>('prohibition')
  const [newGuidelines] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')
  const [publishToast, setPublishToast] = useState(false)

  const filteredCatalog = catalog.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    const newEntry: CatalogEntry = {
      id: `CAT-${newCode.replace('.', '')}`,
      code: newCode,
      name: newName,
      category: newCategory,
      shape: 'Circle',
      color: 'Standard Regulation',
      description: 'Official standard regulation sign definition',
      guidelines: newGuidelines,
      aiPrompt: newAiPrompt,
      osmMapping: newOsmMapping,
      status: 'Active',
      version: 'v2.5',
    }
    setCatalog((prev) => [newEntry, ...prev])
    setShowCreateModal(false)
    setPublishToast(true)
    setTimeout(() => setPublishToast(false), 2500)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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
            {t('catalog.subtitle')}
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

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('catalog.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Funnel size={14} className="text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-mono font-bold bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="all">{t('catalog.cat_all')}</option>
            <option value="prohibition">{t('catalog.cat_prohibition')}</option>
            <option value="warning">{t('catalog.cat_warning')}</option>
            <option value="mandatory">{t('catalog.cat_mandatory')}</option>
            <option value="information">{t('catalog.cat_information')}</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_code_name')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_category')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_ai_prompt')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_osm_mapping')}</th>
                <th className="py-3 px-4 font-semibold">{t('catalog.th_version')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('catalog.th_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredCatalog.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                        {item.code}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">{item.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 capitalize text-gray-600 dark:text-gray-300">{item.category}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate font-mono text-[11px]">
                    {item.aiPrompt}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">{item.osmMapping}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{item.version}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {t('catalog.status_active')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Sign */}
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

            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-gray-500">{t('catalog.field_code')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P.102a"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold text-gray-500">{t('catalog.field_category')}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                  >
                    <option value="prohibition">{t('catalog.cat_prohibition')}</option>
                    <option value="warning">{t('catalog.cat_warning')}</option>
                    <option value="mandatory">{t('catalog.cat_mandatory')}</option>
                    <option value="information">{t('catalog.cat_information')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-gray-500">{t('catalog.field_name')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('catalog.field_name_placeholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-gray-500">{t('catalog.field_ai_prompt')}</label>
                <textarea
                  rows={2}
                  placeholder="Red circular sign with horizontal white bar in center"
                  value={newAiPrompt}
                  onChange={(e) => setNewAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-gray-500">{t('catalog.field_osm_mapping')}</label>
                <input
                  type="text"
                  placeholder="traffic_sign=VN:P.102; access=no"
                  value={newOsmMapping}
                  onChange={(e) => setNewOsmMapping(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px]"
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
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {t('catalog.btn_publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
