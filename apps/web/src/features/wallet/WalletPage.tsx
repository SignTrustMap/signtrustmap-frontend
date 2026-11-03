import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
  CircleNotch,
  ArrowClockwise,
  Fire,
  ArrowRight,
  Wallet,
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

export default function WalletPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  // ─── Real Wallet Data from NestJS Backend ────────────────────────────────
  const [balance, setBalance] = useState<number>(user?.credits || 0)
  const [isFrozen, setIsFrozen] = useState<boolean>(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

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

  // ─── 1. Fetch Wallet Balance from Backend ──────────────────────────────────
  const fetchWallet = useCallback(async () => {
    try {
      setIsLoadingWallet(true)
      const res = await walletService.getWallet()
      if (res?.wallet) {
        setBalance(res.wallet.balance)
        setIsFrozen(res.wallet.isFrozen ?? false)
      }
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch live wallet:', err)
    } finally {
      setIsLoadingWallet(false)
    }
  }, [])

  // ─── 2. Fetch Packages from Backend ───────────────────────────────────────
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

  // ─── 3. Fetch Transactions from Backend ───────────────────────────────────
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

  // ─── 4. Fetch Daily Tasks & Missions from Backend ─────────────────────────
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
    fetchWallet()
    fetchPackages()
    fetchDailyTasks()
  }, [fetchWallet, fetchPackages, fetchDailyTasks])

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
      setBalance((prev) => prev + reward)
      toast.success(`+${reward} Credits cho nhiệm vụ ${task.name}`)
      await fetchWallet()
      await fetchDailyTasks()
      await fetchTransactions(currentPage, pageSize)
    } catch (err: any) {
      toast.error(err.message || 'Chưa thể nhận thưởng nhiệm vụ lúc này')
    } finally {
      setClaimingTaskId(null)
    }
  }

  // ─── Payment Success Callback from Modal ──────────────────────────────────
  const handlePaymentSuccess = async () => {
    await fetchWallet()
    await fetchTransactions(currentPage, pageSize)
  }

  const formatTxType = (type?: string, description?: string) => {
    if (description && description.trim().length > 0) return description
    const tUpper = (type || '').toUpperCase()
    switch (tUpper) {
      case 'TOPUP':
      case 'TOP_UP':
        return 'Nạp Credits vào ví'
      case 'SURVEY_REWARD':
        return 'Thưởng khảo sát biển báo'
      case 'REVIEW_REWARD':
        return 'Thưởng duyệt biển báo đồng thuận'
      case 'DAILY_CLAIM':
      case 'DAILY_REWARD':
        return 'Thưởng nhiệm vụ đóng góp'
      case 'NAVIGATION_FEE':
        return 'Phí điều hướng thông minh'
      case 'ADMIN_ADJUSTMENT':
        return 'Điều chỉnh số dư từ quản trị'
      default:
        return type || 'Giao dịch Credits'
    }
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ─── Header & Quick Balance Bar ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={t('wallet.title')}
            subtitle={t('wallet.subtitle')}
            badge={t('wallet.economy_badge')}
          />

          {/* User Quick Balance Bar */}
          <div
            className={`flex items-center gap-3 p-3 sm:px-4 rounded-2xl border shadow-xs shrink-0 ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Số dư ví
                </span>
                <button
                  type="button"
                  onClick={fetchWallet}
                  disabled={isLoadingWallet}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Làm mới số dư"
                >
                  <ArrowClockwise
                    size={12}
                    className={
                      isLoadingWallet
                        ? isDark
                          ? 'animate-spin text-[#00c4de]'
                          : 'animate-spin text-[#007b8b]'
                        : ''
                    }
                  />
                </button>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black text-amber-500 tracking-tight">
                  {isLoadingWallet ? '—' : balance.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Credits</span>
                <span className="text-[11px] text-gray-400 ml-1">
                  ≈ {(balance * 100).toLocaleString('vi-VN')} đ
                </span>
                {isFrozen && (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded ml-1.5">
                    Đóng băng
                  </span>
                )}
              </div>
            </div>

            {currentStreak > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Fire size={14} weight="fill" className="text-amber-500" />
                  <span>{currentStreak} ngày đóng góp</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Main Content Layout ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Left Column (7 cols): Top-up Selector & Daily Challenges ─ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top-up Selection Card */}
            <div
              className={`rounded-2xl border p-6 sm:p-7 shadow-xs space-y-5 ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Chọn số tiền nạp Credits
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Chọn gói có sẵn hoặc nhập số lượng Credits cần nạp
                  </p>
                </div>
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
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
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
                        <span className="inline-block mt-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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

            {/* Daily Contributor Challenges Card */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-3.5 ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle size={18} weight="fill" className="text-amber-500" />
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Nhiệm vụ đóng góp hằng ngày
                  </h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {dailyTasks.length > 0
                    ? `${dailyTasks.filter((t) => t.isCompleted).length}/${dailyTasks.length} hoàn thành`
                    : 'Đóng góp nhận Credits'}
                </span>
              </div>

              {dailyTasks.length > 0 ? (
                <div className="space-y-2">
                  {dailyTasks.slice(0, 3).map((task) => {
                    const isTaskDone = task.isCompleted || task.isClaimed
                    const canClaim = task.isClaimable && !task.isClaimed
                    const progressPercent = Math.min(
                      100,
                      Math.round((task.progress / (task.targetCount || 1)) * 100)
                    )

                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900 dark:text-white truncate">
                              {task.name}
                            </span>
                            <span className="font-extrabold text-amber-500 ml-2 shrink-0">
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
                              Tiến độ: {task.progress}/{task.targetCount}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {canClaim ? (
                            <button
                              type="button"
                              disabled={claimingTaskId === task.id}
                              onClick={() => handleClaimTaskReward(task)}
                              className="px-3 py-1 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                            >
                              {claimingTaskId === task.id ? 'Đang nhận...' : 'Nhận thưởng'}
                            </button>
                          ) : task.isClaimed ? (
                            <span className="text-emerald-500 font-bold text-xs">✓ Đã nhận</span>
                          ) : (
                            <Link
                              to={task.activityType === 'SURVEY' ? '/studio' : '/reviews/candidates'}
                              className="text-[#007b8b] dark:text-[#00c4de] hover:underline font-bold text-xs"
                            >
                              Làm ngay ➔
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">+20 Credits</span>
                      <span className="text-gray-500 text-[11px]">Khảo sát video Dashcam</span>
                    </div>
                    <Link to="/studio" className="text-[#007b8b] dark:text-[#00c4de] font-bold">
                      Khảo sát ➔
                    </Link>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">+5 Credits</span>
                      <span className="text-gray-500 text-[11px]">Duyệt biển báo AI phát hiện</span>
                    </div>
                    <Link
                      to="/reviews/candidates"
                      className="text-[#007b8b] dark:text-[#00c4de] font-bold"
                    >
                      Duyệt biển ➔
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column (5 cols): Order Summary & Modal Trigger ─── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div
              className={`rounded-2xl border p-6 sm:p-7 shadow-lg transition-all space-y-5 ${
                isDark
                  ? 'bg-[#071317] border-white/10 shadow-black/40'
                  : 'bg-white border-[#E8E4E3]'
              }`}
            >
              <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Tóm tắt đơn nạp
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                  Xác nhận đơn nạp
                </h3>
              </div>

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
                  <span className="text-2xl font-mono font-black text-[#007b8b] dark:text-[#00c4de]">
                    {effectivePriceVnd.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Primary CTA Button: Opens Payment Checkout Modal */}
              <button
                type="button"
                disabled={effectiveCredits <= 0}
                onClick={() => setIsCheckoutModalOpen(true)}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isDark
                    ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black active:scale-98'
                    : 'bg-[#007b8b] hover:bg-[#00606d] text-white active:scale-98'
                }`}
              >
                <Wallet size={18} weight="bold" />
                <span>Tiến hành thanh toán</span>
                <ArrowRight size={16} weight="bold" />
              </button>

              <div className="text-[11px] text-gray-400 space-y-1 text-center leading-relaxed">
                <p>✓ Tự động cộng Credits sau khi hoàn tất giao dịch.</p>
                <p>✓ Credits vĩnh viễn không có thời hạn sử dụng.</p>
              </div>
            </div>
          </div>
        </div>

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
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft size={16} weight="bold" />
                        ) : (
                          <ArrowUpRight size={16} weight="bold" />
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
