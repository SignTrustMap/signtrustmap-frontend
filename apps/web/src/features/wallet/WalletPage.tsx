import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CircleNotch,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  walletService,
  type TopUpPackage,
  type WalletTransaction,
  DEFAULT_TOP_UP_PACKAGES,
} from '@/api/services/wallet.service'
import {
  dailyTasksService,
  type DailyTaskItem,
  type MissionsOverviewResponse,
} from '@/api/services/daily-tasks.service'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal'

type TransactionFilter = 'ALL' | 'IN' | 'OUT'
type WalletTab = 'TOPUP' | 'MISSIONS'

export default function WalletPage() {
  const { claimDailyBonus } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  // ─── Top-level Tab Navigation ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<WalletTab>('TOPUP')

  // ─── Top-up Packages & Custom Amount State ───────────────────────────────
  const [packages, setPackages] = useState<TopUpPackage[]>(DEFAULT_TOP_UP_PACKAGES)
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)
  const [customCredits, setCustomCredits] = useState<number>(300)

  // ─── Payment Checkout Modal State ─────────────────────────────────────────
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false)

  // ─── Transactions State & Filters ─────────────────────────────────────────
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState<number>(0)
  const [isLoadingTx, setIsLoadingTx] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [txFilter, setTxFilter] = useState<TransactionFilter>('ALL')

  // ─── Daily Contributor Tasks & Missions State ─────────────────────────────
  const [dailyTasks, setDailyTasks] = useState<DailyTaskItem[]>([])
  const [missions, setMissions] = useState<MissionsOverviewResponse | null>(null)
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null)

  // Clean package name helper (removes any English parentheses)
  const cleanPackageName = (name: string): string => {
    return name.replace(/\s*\([^)]*\)/g, '').trim()
  }

  // Active selected package
  const selectedPackage = useMemo(() => {
    if (isCustomMode) return null
    return packages.find((p) => p.id === selectedPkgId) || packages[0] || null
  }, [packages, selectedPkgId, isCustomMode])

  // Calculated Credits & VND
  const effectiveCredits = isCustomMode
    ? customCredits
    : (selectedPackage?.creditAmount || 0) + (selectedPackage?.bonusCredits || 0)

  const effectivePriceVnd = isCustomMode
    ? customCredits * 100
    : Math.round(Number(selectedPackage?.priceVnd || 0))

  // ─── 1. Fetch Packages from Backend ───────────────────────────────────────
  const fetchPackages = useCallback(async () => {
    try {
      setIsLoadingPackages(true)
      const pkgs = await walletService.getTopupPackages()
      setPackages(pkgs)
      if (pkgs.length > 0 && selectedPkgId === null) {
        setSelectedPkgId(pkgs[0].id)
      }
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch top-up packages:', err)
      setPackages(DEFAULT_TOP_UP_PACKAGES)
      if (selectedPkgId === null) {
        setSelectedPkgId(DEFAULT_TOP_UP_PACKAGES[0].id)
      }
    } finally {
      setIsLoadingPackages(false)
    }
  }, [selectedPkgId])

  // ─── 2. Fetch Transactions from Backend ───────────────────────────────────
  const fetchTransactions = useCallback(async (page: number, size: number) => {
    try {
      setIsLoadingTx(true)
      const res = await walletService.getTransactions({ page, pageSize: size })
      if (res && Array.isArray(res.items)) {
        setTransactions(res.items)
        setTotalTransactions(res.total)
      }
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch transactions:', err)
    } finally {
      setIsLoadingTx(false)
    }
  }, [])

  // ─── 3. Fetch Daily Tasks & Missions from Backend ─────────────────────────
  const fetchDailyTasks = useCallback(async () => {
    try {
      const [tasks, missionData] = await Promise.all([
        dailyTasksService.getTasks(),
        dailyTasksService.getMissions(),
      ])

      setDailyTasks(tasks)
      setMissions(missionData)
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch daily tasks:', err)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
    fetchDailyTasks()
  }, [fetchPackages, fetchDailyTasks])

  useEffect(() => {
    fetchTransactions(currentPage, pageSize)
  }, [fetchTransactions, currentPage, pageSize])

  // ─── Claim Contributor Daily Task Reward ──────────────────────────────────
  const handleClaimTaskReward = async (task: DailyTaskItem) => {
    if (!task.isClaimable || task.isClaimed || claimingTaskId !== null) return
    setClaimingTaskId(task.id)
    try {
      await dailyTasksService.claim(task.id)
      const reward = task.rewardCredits || 10
      claimDailyBonus(reward)
      toast.success(`+${reward} Credits cho nhiệm vụ ${task.name}`)
      await fetchDailyTasks()
      await fetchTransactions(currentPage, pageSize)
    } catch (err: any) {
      toast.error(err.message || 'Chưa thể nhận thưởng nhiệm vụ lúc này')
    } finally {
      setClaimingTaskId(null)
    }
  }

  // ─── Payment Success Callback from Modal ──────────────────────────────────
  const handlePaymentSuccess = async (creditedCredits: number) => {
    claimDailyBonus(creditedCredits)
    await fetchTransactions(currentPage, pageSize)
  }

  const formatTxType = (type?: string, description?: string) => {
    const raw = (description || '').trim()
    const tUpper = (type || '').toUpperCase()

    // 1. Map known types or description text to clean Vietnamese without parentheses
    if (tUpper === 'REVIEW_REWARD' || raw.toLowerCase().includes('review reward')) {
      return 'Thưởng duyệt biển báo đồng thuận'
    }
    if (tUpper === 'SURVEY_REWARD' || raw.toLowerCase().includes('survey reward')) {
      return 'Thưởng khảo sát biển báo'
    }
    if (
      tUpper === 'TOPUP' ||
      tUpper === 'TOP_UP' ||
      raw.toLowerCase().includes('topup') ||
      raw.toLowerCase().includes('top-up') ||
      raw.toLowerCase().includes('nạp')
    ) {
      return 'Nạp Credits vào ví'
    }
    if (
      tUpper === 'DAILY_CLAIM' ||
      tUpper === 'DAILY_REWARD' ||
      raw.toLowerCase().includes('daily') ||
      raw.toLowerCase().includes('nhiệm vụ')
    ) {
      return 'Thưởng nhiệm vụ đóng góp'
    }
    if (tUpper === 'NAVIGATION_FEE' || raw.toLowerCase().includes('navigation')) {
      return 'Phí điều hướng thông minh'
    }
    if (tUpper === 'ADMIN_ADJUSTMENT' || raw.toLowerCase().includes('admin')) {
      return 'Điều chỉnh số dư từ quản trị'
    }

    // 2. If description has content, strip any parentheses and explanations inside them
    if (raw.length > 0) {
      const sanitized = raw.replace(/\s*\([^)]*\)/g, '').trim()
      if (sanitized.length > 0) return sanitized
    }

    return type ? type.replace(/_/g, ' ') : 'Giao dịch Credits'
  }

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'IN') return transactions.filter((t) => Number(t.amount) > 0)
    if (txFilter === 'OUT') return transactions.filter((t) => Number(t.amount) < 0)
    return transactions
  }, [transactions, txFilter])

  const currentStreak = missions?.streak?.currentDays || 0

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-10 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-7">
        {/* ─── Page Header ───────────────────────────────────────────── */}
        <PageHeader
          title={t('wallet.title')}
          subtitle={t('wallet.subtitle')}
        />

        {/* ─── Top-level Navigation Tabs (Cách 1) ──────────────────────── */}
        <div className="flex border-b border-gray-200 dark:border-white/10 gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('TOPUP')}
            className={`pb-3 text-sm font-extrabold transition-all relative cursor-pointer ${
              activeTab === 'TOPUP'
                ? isDark
                  ? 'text-[#00c4de]'
                  : 'text-[#007b8b]'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <span>Nạp Credits</span>
            {activeTab === 'TOPUP' && (
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                  isDark ? 'bg-[#00c4de]' : 'bg-[#007b8b]'
                }`}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MISSIONS')}
            className={`pb-3 text-sm font-extrabold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'MISSIONS'
                ? isDark
                  ? 'text-[#00c4de]'
                  : 'text-[#007b8b]'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <span>Nhiệm vụ đóng góp</span>
            {currentStreak > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {currentStreak} ngày chuỗi
              </span>
            )}
            {activeTab === 'MISSIONS' && (
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                  isDark ? 'bg-[#00c4de]' : 'bg-[#007b8b]'
                }`}
              />
            )}
          </button>
        </div>

        {/* ─── TAB 1: Nạp Credits (Dedicated Checkout Workflow) ───────── */}
        {activeTab === 'TOPUP' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (7 cols): Top-up Selector */}
            <div className="lg:col-span-7 h-full">
              <div
                className={`rounded-2xl border p-6 shadow-xs h-full flex flex-col justify-between ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                      Chọn số tiền nạp Credits
                    </h3>
                    {isLoadingPackages && (
                      <CircleNotch
                        size={16}
                        className={`animate-spin ${
                          isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Preset Packages Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {packages.map((pkg) => {
                      const isSelected = !isCustomMode && selectedPkgId === pkg.id
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            setIsCustomMode(false)
                            setSelectedPkgId(pkg.id)
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? isDark
                                ? 'bg-[#00c4de]/10 border-2 border-[#00c4de] text-white shadow-xs'
                                : 'bg-teal-50/70 border-2 border-[#007b8b] text-gray-900 shadow-xs'
                              : isDark
                              ? 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                              : 'bg-gray-50/70 border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-extrabold text-sm block">
                              {Math.round(Number(pkg.priceVnd)).toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 block mt-0.5">
                              +{pkg.creditAmount} Credits
                            </span>
                          </div>

                          {(pkg.bonusCredits || 0) > 0 && (
                            <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              +{pkg.bonusCredits} thưởng
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Credits Field */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        Hoặc nhập số Credits tùy ý:
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        Tỷ lệ 100 đ cho 1 Credit
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min={50}
                        max={50000}
                        step={50}
                        value={isCustomMode ? customCredits || '' : ''}
                        onFocus={() => setIsCustomMode(true)}
                        onChange={(e) => {
                          setIsCustomMode(true)
                          setCustomCredits(Math.max(0, parseInt(e.target.value, 10) || 0))
                        }}
                        placeholder="Ví dụ: 300, 1500..."
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors outline-none ${
                          isCustomMode
                            ? isDark
                              ? 'bg-black/30 border-[#00c4de] text-white'
                              : 'bg-white border-[#007b8b] text-gray-900 shadow-xs'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-gray-300'
                            : 'bg-gray-50/70 border-gray-200 text-gray-700'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isCustomMode && customCredits > 0 && (
                          <span className="font-mono text-xs font-bold text-amber-500 dark:text-amber-400">
                            = {(customCredits * 100).toLocaleString('vi-VN')} đ
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-400">Credits</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Order Summary & Checkout Trigger */}
            <div className="lg:col-span-5 h-full">
              <div
                className={`rounded-2xl border p-6 shadow-xs h-full flex flex-col justify-between ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">
                    Xác nhận đơn nạp
                  </h3>

                  {/* Order Line Items */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Gói đã chọn:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {isCustomMode
                          ? 'Nạp số lượng tùy chỉnh'
                          : cleanPackageName(selectedPackage?.packageName || '')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Credits nhận được:</span>
                      <span className="font-black text-amber-500 dark:text-amber-400 text-sm">
                        +{effectiveCredits.toLocaleString('vi-VN')} Credits
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Tỷ giá quy đổi:</span>
                      <span className="font-mono text-gray-500 dark:text-gray-400">
                        100 đ cho 1 Credit
                      </span>
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/10 pt-3 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Tổng thanh toán:
                      </span>
                      <span className="text-xl font-mono font-black text-[#007b8b] dark:text-[#00c4de]">
                        {effectivePriceVnd.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    disabled={effectiveCredits <= 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className={`w-full py-3 rounded-xl font-extrabold text-sm transition-all shadow-md cursor-pointer ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black active:scale-98'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white active:scale-98'
                    }`}
                  >
                    Tiến hành thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: Nhiệm vụ đóng góp (Dedicated Contributor Hub) ───── */}
        {activeTab === 'MISSIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (5 cols): Combined Streak & Weekly Challenges */}
            <div className="lg:col-span-5 h-full">
              <div
                className={`rounded-2xl border p-6 shadow-xs h-full flex flex-col justify-between ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="space-y-5">
                  {/* Streak Challenge */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          {missions?.streak?.title || 'Chuỗi đóng góp 7 ngày'}
                        </h3>
                        {missions?.streak?.badgeEarned && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Đã đạt huy hiệu
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-amber-500 dark:text-amber-400">
                        +{missions?.streak?.bonusCredits || 50} Credits thưởng
                      </span>
                    </div>

                    {/* Visual 7-day progress bars */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {Array.from({ length: missions?.streak?.requiredDays || 7 }).map((_, index) => {
                        const dayNum = index + 1
                        const isReached = currentStreak >= dayNum
                        return (
                          <div key={dayNum} className="space-y-1.5 text-center">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isReached
                                  ? isDark
                                    ? 'bg-[#00c4de]'
                                    : 'bg-[#007b8b]'
                                  : 'bg-gray-200 dark:bg-white/10'
                              }`}
                            />
                            <span className="text-[11px] font-mono font-medium text-gray-400 block">
                              {dayNum}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                      <span>
                        Tiến độ: <strong className="text-gray-900 dark:text-white">{currentStreak} / {missions?.streak?.requiredDays || 7} ngày</strong>
                      </span>
                      <span>
                        {currentStreak >= (missions?.streak?.requiredDays || 7)
                          ? 'Đã đạt mốc thưởng'
                          : `Còn ${(missions?.streak?.requiredDays || 7) - (currentStreak % (missions?.streak?.requiredDays || 7))} ngày`}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Missions Section */}
                  {missions?.weekly && (
                    <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {missions.weekly.title}
                        </h4>
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                          +{missions.weekly.bonusCredits} Credits tuần
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            missions.weekly.completed
                              ? 'bg-emerald-500'
                              : isDark
                              ? 'bg-[#00c4de]'
                              : 'bg-[#007b8b]'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (missions.weekly.completedMissions / missions.weekly.target) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          Tiến độ tuần: {missions.weekly.completedMissions} / {missions.weekly.target} nhiệm vụ
                        </span>
                        <span>{missions.weekly.completed ? 'Đã hoàn thành' : 'Đang thực hiện'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Daily Contributor Challenges List */}
            <div className="lg:col-span-7 h-full">
              <div
                className={`rounded-2xl border p-6 shadow-xs h-full flex flex-col justify-between ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                      Nhiệm vụ hằng ngày
                    </h3>
                    <span className="text-xs text-gray-500 font-medium">
                      {dailyTasks.length > 0
                        ? `${dailyTasks.filter((t) => t.isCompleted).length} / ${dailyTasks.length} hoàn thành`
                        : 'Đóng góp nhận Credits'}
                    </span>
                  </div>

                  {dailyTasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {dailyTasks.map((task) => {
                        const isTaskDone = task.isCompleted || task.isClaimed
                        const canClaim = task.isClaimable && !task.isClaimed
                        const progressPercent = Math.min(
                          100,
                          Math.round((task.progress / (task.targetCount || 1)) * 100)
                        )

                        return (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-gray-900 dark:text-white truncate">
                                  {task.name}
                                </span>
                                <span className="font-bold text-amber-500 ml-2 shrink-0">
                                  +{task.rewardCredits} Credits
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isTaskDone
                                      ? 'bg-emerald-500'
                                      : isDark
                                      ? 'bg-[#00c4de]'
                                      : 'bg-[#007b8b]'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                                <span>
                                  Tiến độ: {task.progress} / {task.targetCount}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 ml-1">
                              {canClaim ? (
                                <button
                                  type="button"
                                  disabled={claimingTaskId === task.id}
                                  onClick={() => handleClaimTaskReward(task)}
                                  className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                                >
                                  {claimingTaskId === task.id ? 'Đang nhận...' : 'Nhận thưởng'}
                                </button>
                              ) : task.isClaimed ? (
                                <span className="text-emerald-500 font-bold text-xs px-2">Đã nhận</span>
                              ) : (
                                <Link
                                  to={task.activityType === 'SURVEY' ? '/studio' : '/reviews/candidates'}
                                  className="inline-block px-3 py-1.5 rounded-lg font-bold text-xs border border-[#007b8b]/30 text-[#007b8b] hover:bg-[#007b8b]/10 dark:border-[#00c4de]/30 dark:text-[#00c4de] dark:hover:bg-[#00c4de]/10 transition-colors"
                                >
                                  Làm ngay
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-amber-600 dark:text-amber-400 block">+20 Credits</span>
                          <span className="text-gray-500 text-[11px]">Khảo sát video Dashcam</span>
                        </div>
                        <Link
                          to="/studio"
                          className="px-3 py-1 rounded-lg font-bold text-xs border border-[#007b8b]/30 text-[#007b8b] hover:bg-[#007b8b]/10 dark:border-[#00c4de]/30 dark:text-[#00c4de]"
                        >
                          Khảo sát
                        </Link>
                      </div>
                      <div className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">+5 Credits</span>
                          <span className="text-gray-500 text-[11px]">Duyệt biển báo AI phát hiện</span>
                        </div>
                        <Link
                          to="/reviews/candidates"
                          className="px-3 py-1 rounded-lg font-bold text-xs border border-[#007b8b]/30 text-[#007b8b] hover:bg-[#007b8b]/10 dark:border-[#00c4de]/30 dark:text-[#00c4de]"
                        >
                          Duyệt biển
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Bottom Section: Transaction History ─────────────────────── */}
        <div
          className={`rounded-2xl border shadow-xs overflow-hidden mt-8 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
          }`}
        >
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {t('wallet.history_title')}
              </h2>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10">
                {t('wallet.history_count', { count: totalTransactions })}
              </span>
            </div>

            {/* Transaction Filter Tabs */}
            <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-white/10 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setTxFilter('ALL')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  txFilter === 'ALL'
                    ? 'bg-white dark:bg-[#071317] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setTxFilter('IN')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  txFilter === 'IN'
                    ? 'bg-white dark:bg-[#071317] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Cộng điểm
              </button>
              <button
                type="button"
                onClick={() => setTxFilter('OUT')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  txFilter === 'OUT'
                    ? 'bg-white dark:bg-[#071317] text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Khấu trừ
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoadingTx ? (
              <div className="p-10 text-center text-gray-400">
                <CircleNotch
                  size={24}
                  className={`animate-spin mx-auto mb-2 ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                />
                <p className="text-xs">Đang tải lịch sử giao dịch...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                Chưa có giao dịch nào được ghi nhận.
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = Number(tx.amount) > 0
                return (
                  <div
                    key={tx.id}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft size={14} weight="bold" />
                        ) : (
                          <ArrowUpRight size={14} weight="bold" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {formatTxType(tx.transactionType, tx.description)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                          <span className="truncate max-w-[120px]">{tx.id}</span>
                          <span>•</span>
                          <span>{new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm sm:text-base font-extrabold block ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} Credits
                      </span>
                      {tx.balanceAfter !== undefined && tx.balanceAfter !== null && (
                        <span className="text-[11px] text-gray-400 block font-mono">
                          Số dư: {tx.balanceAfter}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Shared Pagination */}
          {totalTransactions > pageSize && (
            <div className="p-4 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={totalTransactions}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[5, 10, 20]}
                itemLabel={t('wallet.unit_transactions')}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Professional Payment Checkout Modal ────────────────────── */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        isDark={isDark}
        packageItem={selectedPackage}
        isCustomMode={isCustomMode}
        customCredits={customCredits}
        effectiveCredits={effectiveCredits}
        effectivePriceVnd={effectivePriceVnd}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
