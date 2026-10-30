import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import PageHeader from '@/components/common/PageHeader'
import {
  defaultEconomyPolicy,
  mockTopupPackages,
  type TopupPackage,
  type EconomyPolicyRules,
} from '@/data/credits'
import {
  economyService,
  systemService,
  type RewardRuleItem,
} from '@/api/services'
import {
  Coins,
  CurrencyCircleDollar,
  FloppyDisk,
  NavigationArrow,
  Plus,
  Trash,
  PencilSimple,
  VideoCamera,
  CheckSquareOffset,
  Target,
  Trophy,
  Compass,
  ShieldCheck,
  Scales,
  X,
  Sparkle,
  ArrowCounterClockwise,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Lightning,
  WarningCircle,
} from '@phosphor-icons/react'

export default function CreditRulesPage() {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Policy rules state
  const [policy, setPolicy] = useState<EconomyPolicyRules>(defaultEconomyPolicy)

  // Live dynamic reward rules from backend (/api/v1/admin/rewards/rules)
  const [rewardRules, setRewardRules] = useState<RewardRuleItem[]>([])

  // Packages state
  const [packages, setPackages] = useState<TopupPackage[]>(mockTopupPackages)

  // Modal state for Add/Edit Package
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPkg, setEditingPkg] = useState<TopupPackage | null>(null)
  const [modalForm, setModalForm] = useState<{
    id: string
    name: string
    priceVnd: number
    credits: number
    bonus: number
    popular: boolean
  }>({
    id: '',
    name: '',
    priceVnd: 100000,
    credits: 1000,
    bonus: 100,
    popular: false,
  })

  // Modal state for Add/Edit Dynamic Reward Rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RewardRuleItem | null>(null)
  const [ruleForm, setRuleForm] = useState<{
    activityType: string
    baseAmount: number
    dailyLimit: number
    isActive: boolean
  }>({
    activityType: 'SURVEY_REWARD',
    baseAmount: 15,
    dailyLimit: 20,
    isActive: true,
  })

  // ── Load live rules & parameters from backend ──
  const loadRulesAndPolicy = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rulesRes, paramsRes] = await Promise.allSettled([
        economyService.getRules(),
        systemService.getParameters(),
      ])

      // 1. Process Dynamic Reward Rules
      if (rulesRes.status === 'fulfilled' && Array.isArray(rulesRes.value)) {
        setRewardRules(rulesRes.value)

        // Sync standard policy values from live rules if found
        const updatedPolicy = { ...defaultEconomyPolicy }
        rulesRes.value.forEach((r) => {
          if (r.activityType === 'SURVEY_REWARD' || r.activityType === 'SURVEY_SUBMISSION') {
            updatedPolicy.surveyReward = r.baseAmount
          } else if (r.activityType === 'REVIEW_REWARD' || r.activityType === 'REVIEW_CONSENSUS') {
            updatedPolicy.reviewReward = r.baseAmount
          } else if (r.activityType === 'REVALIDATION_REWARD') {
            updatedPolicy.revalidationBounty = r.baseAmount
          } else if (r.activityType === 'DAILY_TASK_REWARD') {
            updatedPolicy.dailyTaskBonus = r.baseAmount
          }
        })
        setPolicy((prev) => ({ ...prev, ...updatedPolicy }))
      }

      // 2. Process system parameters (policy JSON or packages)
      if (paramsRes.status === 'fulfilled' && Array.isArray(paramsRes.value)) {
        paramsRes.value.forEach((p) => {
          let val = p.value
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val)
            } catch {}
          }
          if (p.key === 'economy_policy' && typeof val === 'object') {
            setPolicy((prev) => ({ ...prev, ...val }))
          } else if (p.key === 'topup_packages' && Array.isArray(val)) {
            setPackages(val)
          } else if (p.key === 'navigation_credit_fee' && !Number.isNaN(Number(val))) {
            setPolicy((prev) => ({ ...prev, navConsumptionRate: Number(val) }))
          } else if (p.key === 'min_navigation_balance' && !Number.isNaN(Number(val))) {
            setPolicy((prev) => ({ ...prev, minNavBalance: Number(val) }))
          }
        })
      }
    } catch (err) {
      console.warn('Failed to fetch reward rules from backend, using defaults:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRulesAndPolicy()
  }, [loadRulesAndPolicy])

  // ── Save All Rules & Policy to Backend ──
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      // 1. Sync updated policy reward rates into reward_rules
      const updatePromises: Promise<any>[] = []

      const surveyRule = rewardRules.find(
        (r) => r.activityType === 'SURVEY_REWARD' || r.activityType === 'SURVEY_SUBMISSION'
      )
      if (surveyRule) {
        updatePromises.push(
          economyService.updateRule(surveyRule.id, { baseAmount: policy.surveyReward })
        )
      }

      const reviewRule = rewardRules.find(
        (r) => r.activityType === 'REVIEW_REWARD' || r.activityType === 'REVIEW_CONSENSUS'
      )
      if (reviewRule) {
        updatePromises.push(
          economyService.updateRule(reviewRule.id, { baseAmount: policy.reviewReward })
        )
      }

      const revalRule = rewardRules.find((r) => r.activityType === 'REVALIDATION_REWARD')
      if (revalRule) {
        updatePromises.push(
          economyService.updateRule(revalRule.id, { baseAmount: policy.revalidationBounty })
        )
      }

      const dailyRule = rewardRules.find((r) => r.activityType === 'DAILY_TASK_REWARD')
      if (dailyRule) {
        updatePromises.push(
          economyService.updateRule(dailyRule.id, { baseAmount: policy.dailyTaskBonus })
        )
      }

      // 2. Persist full policy & packages in system_parameters
      updatePromises.push(
        systemService.upsertParameter('economy_policy', {
          value: policy,
          description: 'Cấu hình chính sách kinh tế tín chỉ toàn hệ thống',
        }),
        systemService.upsertParameter('topup_packages', {
          value: packages,
          description: 'Danh sách các gói nạp tín chỉ cho người dùng',
        }),
        systemService.upsertParameter('navigation_credit_fee', {
          value: policy.navConsumptionRate,
          description: 'Định mức tiêu thụ tín chỉ dẫn đường thông minh',
        }),
        systemService.upsertParameter('min_navigation_balance', {
          value: policy.minNavBalance,
          description: 'Số dư tín chỉ tối thiểu để bật dẫn đường',
        })
      )

      await Promise.allSettled(updatePromises)
      toast.success(t('economy.toast_saved'))
      loadRulesAndPolicy()
    } catch (err: any) {
      console.error('Error saving economy rules:', err)
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu quy tắc thưởng.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleResetDefaults() {
    setPolicy(defaultEconomyPolicy)
    setPackages(mockTopupPackages)
    toast.info(t('economy.toast_reset'))
  }

  // ── Dynamic Rule Toggle ──
  async function handleToggleRule(rule: RewardRuleItem) {
    try {
      await economyService.toggleRule(rule.id)
      setRewardRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      )
      toast.success(t('economy.toast_rule_toggled'))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể đổi trạng thái luật thưởng')
    }
  }

  // ── Dynamic Rule Add / Edit Modal ──
  function handleOpenAddRuleModal() {
    setEditingRule(null)
    setRuleForm({
      activityType: 'SURVEY_REWARD',
      baseAmount: 15,
      dailyLimit: 20,
      isActive: true,
    })
    setIsRuleModalOpen(true)
  }

  function handleOpenEditRuleModal(rule: RewardRuleItem) {
    setEditingRule(rule)
    setRuleForm({
      activityType: rule.activityType,
      baseAmount: rule.baseAmount,
      dailyLimit: rule.dailyLimit,
      isActive: rule.isActive,
    })
    setIsRuleModalOpen(true)
  }

  async function handleRuleModalSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingRule) {
        await economyService.updateRule(editingRule.id, {
          baseAmount: Number(ruleForm.baseAmount),
          dailyLimit: Number(ruleForm.dailyLimit),
          isActive: ruleForm.isActive,
        })
        toast.success(t('economy.toast_rule_updated'))
      } else {
        await economyService.createRule({
          activityType: ruleForm.activityType.trim().toUpperCase(),
          baseAmount: Number(ruleForm.baseAmount),
          dailyLimit: Number(ruleForm.dailyLimit),
          isActive: ruleForm.isActive,
        })
        toast.success(t('economy.toast_rule_created'))
      }
      setIsRuleModalOpen(false)
      loadRulesAndPolicy()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu luật thưởng')
    }
  }

  // ── Package Add / Edit Modal ──
  function handleOpenAddModal() {
    const nextNum = packages.length + 1
    const nextId = `PKG-${nextNum < 10 ? `0${nextNum}` : nextNum}`
    setEditingPkg(null)
    setModalForm({
      id: nextId,
      name: '',
      priceVnd: 100000,
      credits: 1000,
      bonus: 100,
      popular: false,
    })
    setIsModalOpen(true)
  }

  function handleOpenEditModal(pkg: TopupPackage) {
    setEditingPkg(pkg)
    setModalForm({
      id: pkg.id,
      name: pkg.name,
      priceVnd: pkg.priceVnd,
      credits: pkg.credits,
      bonus: pkg.bonus,
      popular: !!pkg.popular,
    })
    setIsModalOpen(true)
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalName = modalForm.name.trim() || `Gói Nạp ${modalForm.id}`

    if (editingPkg) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPkg.id
            ? {
                ...p,
                name: finalName,
                priceVnd: Number(modalForm.priceVnd),
                credits: Number(modalForm.credits),
                bonus: Number(modalForm.bonus),
                popular: modalForm.popular,
              }
            : p
        )
      )
    } else {
      setPackages((prev) => [
        ...prev,
        {
          id: modalForm.id,
          name: finalName,
          priceVnd: Number(modalForm.priceVnd),
          credits: Number(modalForm.credits),
          bonus: Number(modalForm.bonus),
          popular: modalForm.popular,
        },
      ])
    }

    setIsModalOpen(false)
  }

  function handleDeletePackage(id: string) {
    setPackages((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <PageHeader
        title={t('economy.title')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadRulesAndPolicy}
              disabled={isLoading || isSaving}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-[#E8E4E3] dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowsClockwise size={15} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-[#E8E4E3] dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowCounterClockwise size={14} />
              <span className="hidden sm:inline">{t('economy.btn_reset')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#007b8b] hover:bg-[#006272] rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <FloppyDisk size={16} weight="bold" className={isSaving ? 'animate-pulse' : ''} />
              <span>{isSaving ? 'Đang lưu...' : t('economy.btn_save')}</span>
            </button>
          </div>
        }
      />

      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* ─── Section 1: Contribution Rewards (Primary 4-item grid) ─── */}
        <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center">
              <Coins size={18} weight="bold" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('economy.sec_rewards')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Survey Reward */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <VideoCamera size={16} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('economy.lbl_survey')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.surveyReward}
                  onChange={(e) =>
                    setPolicy((prev) => ({ ...prev, surveyReward: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full pl-3 pr-24 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_survey')}
                </span>
              </div>
            </div>

            {/* Review Reward */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <CheckSquareOffset size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('economy.lbl_review')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.reviewReward}
                  onChange={(e) =>
                    setPolicy((prev) => ({ ...prev, reviewReward: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full pl-3 pr-24 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_review')}
                </span>
              </div>
            </div>

            {/* Revalidation Bounty */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <Target size={16} className="text-amber-600 dark:text-amber-400" />
                <span>{t('economy.lbl_revalidation')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.revalidationBounty}
                  onChange={(e) =>
                    setPolicy((prev) => ({
                      ...prev,
                      revalidationBounty: Math.max(0, Number(e.target.value)),
                    }))
                  }
                  className="w-full pl-3 pr-24 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_revalidation')}
                </span>
              </div>
            </div>

            {/* Daily Task Bonus */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <Trophy size={16} className="text-purple-600 dark:text-purple-400" />
                <span>{t('economy.lbl_daily')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.dailyTaskBonus}
                  onChange={(e) =>
                    setPolicy((prev) => ({
                      ...prev,
                      dailyTaskBonus: Math.max(0, Number(e.target.value)),
                    }))
                  }
                  className="w-full pl-3 pr-24 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_daily')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 2: Dynamic Reward Rules Engine (Backend Live Rules) ─── */}
        <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Lightning size={18} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('economy.sec_dynamic_rules')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Các luật thưởng động lưu trong bảng <code className="font-mono text-indigo-600 dark:text-indigo-400">reward_rules</code> trên backend
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAddRuleModal}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-500/20"
            >
              <Plus size={14} weight="bold" />
              <span>{t('economy.btn_add_rule')}</span>
            </button>
          </div>

          {rewardRules.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
              <WarningCircle size={24} className="mx-auto text-gray-400 mb-1" />
              Chưa có luật thưởng nào hoặc backend đang offline.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">{t('economy.lbl_activity_type')}</th>
                    <th className="px-4 py-3">{t('economy.lbl_base_amount')}</th>
                    <th className="px-4 py-3">{t('economy.lbl_daily_limit')}</th>
                    <th className="px-4 py-3">Hệ số & Multiplier</th>
                    <th className="px-4 py-3">{t('economy.lbl_rule_status')}</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {rewardRules.map((rule) => {
                    const hasMultipliers =
                      rule.multiplierConfig && Object.keys(rule.multiplierConfig).length > 0
                    return (
                      <tr key={rule.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                            {rule.activityType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                          <span className="text-emerald-600 dark:text-emerald-400">+{rule.baseAmount}</span> pts
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">
                          {rule.dailyLimit > 0 ? `${rule.dailyLimit} lần/ngày` : 'Không giới hạn'}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-500 font-mono">
                          {hasMultipliers ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {JSON.stringify(rule.multiplierConfig)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              rule.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/10'
                            }`}
                          >
                            {rule.isActive ? (
                              <>
                                <CheckCircle size={13} weight="fill" />
                                <span>Hoạt động</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={13} weight="fill" />
                                <span>Tạm dừng</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRuleModal(rule)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Sửa luật thưởng"
                          >
                            <PencilSimple size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Section 3: Service Consumption & Policies (3-item grid) ─── */}
        <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <NavigationArrow size={18} weight="bold" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('economy.sec_nav_pricing')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Navigation Consumption */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <Compass size={16} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('economy.lbl_nav_rate')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.navConsumptionRate}
                  onChange={(e) =>
                    setPolicy((prev) => ({ ...prev, navConsumptionRate: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full pl-3 pr-24 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_nav_rate')}
                </span>
              </div>
            </div>

            {/* Minimum Navigation Balance */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('economy.lbl_min_balance')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={policy.minNavBalance}
                  onChange={(e) =>
                    setPolicy((prev) => ({ ...prev, minNavBalance: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full pl-3 pr-16 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_min_balance')}
                </span>
              </div>
            </div>

            {/* Reference Base Rate */}
            <div className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <Scales size={16} className="text-amber-600 dark:text-amber-400" />
                <span>{t('economy.lbl_base_rate')}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  value={policy.baseRateVndPerPoint}
                  onChange={(e) =>
                    setPolicy((prev) => ({
                      ...prev,
                      baseRateVndPerPoint: Math.max(1, Number(e.target.value)),
                    }))
                  }
                  className="w-full pl-3 pr-20 py-2 text-sm font-mono font-bold bg-white dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                />
                <span className="absolute right-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md select-none pointer-events-none">
                  {t('economy.unit_base_rate')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 4: Top-up Packages ─── */}
        <div className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CurrencyCircleDollar size={18} weight="bold" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('economy.sec_topup')}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-[#007b8b]/10 dark:bg-[#00c4de]/10 hover:bg-[#007b8b]/20 dark:hover:bg-[#00c4de]/20 text-[#007b8b] dark:text-[#00c4de] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#007b8b]/20 dark:border-[#00c4de]/20"
            >
              <Plus size={14} weight="bold" />
              <span>{t('economy.btn_add_package')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => {
              const totalCredits = pkg.credits + pkg.bonus
              return (
                <div
                  key={pkg.id}
                  className="p-4 bg-gray-50/80 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/10 relative space-y-3 hover:border-[#007b8b]/30 dark:hover:border-white/20 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 px-2 py-0.5 rounded-md">
                          {pkg.id}
                        </span>
                        {pkg.popular && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Sparkle size={10} weight="fill" />
                            {t('economy.badge_popular')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(pkg)}
                          className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title={t('economy.btn_edit')}
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={t('economy.btn_delete')}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {pkg.name}
                    </h3>

                    <div className="pt-1">
                      <span className="text-lg font-extrabold font-mono text-gray-900 dark:text-white tracking-tight">
                        {pkg.priceVnd.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    <div className="text-xs space-y-1 pt-1 border-t border-gray-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <span>{t('economy.lbl_base_credits')}:</span>
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                          {pkg.credits.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>{t('economy.lbl_bonus_credits')}:</span>
                        <span className="font-mono">+{pkg.bonus.toLocaleString()} pts</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-dashed border-gray-200 dark:border-white/10">
                        <span>{t('economy.lbl_total_credits')}:</span>
                        <span className="font-mono text-sm text-[#007b8b] dark:text-[#00c4de]">
                          {totalCredits.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </form>

      {/* ─── Modal: Add / Edit Top-up Package ─── */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingPkg ? t('economy.modal_edit_title') : t('economy.modal_add_title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('economy.lbl_pkg_name')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('economy.ph_pkg_name')}
                    value={modalForm.name}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('economy.lbl_price_vnd')} (₫)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={modalForm.priceVnd}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, priceVnd: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('economy.lbl_base_credits')} (pts)
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={modalForm.credits}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, credits: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('economy.lbl_bonus_credits')} (pts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalForm.bonus}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, bonus: Math.max(0, Number(e.target.value)) }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pkg_popular"
                    checked={modalForm.popular}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, popular: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                  />
                  <label
                    htmlFor="pkg_popular"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    {t('economy.badge_popular')}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-[#E8E4E3] dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {t('economy.btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#007b8b] hover:bg-[#006272] rounded-xl transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    {t('economy.btn_confirm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── Modal: Add / Edit Dynamic Reward Rule ─── */}
      {isRuleModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingRule ? t('economy.modal_edit_rule_title') : t('economy.modal_add_rule_title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRuleModalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('economy.lbl_activity_type')}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRule}
                    placeholder="VD: SURVEY_REWARD, REVIEW_REWARD..."
                    value={ruleForm.activityType}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, activityType: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('economy.lbl_base_amount')} (pts)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={ruleForm.baseAmount}
                      onChange={(e) =>
                        setRuleForm((prev) => ({ ...prev, baseAmount: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('economy.lbl_daily_limit')}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={ruleForm.dailyLimit}
                      onChange={(e) =>
                        setRuleForm((prev) => ({ ...prev, dailyLimit: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full px-3.5 py-2 text-sm font-mono bg-gray-50 dark:bg-[#030708] border border-gray-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rule_active"
                    checked={ruleForm.isActive}
                    onChange={(e) => setRuleForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#007b8b] focus:ring-[#007b8b] border-gray-300 cursor-pointer"
                  />
                  <label
                    htmlFor="rule_active"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Kích hoạt luật thưởng ngay
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRuleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-[#E8E4E3] dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {t('economy.btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#007b8b] hover:bg-[#006272] rounded-xl transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    {t('economy.btn_confirm')}
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
