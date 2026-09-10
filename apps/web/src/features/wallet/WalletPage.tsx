import { useState } from 'react'
import {
  Coins,
  Sparkle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  QrCode,
  ShieldCheck,
  Gift,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  mockTopupPackages,
  mockWalletTransactions,
  type TopupPackageItem,
  type WalletTransactionItem,
} from '@/data'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'

export default function WalletPage() {
  const { user, claimDailyBonus } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>(mockWalletTransactions)
  const [selectedPkg, setSelectedPkg] = useState<TopupPackageItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [claimedToday, setClaimedToday] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Pagination state for transactions
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const handleClaimDaily = () => {
    if (claimedToday) return
    const bonus = 25
    claimDailyBonus(bonus)
    setClaimedToday(true)
    toast.success(`+${bonus} Credits ${t('wallet.claim_daily_btn')}!`)

    setTransactions((prev) => [
      {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'daily_claim',
        title: t('wallet.tx_daily_reward'),
        amountCredits: bonus,
        status: 'Completed',
        date: new Date().toLocaleString('vi-VN'),
      },
      ...prev,
    ])
  }

  const handleCompleteTopup = () => {
    if (!selectedPkg) return
    setPaymentSuccess(true)
    const totalCredits = selectedPkg.credits + (selectedPkg.bonusCredits || 0)
    claimDailyBonus(totalCredits)

    setTransactions((prev) => [
      {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'topup',
        title: t('wallet.tx_deposit_pkg', { name: selectedPkg.name, credits: totalCredits }),
        amountCredits: totalCredits,
        status: 'Completed',
        date: new Date().toLocaleString('vi-VN'),
        paymentMethod: 'VietQR / Banking Transfer',
      },
      ...prev,
    ])

    setTimeout(() => {
      setPaymentSuccess(false)
      setShowPaymentModal(false)
      setSelectedPkg(null)
    }, 2000)
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

  const getStatusBadge = (status?: string) => {
    const s = (status || '').trim().toLowerCase()
    if (s === 'completed') {
      return {
        label: t('wallet.status_completed'),
        cls: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      }
    }
    return {
      label: t('wallet.status_pending'),
      cls: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/60 mb-2">
              <Coins size={15} weight="fill" className="text-amber-600 dark:text-amber-400" />
              <span>{t('wallet.economy_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('wallet.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('wallet.subtitle')}
            </p>
          </div>
        </div>

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
                  <span className="text-xs uppercase font-bold tracking-wider text-gray-600 dark:text-gray-400 block mb-1">
                    {t('wallet.available_balance')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      {user?.credits || 0}
                    </span>
                    <span className="text-base font-bold text-gray-700 dark:text-gray-300">Credits</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 block font-medium">
                    {t('wallet.convert_value', { amount: ((user?.credits || 0) * 500).toLocaleString('vi-VN') })}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={claimedToday}
                  onClick={handleClaimDaily}
                  className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-center ${
                    claimedToday
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-not-allowed'
                      : isDark
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 shadow-md active:scale-95'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-105 shadow-sm active:scale-95'
                  }`}
                >
                  <Gift size={18} weight={claimedToday ? 'fill' : 'bold'} />
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
                  <span>Tier A ({user?.trustScore || 100}%)</span>
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
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-amber-500" />
                <span>{t('wallet.how_to_earn_title')}</span>
              </h3>

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

                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                  <span className="font-bold text-cyan-700 dark:text-cyan-300 block mb-0.5">
                    +25 Credits
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('wallet.earn_daily_sub')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
              {t('wallet.wallet_note')}
            </p>
          </div>
        </div>

        {/* ─── Top-up Packages Section (VietQR) ────────────────────────── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('wallet.packages_title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {t('wallet.packages_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTopupPackages.map((pkg) => (
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
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed min-h-[2.5rem]">
                    {pkg.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {pkg.credits}
                      </span>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Credits</span>
                    </div>
                    {pkg.bonusCredits > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                        {t('wallet.bonus_badge', { amount: pkg.bonusCredits })}
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-mono font-extrabold text-gray-900 dark:text-white block mt-2">
                    {pkg.priceVnd.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <div className="pt-5 mt-5 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(pkg)
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
              {t('wallet.history_count', { count: transactions.length })}
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {transactions
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((tx) => (
              <div
                key={tx.id}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      tx.amountCredits > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {tx.amountCredits > 0 ? <ArrowDownLeft size={18} weight="bold" /> : <ArrowUpRight size={18} weight="bold" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {tx.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      <span>{tx.id}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm sm:text-base font-extrabold block ${
                      tx.amountCredits > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {tx.amountCredits > 0 ? `+${tx.amountCredits}` : tx.amountCredits} Credits
                  </span>
                  {(() => {
                    const statusBadge = getStatusBadge(tx.status)
                    return (
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Shared Pagination ──────────────────────────────────── */}
          {transactions.length > 0 && (
            <div className="p-4 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={transactions.length}
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

        {/* ─── VietQR Payment Modal ───────────────────────────────────── */}
        {selectedPkg && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            maxWidth="max-w-md"
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
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {t('wallet.qr_modal_title')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    {t('wallet.qr_scan_desc')}
                  </p>

                  <div className="w-52 h-52 mx-auto p-3 rounded-2xl bg-white shadow-xs flex flex-col items-center justify-center border border-gray-300">
                    <QrCode size={150} className="text-gray-900" />
                    <span className="text-[11px] font-mono text-gray-700 font-bold mt-1">
                      NAP {user?.name?.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-left space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('wallet.modal_package_lbl')}</span>
                      <span className="font-bold text-gray-900 dark:text-[#00c4de]">{selectedPkg.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('wallet.modal_credits_received')}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {selectedPkg.credits + (selectedPkg.bonusCredits || 0)} Credits
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('wallet.modal_amount_lbl')}</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        {selectedPkg.priceVnd.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
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
                      onClick={handleCompleteTopup}
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
                        isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                      }`}
                    >
                      {t('wallet.btn_confirm_paid')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}

