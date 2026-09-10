import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  MapPin,
  Clock,
  ArrowsClockwise,
  Eye,
  X,
  Sparkle,
  Plus,
  Coins,
  Camera,
  WarningOctagon,
  Check,
  Prohibit,
  TrafficSignal,
} from '@phosphor-icons/react'
import { mockRevalidationTasks, type RevalidationTask } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

export default function TasksPage() {
  const { t } = useTranslation('ops')
  const { success, error } = useToast()
  const { isCollapsed } = useSidebar()

  const [tasks, setTasks] = useState<RevalidationTask[]>(mockRevalidationTasks)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<RevalidationTask | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // New task form state
  const [newTaskCode, setNewTaskCode] = useState('P.102')
  const [newTaskLocation, setNewTaskLocation] = useState('')
  const [newTaskBounty, setNewTaskBounty] = useState(50)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selectedTask) setSelectedTask(null)
        if (isCreateModalOpen) setIsCreateModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTask, isCreateModalOpen])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  // KPIs
  const kpiStats = useMemo(() => {
    const totalActive = tasks.length
    const criticalCount = tasks.filter((tItem) => tItem.freshnessStatus === 'Critical').length
    const pendingEvidenceCount = tasks.filter((tItem) => tItem.submittedEvidenceCount > 0).length
    const totalBountyPool = tasks.reduce((sum, tItem) => sum + tItem.rewardCredits, 0)
    return { totalActive, criticalCount, pendingEvidenceCount, totalBountyPool }
  }, [tasks])

  function handleRevalidationDecision(taskId: string, decision: 'unchanged' | 'changed' | 'retired' | 'invalid') {
    if (decision === 'unchanged') {
      success(t('tasks.toast_confirmed', { taskId, reward: selectedTask?.rewardCredits || 50 }))
    } else if (decision === 'changed') {
      success(t('tasks.toast_updated', { taskId }))
    } else if (decision === 'retired') {
      success(t('tasks.toast_retired', { taskId }))
    } else if (decision === 'invalid') {
      error(t('tasks.toast_invalid', { taskId }))
    }

    setTasks((prev) =>
      prev.map((tItem) =>
        tItem.id === taskId
          ? {
              ...tItem,
              freshnessStatus: decision === 'unchanged' ? 'Stale' : tItem.freshnessStatus,
              lastVerifiedDate: t('tasks.just_now'),
            }
          : tItem
      )
    )
    setSelectedTask(null)
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskLocation.trim()) return

    const catalogEntry = mockCatalogData.find((c) => c.code.toLowerCase() === newTaskCode.toLowerCase())
    const newTask: RevalidationTask = {
      id: `TSK-${Math.floor(9000 + Math.random() * 900)}`,
      signCode: newTaskCode,
      signName: catalogEntry ? catalogEntry.nameVi : 'Biển báo giao thông',
      location: newTaskLocation.trim(),
      lastVerifiedDate: 'Quá hạn 12 tháng',
      freshnessStatus: 'Stale',
      rewardCredits: newTaskBounty,
      submittedEvidenceCount: 0,
      origImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    }

    setTasks((prev) => [newTask, ...prev])
    setIsCreateModalOpen(false)
    setNewTaskLocation('')
    success(t('tasks.toast_task_created'))
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((tItem) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        tItem.id.toLowerCase().includes(q) ||
        tItem.signCode.toLowerCase().includes(q) ||
        tItem.signName.toLowerCase().includes(q) ||
        tItem.location.toLowerCase().includes(q)

      if (activeTab === 'critical') return matchesSearch && tItem.freshnessStatus === 'Critical'
      if (activeTab === 'pending') return matchesSearch && tItem.submittedEvidenceCount > 0
      return matchesSearch
    })
  }, [tasks, searchQuery, activeTab])

  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredTasks, currentPage, pageSize])

  // Catalog entry for selected task
  const selectedCatalogEntry = useMemo(() => {
    if (!selectedTask) return null
    return (
      mockCatalogData.find((c) => c.code.toLowerCase() === selectedTask.signCode.toLowerCase()) || {
        code: selectedTask.signCode,
        shape: 'Circle' as const,
        color: 'Red-White' as const,
        nameVi: selectedTask.signName,
      }
    )
  }, [selectedTask])

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('tasks.title')}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>{t('tasks.btn_create_task')}</span>
          </button>
        }
      />

      {/* ─── KPI SUMMARY METRIC CARDS (Uniform & Non-clickable) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Tasks */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('tasks.kpi_active_tasks')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
              <ArrowsClockwise size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {kpiStats.totalActive}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('tasks.unit_tasks')}</span>
          </div>
        </div>

        {/* KPI 2: Critical Stale */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
              {t('tasks.kpi_critical_stale')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <WarningOctagon size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
              {kpiStats.criticalCount}
            </span>
            <span className="text-xs text-red-500/80 font-sans">{t('tasks.unit_priority_high')}</span>
          </div>
        </div>

        {/* KPI 3: Pending Evidence */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00c4de] uppercase">
              {t('tasks.kpi_pending_evidence')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-[#00c4de]">
              <Camera size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-cyan-800 dark:text-[#00c4de]">
              {kpiStats.pendingEvidenceCount}
            </span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-sans">{t('tasks.unit_pending_review')}</span>
          </div>
        </div>

        {/* KPI 4: Bounty Pool */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('tasks.kpi_bounty_pool')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {kpiStats.totalBountyPool.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 font-sans">Credits</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER AND TABS ────────────────────────────────────────── */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('tasks.search_placeholder')}
        categories={[
          {
            id: 'all',
            label: t('tasks.tab_all'),
            count: tasks.length,
          },
          {
            id: 'critical',
            label: t('tasks.tab_critical'),
            count: kpiStats.criticalCount,
          },
          {
            id: 'pending',
            label: t('tasks.tab_pending'),
            count: kpiStats.pendingEvidenceCount,
          },
        ]}
        selectedCategory={activeTab}
        onSelectCategory={(id) => setActiveTab(id as 'all' | 'critical' | 'pending')}
      />

      {/* ─── TASK LIST TABLE ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-24">{t('tasks.th_id')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('tasks.th_sign')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('tasks.th_location')}</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('tasks.th_freshness')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('tasks.th_reward')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('tasks.th_evidence')}</th>
                {isCollapsed && (
                  <>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                      {t('tasks.th_surveyor')}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                      {t('tasks.th_telemetry')}
                    </th>
                  </>
                )}
                <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-24">{t('tasks.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={isCollapsed ? 9 : 7} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                    <ArrowsClockwise size={32} className="mx-auto opacity-40" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('tasks.empty_title')}</p>
                    <p className="text-xs">{t('tasks.empty_desc')}</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => {
                  const catalogEntry = mockCatalogData.find(
                    (c) => c.code.toLowerCase() === task.signCode.toLowerCase()
                  )

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      {/* Task ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                          {task.id}
                        </span>
                      </td>

                      {/* Sign with Visual Graphic */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center p-0.5 shrink-0">
                            {catalogEntry ? (
                              <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                            ) : (
                              <TrafficSignal size={15} className="text-[#007b8b]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[120px] sm:max-w-[160px] lg:max-w-[190px]">
                            <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] mr-1 text-[11px]">
                              {task.signCode}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white truncate block text-xs" title={task.signName}>
                              {task.signName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 min-w-0 max-w-[130px] sm:max-w-[170px] lg:max-w-[210px]">
                          <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                          <span className="truncate text-xs" title={task.location}>{task.location}</span>
                        </div>
                      </td>

                      {/* Freshness Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs">
                          {task.freshnessStatus === 'Critical' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {t('tasks.tag_freshness_critical')}
                            </span>
                          ) : task.freshnessStatus === 'Pending Evidence' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30">
                              <Sparkle size={10} weight="fill" />
                              {t('tasks.tag_freshness_pending')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              <Clock size={10} />
                              {t('tasks.tag_freshness_stale')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reward Credits */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold text-[11px] border border-amber-200 dark:border-amber-500/20">
                          <Coins size={12} weight="fill" />
                          +{task.rewardCredits}
                        </span>
                      </td>

                      {/* Evidence Files Count */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                            task.submittedEvidenceCount > 0
                              ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-[#00c4de] font-bold border border-blue-200 dark:border-blue-500/30'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'
                          }`}
                        >
                          <Camera size={11} weight={task.submittedEvidenceCount > 0 ? 'bold' : 'regular'} />
                          {task.submittedEvidenceCount > 0
                            ? `${task.submittedEvidenceCount} tệp`
                            : '0'}
                        </span>
                      </td>

                      {/* ADAPTIVE EXTRA COLUMNS: Visible when menu is collapsed */}
                      {isCollapsed && (
                        <>
                          <td className="py-2.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] hidden md:table-cell animate-in fade-in duration-300" title={task.assignedSurveyor}>
                            {task.assignedSurveyor || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                            <span className="text-[#007b8b] dark:text-[#00c4de] font-semibold block leading-tight">
                              {task.submittedAt || '—'}
                            </span>
                            {task.gpsOffset !== undefined && (
                              <span className="text-gray-400 text-[10px] leading-tight">
                                Δ {task.gpsOffset}m
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white font-semibold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer text-xs"
                          title={t('tasks.btn_inspect_comparative')}
                        >
                          <Eye size={13} weight="bold" />
                          <span>{t('tasks.btn_view_details')}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTasks.length}
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

      {/* ─── MODAL: SO SÁNH BẰNG CHỨNG TÁI KIỂM ĐỊNH (BEFORE / AFTER) ─── */}
      {selectedTask && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <ArrowsClockwise size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{t('tasks.modal_title')} (#{selectedTask.id})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('tasks.modal_subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Before vs After Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Hồ sơ gốc trong CSDL */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                    {t('tasks.lbl_original_record')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    {t('tasks.status_stale')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Standard Catalog Sign Vector */}
                  <div className="aspect-video bg-white dark:bg-black/40 rounded-lg border border-gray-200/70 dark:border-white/10 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[9px] font-mono text-gray-400 uppercase mb-1">
                      {t('tasks.lbl_standard_catalog_ref')}
                    </span>
                    <div className="w-12 h-12 flex items-center justify-center">
                      {selectedCatalogEntry ? (
                        <TrafficSignGraphic sign={selectedCatalogEntry} className="w-full h-full object-contain" />
                      ) : (
                        <TrafficSignal size={24} className="text-[#007b8b]" />
                      )}
                    </div>
                  </div>

                  {/* Archive Dashcam Photo */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-gray-200 dark:border-white/10">
                    <img
                      src={selectedTask.origImageUrl || 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80'}
                      alt="Original Sign Archive"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                      {t('tasks.orig_date_label')}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-1">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="font-mono text-[#007b8b] dark:text-[#00c4de]">{selectedTask.signCode}</span>
                    <span>- {selectedTask.signName}</span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1">
                    <MapPin size={13} className="shrink-0 text-gray-400" />
                    <span>{selectedTask.location}</span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1">
                    <Clock size={13} className="shrink-0 text-gray-400" />
                    <span>{t('tasks.lbl_last_verified_prefix')} {selectedTask.lastVerifiedDate}</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Bằng chứng mới gửi lên từ cộng đồng */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">
                    {t('tasks.lbl_new_evidence')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                    <Sparkle size={12} weight="fill" /> {t('tasks.status_pending_review')}
                  </span>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-emerald-200 dark:border-emerald-500/20">
                  <img
                    src={selectedTask.newImageUrl || selectedTask.origImageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80'}
                    alt="New Submitted Evidence Crop"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-black/85 text-white text-[9px] font-mono">
                      {selectedTask.submittedAt || t('tasks.new_date_label')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono font-bold">
                      {t('tasks.badge_gps_offset', { meters: selectedTask.gpsOffset || 1.2 })}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {t('tasks.lbl_submitted_by')} <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">{selectedTask.assignedSurveyor || 'Surveyor #148'}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{selectedTask.rewardCredits} Credits
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10 text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{selectedTask.fieldNotes || 'Biển báo còn nguyên vẹn, sơn và phản quang đạt chuẩn.'}"
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Action Buttons (Flow 8) */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleRevalidationDecision(selectedTask.id, 'invalid')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Prohibit size={15} />
                <span>{t('tasks.btn_reject_evidence')}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'retired')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <X size={15} weight="bold" />
                  <span>{t('tasks.btn_retire_sign')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'changed')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <ArrowsClockwise size={15} weight="bold" />
                  <span>{t('tasks.btn_change_sign')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRevalidationDecision(selectedTask.id, 'unchanged')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Check size={16} weight="bold" />
                  <span>{t('tasks.btn_confirm_unchanged')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: TẠO NHIỆM VỤ TÁI KIỂM ĐỊNH MỚI ─────────────────── */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Plus size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('tasks.btn_create_task')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                  {t('tasks.lbl_target_sign_code')}
                </label>
                <select
                  value={newTaskCode}
                  onChange={(e) => setNewTaskCode(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl font-mono text-xs focus:outline-none focus:border-[#007b8b]"
                >
                  <option value="P.102">P.102 - Cấm đi ngược chiều</option>
                  <option value="P.103a">P.103a - Cấm xe ô tô</option>
                  <option value="P.127">P.127 - Tốc độ tối đa cho phép</option>
                  <option value="P.130">P.130 - Cấm dừng và đỗ xe</option>
                  <option value="W.207a">W.207a - Giao nhau đường không ưu tiên</option>
                  <option value="R.301a">R.301a - Hướng đi phải theo</option>
                  <option value="I.401">I.401 - Bắt đầu đường ưu tiên</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                  {t('tasks.lbl_survey_location')}
                </label>
                <input
                  type="text"
                  required
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                  placeholder={t('tasks.placeholder_survey_location')}
                  className="w-full p-2.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#007b8b]"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                  {t('tasks.lbl_bounty_credits')}
                </label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  step={5}
                  value={newTaskBounty}
                  onChange={(e) => setNewTaskBounty(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl font-mono text-xs focus:outline-none focus:border-[#007b8b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  {t('candidate_detail.btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {t('tasks.btn_confirm_create_task')}
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
