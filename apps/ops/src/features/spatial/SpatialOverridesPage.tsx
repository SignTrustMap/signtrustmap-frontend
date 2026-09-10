import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect from '@/components/common/CustomSelect'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { Pagination } from '@/components/common/Pagination'
import {
  ArrowsClockwise,
  WarningOctagon,
  Compass,
  X,
  Funnel,
  FloppyDisk,
} from '@phosphor-icons/react'
import { mockSpatialSigns, type SpatialSignRecord } from '@/data/adminGovernanceData'

export default function SpatialOverridesPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [signs, setSigns] = useState<SpatialSignRecord[]>(mockSpatialSigns)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSign, setSelectedSign] = useState<SpatialSignRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Override Modal Fields
  const [overrideReason, setOverrideReason] = useState('')
  const [newHeading, setNewHeading] = useState<number>(0)
  const [newLat, setNewLat] = useState<number>(0)
  const [newLng, setNewLng] = useState<number>(0)
  const [newDirection, setNewDirection] = useState('')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedSign) {
        setSelectedSign(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSign])

  function handleOpenModal(sign: SpatialSignRecord) {
    setSelectedSign(sign)
    setNewHeading(sign.headingDeg)
    setNewLat(sign.lat)
    setNewLng(sign.lng)
    setNewDirection(sign.direction)
    setOverrideReason('')
  }

  function handleSaveOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!overrideReason.trim()) {
      toast.warning(t('spatial.toast_reason_required'))
      return
    }
    if (!selectedSign) return

    setSigns((prev) =>
      prev.map((s) =>
        s.id === selectedSign.id
          ? {
              ...s,
              lat: newLat,
              lng: newLng,
              headingDeg: newHeading,
              direction: newDirection.trim() || s.direction,
              status: 'Verified',
            }
          : s
      )
    )

    toast.success(t('spatial.toast_overridden', { id: selectedSign.id }))
    setSelectedSign(null)
  }

  function handleDeleteMalicious(signId: string) {
    setSigns((prev) => prev.filter((s) => s.id !== signId))
    toast.success(t('spatial.toast_deleted', { id: signId }))
  }

  const categoryOptions = [
    { value: 'prohibition', label: t('spatial.cat_prohibition') },
    { value: 'warning', label: t('spatial.cat_warning') },
    { value: 'mandatory', label: t('spatial.cat_mandatory') },
    { value: 'information', label: t('spatial.cat_information') },
  ]

  const statusOptions = [
    { value: 'Verified', label: t('spatial.status_verified') },
    { value: 'Flagged For Review', label: t('spatial.status_flagged') },
    { value: 'Stale', label: t('spatial.status_stale') },
  ]

  const filteredSigns = signs.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.signCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.signName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lat.toString().includes(searchTerm) ||
      s.lng.toString().includes(searchTerm)

    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const paginatedSigns = filteredSigns.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getStatusBadge = (status: SpatialSignRecord['status']) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
      case 'Flagged For Review':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
      case 'Stale':
      default:
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'prohibition':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
      case 'warning':
        return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
      case 'mandatory':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
      case 'information':
      default:
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20'
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Title Only - Clean & Minimalist */}
      <PageHeader title={t('spatial.title')} />

      {/* Unified Filter Bar */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('spatial.search_placeholder')}
      >
        <CustomSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          size="sm"
          leftIcon={<Funnel size={14} />}
          options={[
            { value: 'all', label: t('spatial.filter_all_categories') },
            ...categoryOptions,
          ]}
        />

        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          options={[
            { value: 'all', label: t('spatial.filter_all_statuses') },
            ...statusOptions,
          ]}
        />
      </DataFilterBar>

      {/* Spatial Signs Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-mono uppercase border-b border-neutral-200/80 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_id_code')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_coords')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_heading')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_road')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_confidence')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('spatial.th_status')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('spatial.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {paginatedSigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-medium">
                    {t('spatial.empty_filter')}
                  </td>
                </tr>
              ) : (
                paginatedSigns.map((sign) => (
                  <tr
                    key={sign.id}
                    onClick={() => handleOpenModal(sign)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {/* ID & Sign Code / Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-[11px] text-[#007b8b] dark:text-[#00c4de] group-hover:underline">
                          {sign.id}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${getCategoryBadge(sign.category)}`}>
                            {sign.signCode}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-white text-xs">
                            {sign.signName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coordinates WGS84 */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-neutral-900 dark:text-neutral-200 font-bold block">
                        {sign.lat.toFixed(5)}, {sign.lng.toFixed(5)}
                      </span>
                      <span className="text-[10px] text-neutral-400">WGS84 GPS</span>
                    </td>

                    {/* Heading & Direction */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-xs">
                        <Compass size={14} weight="bold" className="shrink-0" />
                        <span>{sign.headingDeg}°</span>
                      </div>
                      <span className="text-neutral-500 dark:text-neutral-400 text-[10px] block mt-0.5">
                        {sign.direction}
                      </span>
                    </td>

                    {/* Road Segment */}
                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 max-w-xs">
                      <p className="font-medium text-xs truncate" title={sign.roadName}>
                        {sign.roadName}
                      </p>
                      <span className="text-neutral-400 font-mono text-[10px] block mt-0.5">
                        {sign.verifiedAt}
                      </span>
                    </td>

                    {/* AI Confidence */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                        {(sign.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="w-16 bg-neutral-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#007b8b] dark:bg-[#00c4de] h-full rounded-full"
                          style={{ width: `${sign.confidence * 100}%` }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${getStatusBadge(
                          sign.status
                        )}`}
                      >
                        {sign.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenModal(sign)}
                          className="px-2.5 py-1.5 bg-[#007b8b]/10 hover:bg-[#007b8b]/20 text-[#007b8b] dark:text-[#00c4de] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title={t('spatial.btn_override_tooltip')}
                        >
                          <ArrowsClockwise size={13} weight="bold" />
                          <span>{t('spatial.btn_override')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMalicious(sign.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title={t('spatial.btn_delete_tooltip')}
                        >
                          <WarningOctagon size={13} weight="bold" />
                          <span>{t('spatial.btn_delete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSigns.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* ─── Administrative Spatial Override Modal ─── */}
      {selectedSign && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
            onClick={() => setSelectedSign(null)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-neutral-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {t('spatial.modal_title')}
                  </h3>
                  <span className="font-mono text-xs text-[#007b8b] dark:text-[#00c4de] font-bold">
                    {selectedSign.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSign(null)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title={t('spatial.btn_close')}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveOverride} className="space-y-3.5 text-xs">
                {/* Target Sign Summary */}
                <div className="p-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 rounded-xl space-y-1">
                  <span className="text-neutral-400 font-mono text-[10px] uppercase font-bold block">
                    {t('spatial.lbl_target')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                      {selectedSign.signCode}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white text-xs">
                      {selectedSign.signName}
                    </span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    {selectedSign.roadName}
                  </p>
                </div>

                {/* Coordinate Inputs (Lat, Lng) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                      {t('spatial.lbl_lat')} *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLat}
                      onChange={(e) => setNewLat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/15 rounded-xl font-mono text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                      {t('spatial.lbl_lng')} *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLng}
                      onChange={(e) => setNewLng(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/15 rounded-xl font-mono text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>
                </div>

                {/* Heading & Traffic Direction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                      {t('spatial.lbl_heading')} *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={360}
                        required
                        value={newHeading}
                        onChange={(e) => setNewHeading(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/15 rounded-xl font-mono text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                      />
                      <Compass size={16} className="absolute right-3 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                      {t('spatial.lbl_direction')}
                    </label>
                    <input
                      type="text"
                      value={newDirection}
                      onChange={(e) => setNewDirection(e.target.value)}
                      placeholder={t('spatial.placeholder_direction')}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/15 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>
                </div>

                {/* Audit Trail Justification Textarea */}
                <div className="space-y-1">
                  <label className="block font-semibold text-red-600 dark:text-red-400">
                    {t('spatial.lbl_justification')} *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={t('spatial.placeholder_justification')}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/15 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedSign(null)}
                    className="px-4 py-2 bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                  >
                    {t('spatial.btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FloppyDisk size={14} weight="bold" />
                    <span>{t('spatial.btn_confirm')}</span>
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
