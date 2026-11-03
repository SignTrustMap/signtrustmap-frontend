import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Gift,
  Copy,
  Check,
  CircleNotch,
  ArrowClockwise,
  ArrowSquareOut,
  Fire,
  QrCode,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  walletService,
  type TopUpPackage,
  type WalletTransaction,
  type TopUpOrderResponse,
  type PaymentGatewayOption,
  AVAILABLE_PAYMENT_GATEWAYS,
  DEFAULT_TOP_UP_PACKAGES,
} from '@/api/services/wallet.service'
import {
  dailyTasksService,
  type DailyTaskItem,
  type MissionsOverviewResponse,
} from '@/api/services/daily-tasks.service'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'

type TransactionFilter = 'ALL' | 'IN' | 'OUT'

export default function WalletPage() {
  const { user, claimDailyBonus } = useAuth()
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
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(2) // Default: Gói Tiêu chuẩn 100k
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)
  const [customCredits, setCustomCredits] = useState<number>(300)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayOption['id']>('VIETQR')

  // ─── Transactions State & Filters ─────────────────────────────────────────
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState<number>(0)
  const [isLoadingTx, setIsLoadingTx] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [txFilter, setTxFilter] = useState<TransactionFilter>('ALL')

  // ─── Daily Tasks & Missions State ─────────────────────────────────────────
  const [dailyTasks, setDailyTasks] = useState<DailyTaskItem[]>([])
  const [missions, setMissions] = useState<MissionsOverviewResponse | null>(null)
  const [isClaimingDaily, setIsClaimingDaily] = useState(false)
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null)

  // Today's date string for idempotency & local persistence
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const dailyStorageKey = useMemo(
    () => `stm_daily_claimed_${user?.id || 'guest'}_${todayStr}`,
    [user?.id, todayStr]
  )
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    return localStorage.getItem(dailyStorageKey) === 'true'
  })

  // ─── Inline Order & Payment State ─────────────────────────────────────────
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [activeOrder, setActiveOrder] = useState<TopUpOrderResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Clean package name helper (remove any English parentheses)
  const cleanPackageName = (name: string): string => {
    return name.replace(/\s*\([^)]*\)/g, '').trim()
  }

  // Active selected package
  const selectedPackage = useMemo(() => {
    if (isCustomMode) return null
    return packages.find((p) => p.id === selectedPkgId) || packages[0]
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
        const popular = pkgs.find((p) => p.isPopular) || pkgs[0]
        setSelectedPkgId(popular.id)
      }
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch top-up packages:', err)
      setPackages(DEFAULT_TOP_UP_PACKAGES)
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

      console.log('=== [Nhiệm vụ đóng góp hôm nay] ===')
      console.log('API /api/v1/daily-tasks trả về:', tasks)
      console.log('Tổng quan tiến độ nhiệm vụ và chuỗi streak:', missionData)

      setDailyTasks(tasks)
      setMissions(missionData)

      const loginTask = tasks.find(
        (t) =>
          t.taskCode.toUpperCase().includes('LOGIN') ||
          t.taskCode.toUpperCase().includes('CLAIM') ||
          t.activityType === 'LOGIN'
      )
      if (loginTask?.isClaimed) {
        setClaimedToday(true)
        localStorage.setItem(dailyStorageKey, 'true')
      } else {
        const stored = localStorage.getItem(dailyStorageKey) === 'true'
        setClaimedToday(stored)
      }
    } catch {
      const stored = localStorage.getItem(dailyStorageKey) === 'true'
      setClaimedToday(stored)
    }
  }, [dailyStorageKey])

  useEffect(() => {
    fetchWallet()
    fetchPackages()
    fetchDailyTasks()
  }, [fetchWallet, fetchPackages, fetchDailyTasks])

  useEffect(() => {
    fetchTransactions(currentPage, pageSize)
  }, [fetchTransactions, currentPage, pageSize])

  // ─── Daily Check-in Bonus Action ──────────────────────────────────────────
  const handleClaimDaily = async () => {
    if (claimedToday || isClaimingDaily) return
    const bonus = 25
    setIsClaimingDaily(true)

    try {
      const loginTask = dailyTasks.find(
        (t) =>
          (t.taskCode.toUpperCase().includes('LOGIN') ||
            t.taskCode.toUpperCase().includes('CLAIM') ||
            t.activityType === 'LOGIN') &&
          !t.isClaimed
      )
      if (loginTask) {
        try {
          await dailyTasksService.claim(loginTask.id)
        } catch (err: any) {
          console.warn('[Wallet] Backend claim task notice:', err?.message)
        }
      }

      claimDailyBonus(bonus)
      setBalance((prev) => prev + bonus)
      setClaimedToday(true)
      localStorage.setItem(dailyStorageKey, 'true')
      toast.success(`+${bonus} Credits: ${t('wallet.tx_daily_reward')}`)

      setTransactions((prev) => [
        {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          transactionType: 'DAILY_CLAIM',
          description: t('wallet.tx_daily_reward'),
          amount: bonus,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setTotalTransactions((prev) => prev + 1)

      await fetchWallet()
      await fetchDailyTasks()
    } finally {
      setIsClaimingDaily(false)
    }
  }

  // ─── Claim Contributor Daily Task Reward ──────────────────────────────────
  const handleClaimTaskReward = async (task: DailyTaskItem) => {
    if (!task.isClaimable || task.isClaimed || claimingTaskId !== null) return
    setClaimingTaskId(task.id)
    try {
      await dailyTasksService.claim(task.id)
      const reward = task.rewardCredits || 10
      claimDailyBonus(reward)
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

  // ─── Create Top-up Order with Backend (Inline) ────────────────────────────
  const handleCreateOrder = async () => {
    try {
      setIsCreatingOrder(true)
      let res: TopUpOrderResponse
      const idempotencyKey = `stm_web_${Date.now()}`

      if (isCustomMode) {
        if (customCredits <= 0) {
          toast.error('Vui lòng nhập số lượng Credits hợp lệ')
          return
        }
        res = await walletService.topUpCustom(customCredits, selectedGateway, idempotencyKey)
      } else if (selectedPackage) {
        res = await walletService.topUp(selectedPackage.id, selectedGateway, idempotencyKey)
      } else {
        return
      }

      setActiveOrder(res)

      // Sandbox Mode: instant credit
      if (selectedGateway === 'MOCK' || res.paymentOrder?.status === 'COMPLETED') {
        setPaymentSuccess(true)
        const credited = effectiveCredits
        toast.success(`Nạp thành công +${credited} Credits`)
        claimDailyBonus(credited)
        await fetchWallet()
        await fetchTransactions(currentPage, pageSize)
        setTimeout(() => {
          setPaymentSuccess(false)
          setActiveOrder(null)
        }, 2200)
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo đơn nạp tiền. Vui lòng thử lại.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // ─── Confirm Paid (VietQR) ────────────────────────────────────────────────
  const handleConfirmPaid = async () => {
    setPaymentSuccess(true)
    toast.success('Hệ thống đang đối soát giao dịch VietQR của bạn.')
    await fetchWallet()
    await fetchTransactions(currentPage, pageSize)

    setTimeout(() => {
      setPaymentSuccess(false)
      setActiveOrder(null)
    }, 2200)
  }

  // ─── Copy to Clipboard Helper ─────────────────────────────────────────────
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Đã sao chép: ${text}`)
    setTimeout(() => setCopiedField(null), 2000)
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
        return 'Thưởng điểm danh hàng ngày'
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
        {/* ─── Compact Header & Wallet Quick Bar ──────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={t('wallet.title')}
            subtitle={t('wallet.subtitle')}
            badge={t('wallet.economy_badge')}
          />

          {/* User Quick Balance Bar (ZyPage / Gank inspired pill) */}
          <div
            className={`flex items-center gap-3 p-3 sm:px-4 rounded-2xl border shadow-xs shrink-0 ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
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
                    className={isLoadingWallet ? 'animate-spin text-[#00c4de]' : ''}
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

            <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />

            {/* Streak & Checkin Pill */}
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Fire size={14} weight="fill" className="text-amber-500" />
                  <span>{currentStreak} ngày</span>
                </div>
              )}

              <button
                type="button"
                disabled={claimedToday || isClaimingDaily}
                onClick={handleClaimDaily}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  claimedToday
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-not-allowed'
                    : isDark
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 active:scale-95'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-105 active:scale-95'
                }`}
              >
                {isClaimingDaily ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  <Gift size={14} weight={claimedToday ? 'fill' : 'bold'} />
                )}
                <span>{claimedToday ? 'Đã nhận +25' : 'Điểm danh +25'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content: ZyPage / Gank Inspired Split Layout ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Left Column (7 cols): Top-up Selector & Daily Missions ─── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top-up Selection Card */}
            <div
              className={`rounded-2xl border p-6 sm:p-7 shadow-xs space-y-6 ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              {/* Step 1: Select Amount */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00c4de] text-black font-extrabold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                      Chọn số tiền nạp Credits
                    </h3>
                  </div>
                  {isLoadingPackages && (
                    <CircleNotch size={16} className="animate-spin text-[#00c4de]" />
                  )}
                </div>

                {/* Preset Chips Grid (ZyPage Style) */}
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
                          setActiveOrder(null)
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? isDark
                              ? 'bg-[#00c4de]/10 border-2 border-[#00c4de] text-white shadow-xs'
                              : 'bg-teal-50/70 border-2 border-[#007b8b] text-gray-900 shadow-xs'
                            : isDark
                            ? 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {pkg.isPopular && (
                          <span
                            className={`absolute -top-2 right-2 px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                              isDark ? 'bg-[#00c4de] text-black' : 'bg-[#007b8b] text-white'
                            }`}
                          >
                            Phổ biến
                          </span>
                        )}

                        <div>
                          <span className="font-mono font-extrabold text-sm block">
                            {Math.round(Number(pkg.priceVnd)).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="text-xs font-bold text-amber-500 block mt-0.5">
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

                {/* Custom Amount Field (ZyPage Style) */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
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
                      onFocus={() => {
                        setIsCustomMode(true)
                        setActiveOrder(null)
                      }}
                      onChange={(e) => {
                        setIsCustomMode(true)
                        setCustomCredits(Math.max(0, parseInt(e.target.value, 10) || 0))
                        setActiveOrder(null)
                      }}
                      placeholder="Ví dụ: 300, 1500..."
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors outline-none ${
                        isCustomMode
                          ? isDark
                            ? 'bg-black/30 border-[#00c4de] text-white'
                            : 'bg-white border-[#007b8b] text-gray-900 shadow-xs'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-gray-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isCustomMode && customCredits > 0 && (
                        <span className="font-mono text-xs font-bold text-amber-500">
                          = {(customCredits * 100).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className="text-xs font-bold text-gray-400">Credits</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Select Payment Method */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#00c4de] text-black font-extrabold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Phương thức thanh toán
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVAILABLE_PAYMENT_GATEWAYS.map((gw) => {
                    const isSelected = selectedGateway === gw.id
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(gw.id)
                          setActiveOrder(null)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? isDark
                              ? 'bg-[#00c4de]/10 border-2 border-[#00c4de] text-white'
                              : 'bg-teal-50/70 border-2 border-[#007b8b] text-gray-900'
                            : isDark
                            ? 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="font-mono text-base">{gw.iconSymbol}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">{gw.name}</span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {gw.badge || gw.detail}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Daily Contributor Challenges Card (Compact) */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-3.5 ${
                isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
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
                                isTaskDone ? 'bg-emerald-500' : 'bg-[#00c4de]'
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
                      <span className="font-bold text-amber-600 block">+20 Credits</span>
                      <span className="text-gray-500 text-[11px]">Khảo sát video Dashcam</span>
                    </div>
                    <Link to="/studio" className="text-[#007b8b] dark:text-[#00c4de] font-bold">
                      Khảo sát ➔
                    </Link>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-emerald-600 block">+5 Credits</span>
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

          {/* ─── Right Column (5 cols): Inline Checkout Panel (ZyPage / Gank Style) ─ */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div
              className={`rounded-2xl border p-6 sm:p-7 shadow-lg transition-all space-y-5 ${
                isDark
                  ? 'bg-[#071317] border-white/10 shadow-black/40'
                  : 'bg-white border-gray-200'
              }`}
            >
              {paymentSuccess ? (
                /* Payment Success View */
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle size={36} weight="fill" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Nạp Credits thành công
                  </h3>
                  <p className="text-xs text-gray-500">
                    Hệ thống đã ghi nhận thanh toán và cộng Credits vào ví của bạn.
                  </p>
                </div>
              ) : activeOrder ? (
                /* Step B: Order Generated -> Live QR Checkout Display (Inline) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                        Đang chờ thanh toán
                      </span>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        {selectedGateway === 'VIETQR' ? 'Quét mã VietQR' : 'Thanh toán MoMo'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline cursor-pointer"
                    >
                      Đổi gói khác
                    </button>
                  </div>

                  {/* QR Code Canvas */}
                  <div className="w-52 h-52 mx-auto p-2.5 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-200">
                    {activeOrder.qrCodeUrl ? (
                      <img
                        src={activeOrder.qrCodeUrl}
                        alt="Mã thanh toán QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <CircleNotch size={32} className="animate-spin text-gray-400" />
                    )}
                  </div>

                  {/* VietQR Bank Information (SePay / ZyPage Style) */}
                  {activeOrder.bankInfo && (
                    <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/5 text-xs font-mono space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Ngân hàng:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {activeOrder.bankInfo.bankId}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-[#00c4de]">
                            {activeOrder.bankInfo.accountNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeOrder.bankInfo!.accountNo, 'acc')}
                            className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'acc' ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Chủ tài khoản:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {activeOrder.bankInfo.accountName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-extrabold text-amber-500">
                          {activeOrder.bankInfo.amount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-2">
                        <span className="text-gray-500">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            {activeOrder.bankInfo.transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeOrder.bankInfo!.transferContent, 'content')}
                            className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedField === 'content' ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MoMo Direct Link Button */}
                  {selectedGateway === 'MOMO' && activeOrder.payUrl && (
                    <a
                      href={activeOrder.payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#a50064] hover:bg-[#860051] text-white flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <span>Mở ứng dụng MoMo thanh toán</span>
                      <ArrowSquareOut size={16} />
                    </a>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmPaid}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                        isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                      }`}
                    >
                      Tôi đã chuyển khoản xong
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    >
                      Hủy đơn này
                    </button>
                  </div>
                </div>
              ) : (
                /* Step A: Live Order Summary & Checkout Trigger Button */
                <div className="space-y-5">
                  <div className="border-b border-gray-100 dark:border-white/5 pb-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Tóm tắt thanh toán
                    </span>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                      Xác nhận đơn nạp
                    </h3>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Gói nạp:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {isCustomMode
                          ? 'Nạp số lượng tùy chỉnh'
                          : cleanPackageName(selectedPackage?.packageName || '')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Credits nhận được:</span>
                      <span className="font-black text-amber-500 text-sm">
                        +{effectiveCredits.toLocaleString('vi-VN')} Credits
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                      <span>Cổng thanh toán:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedGateway === 'VIETQR'
                          ? 'Chuyển khoản VietQR'
                          : selectedGateway === 'MOMO'
                          ? 'Ví điện tử MoMo'
                          : 'Thử nghiệm Sandbox'}
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

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    disabled={isCreatingOrder || effectiveCredits <= 0}
                    onClick={handleCreateOrder}
                    className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black active:scale-98'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white active:scale-98'
                    }`}
                  >
                    {isCreatingOrder ? (
                      <CircleNotch size={18} className="animate-spin" />
                    ) : (
                      <QrCode size={18} weight="bold" />
                    )}
                    <span>
                      {selectedGateway === 'VIETQR'
                        ? 'Tạo mã thanh toán VietQR'
                        : selectedGateway === 'MOMO'
                        ? 'Thanh toán qua MoMo'
                        : 'Xác nhận nạp Sandbox'}
                    </span>
                  </button>

                  <div className="text-[11px] text-gray-400 space-y-1 text-center leading-relaxed">
                    <p>✓ Tự động cộng Credits sau khi hoàn tất giao dịch.</p>
                    <p>✓ Credits vĩnh viễn không có thời hạn sử dụng.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Transaction History ─────────────────────── */}
        <div
          className={`rounded-2xl border shadow-xs overflow-hidden mt-8 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <CircleNotch size={24} className="animate-spin mx-auto mb-2 text-[#00c4de]" />
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
    </div>
  )
}
