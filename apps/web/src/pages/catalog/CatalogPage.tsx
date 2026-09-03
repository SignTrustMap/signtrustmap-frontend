import { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlass,
  Plus,
  Info,
  Sparkle,
  CheckCircle,
  TrafficSignal,
  CaretDown,
  Funnel,
  Check,
  WarningCircle,
  ArrowUpRight,
  Gauge,
  Compass,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { mockTrafficCatalog, type TrafficCatalogSign } from '@/data'
import { Modal } from '@/components/common/Modal'

export default function CatalogPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [selectedSign, setSelectedSign] = useState<TrafficCatalogSign | null>(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalTempName, setProposalTempName] = useState('')
  const [proposalDesc, setProposalDesc] = useState('')
  const [proposalSuccess, setProposalSuccess] = useState(false)

  const categories = [
    { id: 'all', label: t('groups.ALL', { ns: 'product', defaultValue: 'Tất cả biển báo' }), icon: TrafficSignal },
    { id: 'prohibitory', label: t('groups.P', { ns: 'product', defaultValue: 'Biển báo cấm' }), icon: WarningCircle },
    { id: 'warning', label: t('groups.W', { ns: 'product', defaultValue: 'Biển cảnh báo' }), icon: WarningCircle },
    { id: 'mandatory', label: t('groups.R', { ns: 'product', defaultValue: 'Biển hiệu lệnh' }), icon: ArrowUpRight },
    { id: 'speed_limit', label: t('groups.S', { ns: 'product', defaultValue: 'Giới hạn tốc độ' }), icon: Gauge },
    { id: 'guide', label: t('groups.I', { ns: 'product', defaultValue: 'Biển chỉ dẫn' }), icon: Compass },
  ]

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0]
  const CurrentIcon = currentCategoryObj.icon

  const filteredSigns = mockTrafficCatalog.filter((sign) => {
    const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory
    const matchesQuery =
      sign.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const handleProposeSign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalTempName.trim()) return
    setProposalSuccess(true)
    setTimeout(() => {
      setProposalSuccess(false)
      setShowProposalModal(false)
      setProposalTempName('')
      setProposalDesc('')
    }, 2000)
  }

  return (
    <div
      className={`min-h-screen pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold bg-[#00c4de]/10 text-[#00c4de] border border-[#00c4de]/20 mb-3">
              <TrafficSignal size={16} />
              <span>{t('catalog.badge_standard')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('catalog.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {t('catalog.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowProposalModal(true)}
            className={`px-5 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center gap-2.5 cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
            }`}
          >
            <Plus size={18} />
            <span>{t('catalog.btn_propose')}</span>
          </button>
        </div>

        {/* Search & Category Dropdown Bar */}
        <div className={`p-4 sm:p-5 rounded-[24px] border mb-8 flex flex-col sm:flex-row items-center gap-4 ${
          isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('catalog.search_placeholder')}
              className={`w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-2xl border outline-none transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white'
                  : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
              }`}
            />
          </div>

          {/* Category Dropdown Menu */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full sm:w-64 px-4 py-3.5 rounded-2xl border flex items-center justify-between gap-3 text-sm font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:border-[#00c4de]/50 text-white'
                  : 'bg-gray-50 border-gray-200 hover:border-[#007b8b]/50 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <CurrentIcon size={18} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
                <span className="truncate">{currentCategoryObj.label}</span>
              </div>
              <CaretDown size={16} className={`transition-transform duration-200 text-gray-400 shrink-0 ${isDropdownOpen ? 'rotate-180 text-[#00c4de]' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className={`absolute right-0 left-0 sm:left-auto sm:w-72 mt-2 py-2 rounded-2xl border shadow-2xl z-30 animate-fadeIn ${
                isDark ? 'bg-[#081b1f] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-xl'
              }`}>
                <div className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 mb-1">
                  <Funnel size={14} />
                  <span>{t('catalog.filter_dropdown_label')}</span>
                </div>
                {categories.map((cat) => {
                  const CatIcon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  const count = cat.id === 'all' 
                    ? mockTrafficCatalog.length 
                    : mockTrafficCatalog.filter(s => s.category === cat.id).length

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-[#00c4de]/15 text-[#00c4de]'
                            : 'bg-[#007b8b]/10 text-[#007b8b]'
                          : isDark
                          ? 'hover:bg-white/5 text-gray-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CatIcon size={18} className={isSelected ? (isDark ? 'text-[#00c4de]' : 'text-[#007b8b]') : 'text-gray-400'} />
                        <span>{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                          isSelected 
                            ? isDark ? 'bg-[#00c4de]/20 text-[#00c4de]' : 'bg-[#007b8b]/20 text-[#007b8b]' 
                            : 'bg-white/5 text-gray-400'
                        }`}>
                          {count}
                        </span>
                        {isSelected && <Check size={16} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSigns.map((sign) => (
            <div
              key={sign.code}
              onClick={() => setSelectedSign(sign)}
              className={`p-6 rounded-[24px] border transition-all cursor-pointer flex flex-col justify-between ${
                isDark
                  ? 'bg-[#061417]/90 border-white/10 hover:border-[#00c4de]/40 hover:bg-white/[0.03]'
                  : 'bg-white border-gray-200 hover:border-[#007b8b]/40 hover:shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-bold px-3 py-1 rounded-lg bg-[#00c4de]/15 text-[#00c4de] border border-[#00c4de]/30">
                    {sign.code}
                  </span>
                  <span className="text-xs font-mono capitalize text-gray-400">
                    {sign.shape} • {sign.color}
                  </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg mt-3">{sign.nameVi}</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{sign.nameEn}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-2.5 line-clamp-2 leading-relaxed">{sign.descriptionVi}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-mono font-medium">
                  <Sparkle size={14} className="text-amber-400" />
                  AI CLIP Sync
                </span>
                <span className="text-[#007b8b] dark:text-[#00c4de] font-bold flex items-center gap-1">
                  <Info size={16} />
                  <span>{t('catalog.inspect')}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedSign && (
          <Modal
            isOpen={!!selectedSign}
            onClose={() => setSelectedSign(null)}
            maxWidth="max-w-xl"
          >
            <div className={`w-full rounded-[28px] border shadow-2xl p-6 sm:p-8 relative ${
              isDark ? 'bg-[#061417] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedSign(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-lg font-bold px-4 py-1.5 rounded-xl bg-[#00c4de]/20 text-[#00c4de] border border-[#00c4de]/40">
                  {selectedSign.code}
                </span>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl">{selectedSign.nameVi}</h3>
                  <p className="text-sm text-gray-400">{selectedSign.nameEn}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-xs uppercase font-mono font-bold text-gray-400 block mb-1.5">{t('catalog.desc_and_meaning')}</span>
                  <p className="text-gray-200 leading-relaxed">{selectedSign.descriptionVi}</p>
                  <p className="text-gray-400 mt-1.5 italic text-xs leading-relaxed">{selectedSign.descriptionEn}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs uppercase font-mono font-bold text-amber-400 block mb-1.5 flex items-center gap-1.5">
                    <Sparkle size={14} />
                    {t('catalog.clip_vector')}
                  </span>
                  <p className="font-mono text-xs sm:text-sm text-amber-200">"{selectedSign.clipPrompt}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">{t('catalog.geometry')}</span>
                    <span className="font-bold">{selectedSign.shape}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">{t('catalog.colors')}</span>
                    <span className="font-bold">{selectedSign.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {showProposalModal && (
          <Modal
            isOpen={showProposalModal}
            onClose={() => setShowProposalModal(false)}
            maxWidth="max-w-lg"
          >
            <div className={`w-full rounded-[28px] border shadow-2xl p-6 sm:p-8 ${
              isDark ? 'bg-[#061417] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {proposalSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-xl font-bold">{t('catalog.proposal_success_title')}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                    {t('catalog.proposal_success_desc')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleProposeSign} className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="font-bold text-base sm:text-lg">{t('catalog.propose_title')}</h3>
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
                      {t('catalog.propose_name_lbl')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalTempName}
                      onChange={(e) => setProposalTempName(e.target.value)}
                      placeholder={t('catalog.propose_name_ph')}
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-2xl border outline-none ${
                        isDark ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white' : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-400 mb-2">
                      {t('catalog.propose_desc_lbl')}
                    </label>
                    <textarea
                      rows={3}
                      value={proposalDesc}
                      onChange={(e) => setProposalDesc(e.target.value)}
                      placeholder={t('catalog.propose_desc_ph')}
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-2xl border outline-none ${
                        isDark ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white' : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                        isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('catalog.btn_cancel')}
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-md cursor-pointer ${
                        isDark ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black' : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
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
