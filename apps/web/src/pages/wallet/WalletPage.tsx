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
import { useTranslation } from 'react-i18next'
import {
  mockTopupPackages,
  mockWalletTransactions,
  type TopupPackageItem,
  type WalletTransactionItem,
} from '@/data'
import { Modal } from '@/components/common/Modal'

export default function WalletPage() {
  const { user, claimDailyBonus } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')

  const [transactions, setTransactions] = useState<WalletTransactionItem[]>(mockWalletTransactions)
  const [selectedPkg, setSelectedPkg] = useState<TopupPackageItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [claimedToday, setClaimedToday] = useState(false)
  const [claimToast, setClaimToast] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleClaimDaily = () => {
    if (claimedToday) return
    const bonus = 25
    claimDailyBonus(bonus)
    setClaimedToday(true)
    setClaimToast(`Claimed +${bonus} Daily Contributor Credits!`)

    setTransactions((prev) => [
      {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'daily_claim',
        title: 'Daily Contributor Check-in Reward',
        amountCredits: bonus,
        status: 'Completed',
        date: new Date().toLocaleString('vi-VN'),
      },
      ...prev,
    ])

    setTimeout(() => setClaimToast(null), 3000)
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
        title: `Top-up: ${selectedPkg.name} (${totalCredits} Credits)`,
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

  return (
    <div
      className={`min-h-screen pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <Coins size={16} />
            <span>{t('wallet.economy_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('wallet.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            {t('wallet.subtitle')}
          </p>
        </div>

        {claimToast && (
          <div className="fixed bottom-8 right-8 z-50 px-5 py-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center gap-3 shadow-2xl backdrop-blur-md animate-slideUp">
            <Gift size={20} />
            <span>{claimToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div
            className={`lg:col-span-2 p-6 sm:p-10 rounded-[28px] border shadow-xl relative overflow-hidden flex flex-col justify-between ${
              isDark
                ? 'bg-gradient-to-br from-[#061417] via-[#082228] to-[#040e11] border-white/10'
                : 'bg-gradient-to-br from-white via-cyan-50/40 to-white border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs sm:text-sm font-mono uppercase font-bold text-gray-400 block mb-1.5 tracking-wider">
                  {t('wallet.available_balance')}
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight">
                    {user?.credits || 0}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-400">Credits</span>
                </div>
                <span className="text-sm text-gray-400 mt-2 block font-medium">
                  {t('wallet.convert_value', { amount: ((user?.credits || 0) * 500).toLocaleString('vi-VN') })}
                </span>
              </div>

              <button
                type="button"
                disabled={claimedToday}
                onClick={handleClaimDaily}
                className={`px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg cursor-pointer shrink-0 ${
                  claimedToday
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-not-allowed'
                    : isDark
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/25 hover:brightness-110 active:scale-95'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/25 hover:brightness-105 active:scale-95'
                }`}
              >
                <Gift size={20} />
                <span>{claimedToday ? t('wallet.claimed_daily_btn') : t('wallet.claim_daily_btn')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 text-sm">
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('wallet.tier_label')}</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm sm:text-base">
                  <ShieldCheck size={18} />
                  Tier A ({user?.trustScore || 100}%)
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('wallet.role_label')}</span>
                <span className="font-bold capitalize text-cyan-400 text-sm sm:text-base">{user?.role || 'Driver'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('wallet.privilege_label')}</span>
                <span className="font-semibold text-gray-300 text-sm sm:text-base">{t('wallet.privilege_val')}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-6 sm:p-8 rounded-[28px] border shadow-xl flex flex-col justify-between ${
              isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
                <Sparkle size={18} className="text-amber-400" />
                <span>{t('wallet.how_to_earn_title')}</span>
              </h3>
              <ul className="space-y-3.5 text-sm text-gray-500 dark:text-gray-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span>{t('wallet.earn_survey')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{t('wallet.earn_review')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span>{t('wallet.earn_daily')}</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-gray-400">
              {t('wallet.wallet_note')}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">{t('wallet.packages_title')}</h2>
            <span className="text-sm text-gray-400">{t('wallet.packages_subtitle')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTopupPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-8 rounded-[28px] border transition-all relative flex flex-col justify-between ${
                  pkg.isPopular
                    ? isDark
                      ? 'bg-gradient-to-b from-[#00c4de]/10 to-transparent border-[#00c4de]/40 shadow-lg shadow-[#00c4de]/10'
                      : 'bg-gradient-to-b from-[#007b8b]/10 to-transparent border-[#007b8b]/40 shadow-lg shadow-[#007b8b]/10'
                    : isDark
                    ? 'bg-[#061417]/90 border-white/10 hover:border-white/20'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-mono font-bold bg-[#00c4de] text-black shadow-md">
                    {t('wallet.popular_badge')}
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-lg sm:text-xl">{pkg.name}</h3>
                  <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{pkg.description}</p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-amber-400">{pkg.credits}</span>
                    <span className="text-sm font-semibold text-gray-400">Credits</span>
                    {pkg.bonusCredits > 0 && (
                      <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                        {t('wallet.bonus_badge', { amount: pkg.bonusCredits })}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono font-bold text-gray-300 block mt-1.5">
                    {pkg.priceVnd.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(pkg)
                      setShowPaymentModal(true)
                    }}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-md active:scale-95 cursor-pointer ${
                      pkg.isPopular
                        ? isDark
                          ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                          : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                        : isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {t('wallet.btn_select_pay')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-[28px] border shadow-xl overflow-hidden ${
            isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <h2 className="text-base sm:text-lg font-bold">{t('wallet.history_title')}</h2>
            <span className="text-sm text-gray-400 font-medium">{t('wallet.history_count', { count: transactions.length })}</span>
          </div>

          <div className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    tx.amountCredits > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {tx.amountCredits > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base">{tx.title}</h4>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 font-mono mt-1">
                      <span>{tx.id}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-base sm:text-lg font-bold block ${
                    tx.amountCredits > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.amountCredits > 0 ? `+${tx.amountCredits}` : tx.amountCredits} Credits
                  </span>
                  <span className="text-xs text-gray-400 capitalize font-medium">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPkg && (
          <Modal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            maxWidth="max-w-md"
          >
            <div className={`w-full rounded-[28px] border shadow-2xl overflow-hidden p-6 sm:p-8 text-center ${
              isDark ? 'bg-[#061417] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {paymentSuccess ? (
                <div className="py-8 space-y-4">
                  <div className="w-18 h-18 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle size={42} />
                  </div>
                  <h3 className="text-xl font-bold">{t('wallet.payment_success_title')}</h3>
                  <p className="text-sm text-gray-400">
                    {t('wallet.payment_success_desc')}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg sm:text-xl font-bold mb-1.5">{t('wallet.qr_modal_title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-5">
                    {t('wallet.qr_scan_desc')}
                  </p>

                  <div className="w-56 h-56 mx-auto p-4 rounded-3xl bg-white shadow-inner flex flex-col items-center justify-center border">
                    <QrCode size={160} className="text-gray-900" />
                    <span className="text-xs font-mono text-gray-600 font-bold mt-1.5">NAP {user?.name?.toUpperCase()}</span>
                  </div>

                  <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-left space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('wallet.packages_title')}:</span>
                      <span className="font-bold text-[#00c4de]">{selectedPkg.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credits:</span>
                      <span className="font-bold text-amber-400">{selectedPkg.credits + (selectedPkg.bonusCredits || 0)} Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">VND:</span>
                      <span className="font-bold text-white">{selectedPkg.priceVnd.toLocaleString('vi-VN')} VND</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {t('wallet.btn_cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteTopup}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer ${
                        isDark ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black' : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
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
