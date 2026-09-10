import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import {
  Coins,
  Clock,
  ShieldWarning,
  CheckCircle,
  Eye,
  X,
  FileText,
  DownloadSimple,
  DeviceMobile,
  MapPin,
  Funnel,
  ShieldCheck,
  CurrencyCircleDollar,
} from '@phosphor-icons/react'
import { mockCreditApprovals, type CreditApprovalItem } from '@/data'

const roleBadgeStyles: Record<string, string> = {
  surveyor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
  reviewer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  contributor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  driver: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
}

function RiskBadge({ riskLevel }: { riskLevel: CreditApprovalItem['riskLevel'] }) {
  const { t } = useTranslation('ops')
  switch (riskLevel) {
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('credits.risk_safe')}
        </span>
      )
    case 'Nghi vấn':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('credits.risk_suspect')}
        </span>
      )
    case 'Cảnh báo gian lận':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          <ShieldWarning size={12} weight="bold" />
          {t('credits.risk_fraud')}
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CreditApprovalItem['status'] }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('credits.status_pending')}
        </span>
      )
    case 'Approved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('credits.tag_approved')}
        </span>
      )
    case 'Rejected':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          {t('credits.tag_rejected')}
        </span>
      )
  }
}

export default function CreditsApprovalPage() {
  const { t } = useTranslation('ops')
  const { success, warning } = useToast()
  const { isCollapsed } = useSidebar()

  const [items, setItems] = useState<CreditApprovalItem[]>(mockCreditApprovals)
  const [activeTab, setActiveTab] = useState<'all' | 'Pending' | 'Fraud' | 'Approved' | 'Rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<CreditApprovalItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedRole, selectedRisk])

  // KPIs
  const kpiStats = useMemo(() => {
    const total = items.length
    const pending = items.filter((i) => i.status === 'Pending').length
    const fraudAlerts = items.filter((i) => i.riskLevel === 'Cảnh báo gian lận').length
    const approved = items.filter((i) => i.status === 'Approved').length
    return { total, pending, fraudAlerts, approved }
  }, [items])

  // Filter dropdown options
  const roleOptions: OptionItem[] = [
    { value: 'all', label: t('credits.role_all') },
    { value: 'surveyor', label: t('credits.role_surveyor') },
    { value: 'reviewer', label: t('credits.role_reviewer') },
    { value: 'contributor', label: t('credits.role_contributor') },
    { value: 'driver', label: t('credits.role_driver') },
  ]

  const riskOptions: OptionItem[] = [
    { value: 'all', label: t('credits.risk_all') },
    { value: 'Thấp', label: t('credits.risk_safe') },
    { value: 'Nghi vấn', label: t('credits.risk_suspect') },
    { value: 'Cảnh báo gian lận', label: t('credits.risk_fraud') },
  ]

  // Main Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.user.name.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.evidenceSummary.toLowerCase().includes(q) ||
        (item.deviceModel && item.deviceModel.toLowerCase().includes(q))

      let matchesTab = true
      if (activeTab === 'Pending') matchesTab = item.status === 'Pending'
      else if (activeTab === 'Fraud') matchesTab = item.riskLevel === 'Cảnh báo gian lận'
      else if (activeTab === 'Approved') matchesTab = item.status === 'Approved'
      else if (activeTab === 'Rejected') matchesTab = item.status === 'Rejected'

      const matchesRole = selectedRole === 'all' || item.user.role === selectedRole
      const matchesRisk = selectedRisk === 'all' || item.riskLevel === selectedRisk

      return matchesSearch && matchesTab && matchesRole && matchesRisk
    })
  }, [items, searchQuery, activeTab, selectedRole, selectedRisk])

  const paginatedItems = useMemo(() => {
    return filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredItems, currentPage, pageSize])

  // Handlers
  function handleDecision(id: string, decision: 'Approved' | 'Rejected') {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: decision,
              reviewedBy: 'Staff Trực ban',
              reviewedAt: 'Vừa xong',
            }
          : item
      )
    )
    if (selectedItem?.id === id) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              status: decision,
              reviewedBy: 'Staff Trực ban',
              reviewedAt: 'Vừa xong',
            }
          : null
      )
    }
    if (decision === 'Approved') {
      success(t('credits.toast_approved', { id }))
    } else {
      warning(t('credits.toast_rejected', { id }))
    }
  }

  function handleExport() {
    const headers = [
      `${t('credits.th_id')},${t('credits.th_user')},Role,${t('credits.th_activity')},${t('credits.th_amount')},${t('credits.th_risk')},${t('credits.th_status')},${t('credits.th_created_at')}`
    ]
    const rows = filteredItems.map(
      (i) =>
        `"${i.id}","${i.user.name}","${i.user.role}","${i.activityType}","${i.amount}","${i.riskLevel}","${i.status}","${i.createdAt}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reward_approvals_ledger_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('credits.title')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>{t('credits.btn_export')}</span>
          </button>
        }
      />

      {/* ─── KPI SUMMARY METRIC CARDS (Uniform & Non-clickable) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Claims */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('credits.kpi_total_claims')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
              <Coins size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('credits.unit_claims')}</span>
          </div>
        </div>

        {/* KPI 2: Pending Approval */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              {t('credits.kpi_pending_claims')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {kpiStats.pending}
            </span>
            <span className="text-xs text-amber-500/80 font-sans">{t('credits.unit_pending')}</span>
          </div>
        </div>

        {/* KPI 3: Fraud Risk Alerts */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
              {t('credits.kpi_fraud_alerts')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldWarning size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
              {kpiStats.fraudAlerts}
            </span>
            <span className="text-xs text-red-500/80 font-sans">{t('credits.unit_risk')}</span>
          </div>
        </div>

        {/* KPI 4: Approved Rewards */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {t('credits.kpi_approved_claims')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {kpiStats.approved}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('credits.unit_approved')}</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER AND SEARCH TOOLBAR ───────────────────────────────── */}
      <div className="space-y-3">
        <DataFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('credits.search_placeholder')}
          categories={[
            {
              id: 'all',
              label: t('credits.tab_all'),
              count: kpiStats.total,
            },
            {
              id: 'Pending',
              label: t('credits.tab_pending'),
              count: kpiStats.pending,
            },
            {
              id: 'Fraud',
              label: t('credits.tab_fraud'),
              count: kpiStats.fraudAlerts,
            },
            {
              id: 'Approved',
              label: t('credits.tab_approved'),
              count: kpiStats.approved,
            },
          ]}
          selectedCategory={activeTab}
          onSelectCategory={(id) => setActiveTab(id as 'all' | 'Pending' | 'Fraud' | 'Approved' | 'Rejected')}
        />

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48 sm:w-56">
              <CustomSelect
                options={roleOptions}
                value={selectedRole}
                onChange={setSelectedRole}
                prefixLabel={t('credits.filter_role')}
                leftIcon={<Funnel size={14} className="text-gray-400" />}
                size="sm"
              />
            </div>
            <div className="w-48 sm:w-56">
              <CustomSelect
                options={riskOptions}
                value={selectedRisk}
                onChange={setSelectedRisk}
                prefixLabel={t('credits.filter_risk')}
                size="sm"
              />
            </div>
          </div>

          {/* Expanded Columns Indicator */}
          {isCollapsed && (
            <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 px-2.5 py-1 rounded-lg">
              <ShieldCheck size={14} weight="bold" />
              <span>{t('credits.badge_extra_columns')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── AUDIT REWARD CLAIMS TABLE ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-24">{t('credits.th_id')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('credits.th_user')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('credits.th_activity')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('credits.th_amount')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('credits.th_risk')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('credits.th_status')}</th>
                {isCollapsed && (
                  <>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                      {t('credits.th_created_at')}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                      {t('credits.th_telemetry')}
                    </th>
                  </>
                )}
                <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-24">{t('credits.th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={isCollapsed ? 9 : 7} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                    <Coins size={32} className="mx-auto opacity-40" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('credits.empty_title')}</p>
                    <p className="text-xs">{t('credits.empty_desc')}</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                        {item.id}
                      </span>
                    </td>

                    {/* Contributor User */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${item.user.avatarBg}`}
                        >
                          {item.user.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 max-w-[130px] sm:max-w-[170px] lg:max-w-[210px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-gray-900 dark:text-white text-xs truncate">
                              {item.user.name}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                                roleBadgeStyles[item.user.role] || 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {t(`credits.role_${item.user.role}`)}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono truncate block">
                            {item.user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contribution Activity */}
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                      <div className="min-w-0 max-w-[140px] sm:max-w-[180px] lg:max-w-[240px]">
                        <span className="font-semibold text-gray-900 dark:text-white block truncate text-xs">
                          {t(`credits.activity_${item.activityKey}`)}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate block italic" title={item.evidenceSummary}>
                          {item.evidenceSummary}
                        </span>
                      </div>
                    </td>

                    {/* Reward Amount */}
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                        +{item.amount}
                      </span>
                    </td>

                    {/* AI Risk Assessment */}
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <RiskBadge riskLevel={item.riskLevel} />
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Adaptive Column 1: Created At (When sidebar collapsed) */}
                    {isCollapsed && (
                      <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap font-mono text-[11px] text-gray-500 dark:text-gray-400">
                        {item.createdAt}
                      </td>
                    )}

                    {/* Adaptive Column 2: Telemetry (When sidebar collapsed) */}
                    {isCollapsed && (
                      <td className="py-2.5 px-3 hidden lg:table-cell whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate max-w-[140px]">
                            {item.deviceModel || 'Thiết bị di động'}
                          </span>
                          {item.gpsDistance !== undefined && (
                            <span className="text-[10px] font-mono text-gray-400 block">
                              Độ lệch: {item.gpsDistance}m
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Action Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItem(item)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer group-hover:border-[#007b8b]/40 dark:group-hover:border-[#00c4de]/40"
                      >
                        <Eye size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                        <span>{t('credits.btn_inspect')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="px-4 py-3 border-t border-gray-200/80 dark:border-white/10">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
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

      {/* ─── AUDIT DOSSIER INSPECTION MODAL ──────────────────────────── */}
      {selectedItem && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedItem(null)}
          >
          <div
            className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de] shrink-0">
                  <CurrencyCircleDollar size={22} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                      {selectedItem.id}
                    </span>
                    <StatusBadge status={selectedItem.status} />
                    <RiskBadge riskLevel={selectedItem.riskLevel} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {t('credits.modal_title')}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Contributor Profile Card */}
              <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${selectedItem.user.avatarBg}`}
                  >
                    {selectedItem.user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {selectedItem.user.name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          roleBadgeStyles[selectedItem.user.role] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {t(`credits.role_${selectedItem.user.role}`)}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {selectedItem.user.email}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">
                    {t('credits.lbl_amount')}
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    +{selectedItem.amount} Credits
                  </span>
                </div>
              </div>

              {/* Grid 2 Columns: Telemetry & Fraud Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Activity & Payout */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                    {t('credits.lbl_activity')}
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                    {t(`credits.activity_${selectedItem.activityKey}`)}
                  </p>
                  {selectedItem.payoutMethod && (
                    <div className="pt-1 border-t border-gray-200/60 dark:border-white/5">
                      <span className="text-[10px] text-gray-400 block font-mono">{t('credits.lbl_payout_method')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                        {selectedItem.payoutMethod}
                      </span>
                    </div>
                  )}
                </div>

                {/* Telemetry & Device */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                    {t('credits.lbl_telemetry_details')}
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <DeviceMobile size={14} className="text-gray-400" />
                      <span>{selectedItem.deviceModel || 'Thiết bị di động'}</span>
                    </div>
                    {selectedItem.gpsDistance !== undefined && (
                      <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px]">
                        <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                        <span>Độ lệch GPS: {selectedItem.gpsDistance} mét</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fraud Warning / Risk Analysis Callout */}
              {selectedItem.riskLevel === 'Cảnh báo gian lận' ? (
                <div className="p-4 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400">
                  <ShieldWarning size={20} className="shrink-0 mt-0.5 text-red-600" weight="fill" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">{t('credits.lbl_risk_analysis')}</p>
                    <p className="text-xs leading-relaxed">
                      {selectedItem.riskReason || t('credits.risk_fraud_desc')}
                    </p>
                    {selectedItem.riskScore && (
                      <p className="font-mono font-bold text-[11px] text-red-800 dark:text-red-300 pt-0.5">
                        Chỉ số bất thường (Anomaly Index): {selectedItem.riskScore}/100
                      </p>
                    )}
                  </div>
                </div>
              ) : selectedItem.riskLevel === 'Nghi vấn' ? (
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300">
                  <ShieldWarning size={18} className="shrink-0 mt-0.5 text-amber-600" weight="fill" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs">{t('credits.lbl_risk_analysis')}</p>
                    <p className="text-xs leading-relaxed">
                      {selectedItem.riskReason || 'Tọa độ GPS có sự gián đoạn nhẹ. Cần rà soát ảnh chụp hiện trường.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Evidence Photo Preview (if available) */}
              {selectedItem.evidenceUrl && (
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                    {t('credits.lbl_evidence_photo')}
                  </span>
                  <div className="relative aspect-16/9 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40">
                    <img
                      src={selectedItem.evidenceUrl}
                      alt="Audit Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Evidence Description */}
              <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-mono text-[10px] uppercase font-bold">
                  <FileText size={14} />
                  <span>{t('credits.lbl_evidence')}</span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-xs bg-white dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                  {selectedItem.evidenceSummary}
                </p>
              </div>

              {/* Audit Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-2 border-t border-gray-100 dark:border-white/10">
                <span>{t('credits.lbl_time')}: {selectedItem.createdAt}</span>
                {selectedItem.reviewedBy && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {t('credits.lbl_reviewed_by')} {selectedItem.reviewedBy} ({selectedItem.reviewedAt})
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('credits.btn_close')}
              </button>

              {selectedItem.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedItem.id, 'Rejected')}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-xs"
                  >
                    {t('credits.btn_reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedItem.id, 'Approved')}
                    className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer text-xs"
                  >
                    {t('credits.btn_approve')}
                  </button>
                </div>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedItem.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border dark:border-emerald-500/30'
                      : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border dark:border-red-500/30'
                  }`}
                >
                  {selectedItem.status === 'Approved'
                    ? t('credits.tag_approved')
                    : t('credits.tag_rejected')}
                </span>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
