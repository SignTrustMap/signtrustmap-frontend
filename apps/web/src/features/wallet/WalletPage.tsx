import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  ShieldCheck,
  Gift,
  Copy,
  Check,
  CircleNotch,
  ArrowClockwise,
  ArrowSquareOut,
  Fire,
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
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { PageHeader } from '@/components/common/PageHeader'

export default function WalletPage() {
  const { user, claimDailyBonus } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  // Real Wallet Data from NestJS backend
  const [balance, setBalance] = useState<number>(user?.credits || 0)
  const [isFrozen, setIsFrozen] = useState<boolean>(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  // Top-up packages state
  const [packages, setPackages] = useState<TopUpPackage[]>(DEFAULT_TOP_UP_PACKAGES)
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)

  // Transactions pagination state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [isLoadingTx, setIsLoadingTx] = useState(true)

  // Daily Tasks & Missions state
  const [dailyTasks, setDailyTasks] = useState<DailyTaskItem[]>([])
  const [missions, setMissions] = useState<MissionsOverviewResponse | null>(null)
  const [isClaimingDaily, setIsClaimingDaily] = useState(false)

  // Today's date string for idempotency & persistence
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const dailyStorageKey = useMemo(() => `stm_daily_claimed_${user?.id || 'guest'}_${todayStr}`, [user?.id, todayStr])
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    return localStorage.getItem(dailyStorageKey) === 'true'
  })

  // Top-up payment flow modal
  const [selectedPkg, setSelectedPkg] = useState<TopUpPackage | null>(null)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayOption['id']>('VIETQR')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [activeOrder, setActiveOrder] = useState<TopUpOrderResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

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
    } catch (err) {
      console.warn('[WalletPage] Failed to fetch top-up packages:', err)
      setPackages(DEFAULT_TOP_UP_PACKAGES)
    } finally {
      setIsLoadingPackages(false)
    }
  }, [])

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

      // Detect if today's checkin or daily task has been claimed
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

  // Initial Data Fetch
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
      // 1. If backend has a daily task, claim through /api/v1/daily-tasks/:id/claim
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

      // 2. Award bonus to user credits and local state
      claimDailyBonus(bonus)
      setBalance((prev) => prev + bonus)
      setClaimedToday(true)
      localStorage.setItem(dailyStorageKey, 'true')
      toast.success(`+${bonus} Credits: ${t('wallet.tx_daily_reward')}`)

      // 3. Prepend immediate local transaction record
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

      // 4. Re-fetch wallet and daily tasks in background
      await fetchWallet()
      await fetchDailyTasks()
    } finally {
      setIsClaimingDaily(false)
    }
  }

  // ─── Create Top-up Order with Backend ─────────────────────────────────────
  const handleCreateOrder = async () => {
    if (!selectedPkg) return
    try {
      setIsCreatingOrder(true)
      const idempotencyKey = `stm_web_${selectedPkg.id}_${Date.now()}`
      const res = await walletService.topUp(selectedPkg.id, selectedGateway, idempotencyKey)
      setActiveOrder(res)

      // In Sandbox mode, payment is instantly credited
      if (selectedGateway === 'MOCK' || res.paymentOrder?.status === 'COMPLETED') {
        setPaymentSuccess(true)
        toast.success(`Nạp thành công +${selectedPkg.creditAmount} Credits!`)
        claimDailyBonus(selectedPkg.creditAmount + (selectedPkg.bonusCredits || 0))
        await fetchWallet()
        await fetchTransactions(currentPage, pageSize)
        setTimeout(() => {
          setPaymentSuccess(false)
          setShowPaymentModal(false)
          setSelectedPkg(null)
          setActiveOrder(null)
        }, 2200)
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo đơn nạp tiền. Vui lòng thử lại.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // ─── Finish / Confirm Payment (VietQR) ────────────────────────────────────
  const handleConfirmPaid = async () => {
    setPaymentSuccess(true)
    toast.success('Hệ thống đang đối soát giao dịch VietQR của bạn.')
    await fetchWallet()
    await fetchTransactions(currentPage, pageSize)

    setTimeout(() => {
      setPaymentSuccess(false)
      setShowPaymentModal(false)
      setSelectedPkg(null)
      setActiveOrder(null)
    }, 2000)
  }

  // ─── Copy to Clipboard Helper ─────────────────────────────────────────────
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Đã sao chép: ${text}`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // High-contrast role badge styles matching ProfilePage
  const getRoleBadge = (role?: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return {
          label: t('profile.roles.admin'),
          bg: isDark
            ? 'bg-purple-900/40 text-purple-200 border-purple-500/50'
            : 'bg-purple-100 text-purple-900 border-purple-300',
        }
      case 'staff':
        return {
          label: t('profile.roles.staff'),
          bg: isDark
            ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
            : 'bg-blue-100 text-blue-900 border-blue-300',
        }
      case 'reviewer':
        return {
          label: t('profile.roles.reviewer'),
          bg: isDark
            ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50'
            : 'bg-emerald-100 text-emerald-900 border-emerald-300',
        }
      case 'surveyor':
        return {
          label: t('profile.roles.surveyor'),
          bg: isDark
            ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
            : 'bg-amber-100 text-amber-950 border-amber-300',
        }
      default:
        return {
          label: t('profile.roles.driver'),
          bg: isDark
            ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/50'
            : 'bg-cyan-100 text-cyan-950 border-cyan-300',
        }
    }
  }

  const roleBadge = getRoleBadge(user?.role)

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

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-8 sm:py-12 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ─── Page Header ────────────────────────────────────────────── */}
        <PageHeader
          title={t('wallet.title')}
          subtitle={t('wallet.subtitle')}
          bordered
        />

        {/* ─── Balance & Earn Overview (2 Columns) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Balance Card (8 cols) */}
          <div
            className={`lg:col-span-8 rounded-2xl border p-6 sm:p-8 flex flex-col justify-between shadow-xs ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3]'
            }`}
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-600 dark:text-gray-400">
                      {t('wallet.available_balance')}
                    </span>
                    <button
                      type="button"
                      onClick={fetchWallet}
                      disabled={isLoadingWallet}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      title="Làm mới số dư ví"
                    >
                      <ArrowClockwise
                        size={14}
                        className={isLoadingWallet ? 'animate-spin text-[#00c4de]' : ''}
                      />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      {isLoadingWallet ? '—' : balance.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-base font-bold text-gray-700 dark:text-gray-300">Credits</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 block font-medium">
                    {t('wallet.convert_value', { amount: (balance * 100).toLocaleString('vi-VN') })}
                  </span>
                </div>

                {/* Daily Check-in Button */}
                <button
                  type="button"
                  disabled={claimedToday || isClaimingDaily}
                  onClick={handleClaimDaily}
                  className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-center ${
                    claimedToday
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-not-allowed'
                      : isDark
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 shadow-md active:scale-95'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-105 shadow-sm active:scale-95'
                  }`}
                >
                  {isClaimingDaily ? (
                    <CircleNotch size={18} className="animate-spin" />
                  ) : (
                    <Gift size={18} weight={claimedToday ? 'fill' : 'bold'} />
                  )}
                  <span>{claimedToday ? t('wallet.claimed_daily_btn') : t('wallet.claim_daily_btn')}</span>
                </button>
              </div>
            </div>

            {/* Bottom Account Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-white/10 text-xs">
              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                  {t('wallet.tier_label')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                  <ShieldCheck size={14} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                  <span>{isFrozen ? 'Tài khoản bị đóng băng' : `Đang hoạt động (${user?.trustScore || 100}%)`}</span>
                </span>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                  {t('wallet.role_label')}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>

              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">
                  {t('wallet.privilege_label')}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200 block truncate">
                  {t('wallet.privilege_val')}
                </span>
              </div>
            </div>
          </div>

          {/* How to Earn Side Card (4 cols) */}
          <div
            className={`lg:col-span-4 rounded-2xl border p-6 flex flex-col justify-between shadow-xs ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkle size={18} weight="fill" className="text-amber-500" />
                  <span>{t('wallet.how_to_earn_title')}</span>
                </h3>

                {/* Streak Counter if available */}
                {missions?.streak && missions.streak.currentDays > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    <Fire size={13} weight="fill" />
                    <span>{missions.streak.currentDays} ngày</span>
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                    +20 Credits
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('wallet.earn_survey_sub')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                    +5 Credits
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('wallet.earn_review_sub')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 block mb-0.5">
                      +25 Credits
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('wallet.earn_daily_sub')}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                      claimedToday
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {claimedToday ? '✓ Đã nhận' : 'Chưa nhận'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
              {t('wallet.wallet_note')}
            </p>
          </div>
        </div>

        {/* ─── Top-up Packages Section ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('wallet.packages_title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {t('wallet.packages_subtitle')}
              </p>
            </div>
            {isLoadingPackages && (
              <CircleNotch size={20} className="animate-spin text-[#00c4de]" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-5 sm:p-6 border transition-all relative flex flex-col justify-between shadow-xs ${
                  pkg.isPopular
                    ? isDark
                      ? 'bg-[#071317] border-2 border-[#00c4de] shadow-lg shadow-[#00c4de]/10'
                      : 'bg-white border-2 border-[#007b8b] shadow-md'
                    : isDark
                    ? 'bg-[#071317] border-white/10 hover:border-white/20'
                    : 'bg-white border-[#E8E4E3] hover:border-gray-400'
                }`}
              >
                {pkg.isPopular && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'bg-[#00c4de] text-black shadow-md' : 'bg-[#007b8b] text-white shadow-sm'
                  }`}>
                    {t('wallet.popular_badge')}
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                    {pkg.packageName}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    Mở khóa tính năng dẫn đường & lưu trữ dữ liệu
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {pkg.creditAmount}
                      </span>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Credits</span>
                    </div>
                    {(pkg.bonusCredits || 0) > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                        {t('wallet.bonus_badge', { amount: pkg.bonusCredits })}
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-mono font-extrabold text-gray-900 dark:text-white block mt-2">
                    {Math.round(Number(pkg.priceVnd)).toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <div className="pt-5 mt-5 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(pkg)
                      setSelectedGateway('VIETQR')
                      setActiveOrder(null)
                      setShowPaymentModal(true)
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      pkg.isPopular
                        ? isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-md'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-sm'
                        : isDark
                        ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {t('wallet.btn_select_pay')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Transaction History Section ────────────────────────────── */}
        <div
          className={`rounded-2xl border shadow-xs overflow-hidden ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
          }`}
        >
          <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
              {t('wallet.history_title')}
            </h2>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/10">
              {t('wallet.history_count', { count: totalTransactions })}
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoadingTx ? (
              <div className="p-12 text-center text-gray-400">
                <CircleNotch size={28} className="animate-spin mx-auto mb-2 text-[#00c4de]" />
                <p className="text-xs">Đang tải lịch sử giao dịch...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                Chưa có giao dịch nào được ghi nhận.
              </div>
            ) : (
              transactions.map((tx) => {
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
                          <ArrowDownLeft size={18} weight="bold" />
                        ) : (
                          <ArrowUpRight size={18} weight="bold" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {formatTxType(tx.transactionType, tx.description)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
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
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} Credits
                      </span>
                      {tx.balanceAfter !== undefined && tx.balanceAfter !== null && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-mono">
                          Số dư: {tx.balanceAfter}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ─── Shared Pagination ──────────────────────────────────── */}
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

        {/* ─── Real Payment / Top-Up Modal ────────────────────────────── */}
        {selectedPkg && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setActiveOrder(null)
            }}
            maxWidth="max-w-lg"
          >
            <div
              className={`w-full rounded-2xl border shadow-2xl p-6 sm:p-8 text-center transition-all ${
                isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {paymentSuccess ? (
                <div className="py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle size={36} weight="fill" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    {t('wallet.payment_success_title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('wallet.payment_success_desc')}
                  </p>
                </div>
              ) : !activeOrder ? (
                /* Step 1: Gateway Selection & Order Confirmation */
                <div className="space-y-4 text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    Xác nhận gói nạp Credits
                  </h3>

                  <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('wallet.modal_package_lbl')}</span>
                      <span className="font-extrabold text-gray-900 dark:text-[#00c4de]">
                        {selectedPkg.packageName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('wallet.modal_credits_received')}</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {selectedPkg.creditAmount + (selectedPkg.bonusCredits || 0)} Credits
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-white/10 pt-2">
                      <span className="text-gray-500 dark:text-gray-400">{t('wallet.modal_amount_lbl')}</span>
                      <span className="font-mono font-extrabold text-base text-gray-900 dark:text-white">
                        {Math.round(Number(selectedPkg.priceVnd)).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-2">
                      Chọn phương thức thanh toán
                    </label>
                    <div className="space-y-2.5">
                      {AVAILABLE_PAYMENT_GATEWAYS.map((gw) => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setSelectedGateway(gw.id)}
                          className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            selectedGateway === gw.id
                              ? isDark
                                ? 'bg-[#00c4de]/10 border-[#00c4de] text-white shadow-xs'
                                : 'bg-teal-50 border-[#007b8b] text-gray-900 shadow-xs'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg">{gw.iconSymbol}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{gw.name}</span>
                                {gw.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    {gw.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                                {gw.detail}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              selectedGateway === gw.id
                                ? 'border-[#007b8b] dark:border-[#00c4de] bg-[#007b8b] dark:bg-[#00c4de]'
                                : 'border-gray-400'
                            }`}
                          >
                            {selectedGateway === gw.id && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                          : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {t('wallet.btn_cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={isCreatingOrder}
                      onClick={handleCreateOrder}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                        isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                      }`}
                    >
                      {isCreatingOrder && <CircleNotch size={16} className="animate-spin" />}
                      <span>Tiến hành nạp</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Payment Processing Screen (VietQR / MoMo) */
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                    {selectedGateway === 'VIETQR' ? t('wallet.qr_modal_title') : 'Thanh toán qua MoMo'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('wallet.qr_scan_desc')}
                  </p>

                  {/* QR Code Canvas */}
                  <div className="w-60 h-60 mx-auto p-3 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-200">
                    {activeOrder.qrCodeUrl ? (
                      <img
                        src={activeOrder.qrCodeUrl}
                        alt="VietQR Payment Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <CircleNotch size={32} className="animate-spin text-gray-400" />
                    )}
                  </div>

                  {/* VietQR Bank Info Details */}
                  {activeOrder.bankInfo && (
                    <div className="mt-3 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 text-xs text-left space-y-2 font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{t('wallet.qr_bank')}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {activeOrder.bankInfo.bankId} (Ngân hàng Quân Đội)
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{t('wallet.qr_account_number')}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-gray-900 dark:text-[#00c4de]">
                            {activeOrder.bankInfo.accountNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeOrder.bankInfo!.accountNo, 'acc')}
                            className="p-1 rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'acc' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{t('wallet.qr_account_owner')}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {activeOrder.bankInfo.accountName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{t('wallet.modal_amount_lbl')}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {activeOrder.bankInfo.amount.toLocaleString('vi-VN')} VND
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-2">
                        <span className="text-gray-500">{t('wallet.qr_content')}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-amber-300">
                            {activeOrder.bankInfo.transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeOrder.bankInfo!.transferContent, 'content')}
                            className="p-1 rounded-md bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                            title="Sao chép nội dung chuyển khoản"
                          >
                            {copiedField === 'content' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MoMo Pay Direct Link Button */}
                  {selectedGateway === 'MOMO' && activeOrder.payUrl && (
                    <a
                      href={activeOrder.payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#a50064] hover:bg-[#860051] text-white flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <span>Mở ứng dụng / Cổng thanh toán MoMo</span>
                      <ArrowSquareOut size={16} />
                    </a>
                  )}

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                    Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động cộng Credits trong vòng 1-2 phút.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                          : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPaid}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
                        isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                      }`}
                    >
                      {t('wallet.btn_confirm_paid')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
