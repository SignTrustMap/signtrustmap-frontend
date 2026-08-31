import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Coins,
  CurrencyCircleDollar,
  CheckCircle,
  FloppyDisk,
  NavigationArrow,
  PlusCircle,
  Trash,
} from '@phosphor-icons/react'

export default function CreditRulesPage() {
  const { t } = useTranslation('ops')

  const [surveyReward, setSurveyReward] = useState(50)
  const [reviewReward, setReviewReward] = useState(15)
  const [revalidationBounty, setRevalidationBounty] = useState(35)
  const [dailyTaskBonus, setDailyTaskBonus] = useState(25)
  const [navConsumptionRate, setNavConsumptionRate] = useState(5)

  const [topupPackages, setTopupPackages] = useState([
    { id: 'PKG-1', priceVnd: 50000, credits: 500, bonus: 50 },
    { id: 'PKG-2', priceVnd: 100000, credits: 1000, bonus: 150 },
    { id: 'PKG-3', priceVnd: 200000, credits: 2000, bonus: 400 },
  ])

  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setToastMsg(t('economy.toast_saved'))
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleAddPackage() {
    setTopupPackages((prev) => [
      ...prev,
      { id: `PKG-${prev.length + 1}`, priceVnd: 500000, credits: 5000, bonus: 1200 },
    ])
  }

  function handleDeletePackage(id: string) {
    setTopupPackages((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <Coins size={16} weight="bold" />
            <span>{t('economy.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('economy.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('economy.subtitle')}
          </p>
        </div>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Reward Rules Grid */}
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Coins size={20} className="text-[#007b8b]" />
            <span>{t('economy.sec_rewards')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">
                {t('economy.lbl_survey')}
              </label>
              <input
                type="number"
                value={surveyReward}
                onChange={(e) => setSurveyReward(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">
                {t('economy.lbl_review')}
              </label>
              <input
                type="number"
                value={reviewReward}
                onChange={(e) => setReviewReward(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">
                {t('economy.lbl_revalidation')}
              </label>
              <input
                type="number"
                value={revalidationBounty}
                onChange={(e) => setRevalidationBounty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">
                {t('economy.lbl_daily')}
              </label>
              <input
                type="number"
                value={dailyTaskBonus}
                onChange={(e) => setDailyTaskBonus(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Navigation Pricing Section */}
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <NavigationArrow size={20} className="text-purple-600" />
            <span>{t('economy.sec_nav_pricing')}</span>
          </h2>

          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 space-y-1 max-w-md text-xs">
            <label className="font-mono font-bold text-gray-400 uppercase">
              {t('economy.lbl_nav_rate')}
            </label>
            <input
              type="number"
              value={navConsumptionRate}
              onChange={(e) => setNavConsumptionRate(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
            />
          </div>
        </div>

        {/* Top-up Packages */}
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CurrencyCircleDollar size={20} className="text-emerald-600" />
              <span>{t('economy.sec_topup')}</span>
            </h2>
            <button
              type="button"
              onClick={handleAddPackage}
              className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>{t('economy.btn_add_package')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topupPackages.map((pkg) => (
              <div key={pkg.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 relative space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">{pkg.id}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  >
                    <Trash size={14} />
                  </button>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">
                    {t('economy.lbl_price_vnd')}
                  </span>
                  <span className="text-base font-bold font-mono text-gray-900 dark:text-white">
                    {pkg.priceVnd.toLocaleString()} đ
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">
                    {t('economy.lbl_credits_bonus')}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-600">
                    {pkg.credits} pts (+{pkg.bonus} pts)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FloppyDisk size={18} weight="bold" />
            <span>{t('economy.btn_save')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
