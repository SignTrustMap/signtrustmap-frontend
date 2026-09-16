import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapTrifold,
  ListBullets,
  CheckCircle,
  ClockCounterClockwise,
  Camera,
  Coins,
  X,
  UploadSimple,
  MapPin,
  Check,
  MagnifyingGlass,
  Sparkle,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { mockRevalidationTasks, type RevalidationTaskItem } from '@/data'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { CustomSelect } from '@/components/common/CustomSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { Modal } from '@/components/common/Modal'

export default function SurveyRevalidationPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [tasks, setTasks] = useState<RevalidationTaskItem[]>(mockRevalidationTasks)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // Selected Task & Submission Modal State
  const [selectedTask, setSelectedTask] = useState<RevalidationTaskItem | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null)
  const [observedCondition, setObservedCondition] = useState<string>('intact')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oldImageView, setOldImageView] = useState<'crop' | 'context'>('crop')

  // Quota & Reward stats
  const [completedToday, setCompletedToday] = useState(3)
  const dailyQuota = 10
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(135)

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersGroupRef = useRef<L.LayerGroup | null>(null)

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.roadName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter

    return matchesSearch && matchesCategory && matchesPriority
  })

  // Initialize Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [10.7769, 106.6955],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer(
        isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map)

      markersGroupRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
    }

    return () => {
      // Keep map instance alive or clean on destroy
    }
  }, [viewMode, isDark])

  // Update Map Markers
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current || !markersGroupRef.current) return

    markersGroupRef.current.clearLayers()

    filteredTasks.forEach((task) => {
      const isUrgent = task.priority === 'Urgent'
      const isHigh = task.priority === 'High'

      const markerHtml = `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${isUrgent ? '#ef4444' : isHigh ? '#f59e0b' : '#007b8b'};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2px solid #ffffff;
          cursor: pointer;
        ">
          ${task.category}
        </div>
      `

      const customIcon = L.divIcon({
        className: 'reval-custom-marker',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

      const marker = L.marker([task.lat, task.lng], { icon: customIcon })
      marker.on('click', () => {
        setSelectedTask(task)
      })

      marker.addTo(markersGroupRef.current!)
    })
  }, [filteredTasks, viewMode])

  const handleOpenSubmit = (task: RevalidationTaskItem) => {
    setSelectedTask(task)
    setEvidenceFile(null)
    setEvidencePreview(null)
    setObservedCondition('intact')
    setNotes('')
    setIsSubmitModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEvidenceFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setEvidencePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))
    setIsSubmitting(false)

    // Update state
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? { ...t, status: 'Submitted' } : t))
    )
    setCompletedToday((prev) => Math.min(dailyQuota, prev + 1))
    setTotalCreditsEarned((prev) => prev + selectedTask.rewardCredits)

    setIsSubmitModalOpen(false)
    toast.success(
      t('survey.reval.toast_success', {
        code: selectedTask.code,
        credits: selectedTask.rewardCredits,
      })
    )
    setSelectedTask(null)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('ALL')
    setPriorityFilter('ALL')
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 text-left transition-colors">
      {/* ─── Page Header (Standardized via PageHeader.tsx according to RULE.md) ── */}
      <PageHeader
        title={t('survey.reval.page_title')}
        subtitle={t('survey.reval.page_subtitle')}
        actions={
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`p-3 rounded-2xl border text-center min-w-[120px] ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider block">
                {t('survey.reval.daily_quota')}
              </span>
              <span className="text-base font-extrabold font-mono text-gray-900 dark:text-white">
                <span className="text-[#007b8b] dark:text-[#00c4de]">{completedToday}</span> / {dailyQuota}
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border text-center min-w-[120px] ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider block">
                {t('survey.reval.accumulated_credits')}
              </span>
              <div className="flex items-center justify-center gap-1 text-base font-extrabold font-mono text-amber-500">
                <Coins size={16} weight="fill" />
                <span>+{totalCreditsEarned}</span>
              </div>
            </div>
          </div>
        }
      />

      {/* ─── Filter & View Switcher Toolbar (Integrated into shared DataFilterBar) ─── */}
      <div
        className={`p-4 rounded-2xl border transition-colors relative z-20 ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <DataFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('survey.reval.search_placeholder')}
        >
          {/* Category Dropdown */}
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'ALL', label: t('survey.reval.filter_category_all') },
              { value: 'P', label: t('survey.reval.filter_category_p') },
              { value: 'W', label: t('survey.reval.filter_category_w') },
              { value: 'R', label: t('survey.reval.filter_category_r') },
              { value: 'I', label: t('survey.reval.filter_category_i') },
            ]}
            size="sm"
            className="min-w-[145px]"
          />

          {/* Priority Dropdown */}
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'ALL', label: t('survey.reval.filter_priority_all') },
              { value: 'Urgent', label: t('survey.reval.filter_priority_urgent') },
              { value: 'High', label: t('survey.reval.filter_priority_high') },
              { value: 'Normal', label: t('survey.reval.filter_priority_normal') },
            ]}
            size="sm"
            className="min-w-[160px]"
          />

          {/* View Mode Toggle */}
          <div
            className={`inline-flex p-1 rounded-xl border shrink-0 ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? isDark
                    ? 'bg-[#00c4de] text-black shadow-xs'
                    : 'bg-white text-[#007b8b] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MapTrifold size={15} weight="bold" />
              <span>{t('survey.reval.view_map')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? isDark
                    ? 'bg-[#00c4de] text-black shadow-xs'
                    : 'bg-white text-[#007b8b] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListBullets size={15} weight="bold" />
              <span>{t('survey.reval.view_list', { count: filteredTasks.length })}</span>
            </button>
          </div>
        </DataFilterBar>
      </div>

      {/* ─── Empty State (When no tasks match current search/filter) ── */}
      {filteredTasks.length === 0 ? (
        <div
          className={`p-12 rounded-2xl border text-center transition-colors ${
            isDark ? 'bg-[#071317] border-white/10 text-gray-400' : 'bg-white border-[#E8E4E3]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlass size={28} weight="bold" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {t('survey.reval.empty_filter_title')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            {t('survey.reval.empty_filter_desc')}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            {t('survey.reval.btn_reset_filters')}
          </button>
        </div>
      ) : viewMode === 'map' ? (
        /* ─── Map View (Strict z-index isolate according to RULE.md section 2.2) ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map canvas (8 cols) */}
          <div
            className={`lg:col-span-8 rounded-2xl border overflow-hidden h-[620px] relative isolate z-0 transition-colors ${
              isDark ? 'bg-[#071317] border-white/10 shadow-lg' : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/75 backdrop-blur-md text-white border border-white/15 shadow-sm">
              {t('survey.reval.map_hint')}
            </div>
          </div>

          {/* Selected Task Details Drawer / Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {selectedTask ? (
              <div
                className={`p-5 rounded-2xl border shadow-md transition-colors ${
                  isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-md bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de]">
                    {selectedTask.code}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      selectedTask.priority === 'Urgent'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : selectedTask.priority === 'High'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {t('survey.reval.stale_days', { days: selectedTask.staleDays })}
                  </span>
                </div>

                <h3 className="text-base font-bold mb-1">{selectedTask.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 mb-3">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{selectedTask.roadName}</span>
                </p>

                {/* Historical photo thumbnail */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video mb-3 bg-black/20">
                  <img
                    src={selectedTask.historicalCropUrl}
                    alt={selectedTask.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                    {t('survey.reval.last_verified', { date: selectedTask.lastVerifiedDate })}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs mb-4 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-bold block text-gray-700 dark:text-gray-300 mb-0.5">
                    {t('survey.reval.reval_reason_title')}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{selectedTask.reason}</span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-sm">
                    <Coins size={16} weight="fill" />
                    <span>{t('survey.reval.credits_reward', { credits: selectedTask.rewardCredits })}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSubmit(selectedTask)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                    }`}
                  >
                    <Camera size={15} weight="bold" />
                    <span>{t('survey.reval.btn_submit_evidence')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`p-8 rounded-2xl border text-center ${
                  isDark ? 'bg-[#071317] border-white/10 text-gray-400' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <ClockCounterClockwise size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-semibold">{t('survey.reval.no_task_selected_title')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('survey.reval.no_task_selected_desc')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── List View ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark
                  ? 'bg-[#071317] border-white/10 hover:border-white/20'
                  : 'bg-white border-[#E8E4E3] hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-md bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de]">
                    {task.code}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      task.priority === 'Urgent'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : task.priority === 'High'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {t('survey.reval.stale_days_short', { days: task.staleDays })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                  {task.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1 mb-3">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{task.roadName}</span>
                </p>

                <div className="rounded-xl overflow-hidden aspect-video relative mb-3 bg-black/20 border border-white/10">
                  <img
                    src={task.historicalCropUrl}
                    alt={task.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                    {t('survey.reval.trust_score_old', { score: task.currentTrustScore })}
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {task.reason}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-xs">
                  <Coins size={14} weight="fill" />
                  <span>{t('survey.reval.credits_reward', { credits: task.rewardCredits })}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSubmit(task)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    task.status === 'Submitted'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                  }`}
                  disabled={task.status === 'Submitted'}
                >
                  {task.status === 'Submitted' ? (
                    <>
                      <Check size={14} weight="bold" />
                      <span>{t('survey.reval.btn_evidence_submitted')}</span>
                    </>
                  ) : (
                    <>
                      <Camera size={14} weight="bold" />
                      <span>{t('survey.reval.btn_claim_submit')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Standard Modal (Using Modal.tsx according to RULE.md section 2.3) ─── */}
      <Modal
        isOpen={isSubmitModalOpen && Boolean(selectedTask)}
        onClose={() => setIsSubmitModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        {selectedTask && (
          <div
            className={`w-full rounded-2xl border p-6 shadow-2xl relative text-left transition-colors ${
              isDark
                ? 'bg-[#071317] border-white/15 text-white'
                : 'bg-white border-[#E8E4E3] text-gray-900'
            }`}
          >
            {/* Standard Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de]">
                    {selectedTask.code}
                  </span>
                  <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1">
                    <Coins size={14} weight="fill" />
                    <span>{t('survey.reval.modal_credits_reward', { credits: selectedTask.rewardCredits })}</span>
                  </span>
                </div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Sparkle size={18} className="text-[#007b8b] dark:text-[#00c4de]" weight="fill" />
                  <span>{t('survey.reval.modal_title')}</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedTask.name} • {selectedTask.roadName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Standard Modal Body */}
            <form onSubmit={handleSubmitEvidence} className="mt-4 space-y-4">
              {/* Historical Reference Preview */}
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {t('survey.reval.historical_photo_label', { date: selectedTask.lastVerifiedDate })}
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOldImageView('crop')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                        oldImageView === 'crop'
                          ? 'bg-[#007b8b] text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {t('survey.reval.tab_crop')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOldImageView('context')}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                        oldImageView === 'context'
                          ? 'bg-[#007b8b] text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {t('survey.reval.tab_context')}
                    </button>
                  </div>
                </div>

                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 border border-white/10">
                  <img
                    src={
                      oldImageView === 'crop'
                        ? selectedTask.historicalCropUrl
                        : selectedTask.historicalContextUrl
                    }
                    alt="Historical Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('survey.reval.upload_label')} <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative ${
                    isDark
                      ? 'border-white/20 hover:border-[#00c4de]/60 bg-white/5'
                      : 'border-gray-300 hover:border-[#007b8b]/60 bg-gray-50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {evidencePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={evidencePreview}
                        alt="Evidence Preview"
                        className="max-h-48 rounded-lg object-contain border border-white/15"
                      />
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle size={14} weight="fill" />
                        {t('survey.reval.photo_selected', { name: evidenceFile?.name || '' })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                      <UploadSimple size={32} className="mb-2 text-[#007b8b] dark:text-[#00c4de]" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {t('survey.reval.upload_cta')}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-1">
                        {t('survey.reval.upload_hint')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Observed Condition Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('survey.reval.condition_label')}
                </label>
                <CustomSelect
                  options={[
                    { value: 'intact', label: t('survey.reval.condition_intact') },
                    { value: 'obstructed', label: t('survey.reval.condition_obstructed') },
                    { value: 'damaged', label: t('survey.reval.condition_damaged') },
                    { value: 'removed', label: t('survey.reval.condition_removed') },
                    { value: 'replaced', label: t('survey.reval.condition_replaced') },
                  ]}
                  value={observedCondition}
                  onChange={setObservedCondition}
                  className="w-full"
                  align="left"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('survey.reval.notes_label')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('survey.reval.notes_placeholder')}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none ${
                    isDark
                      ? 'bg-[#030708] border-white/15 text-white placeholder:text-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'
                  }`}
                />
              </div>

              {/* Standard Modal Footer Actions (Secondary left, Primary right according to RULE.md section 2.3) */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                >
                  {t('survey.reval.btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !evidenceFile}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black disabled:opacity-40 shadow-[#00c4de]/20'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white disabled:opacity-40 shadow-[#007b8b]/20'
                  }`}
                >
                  <Camera size={15} weight="bold" />
                  <span>{isSubmitting ? t('survey.reval.btn_submitting') : t('survey.reval.btn_submit_action')}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
