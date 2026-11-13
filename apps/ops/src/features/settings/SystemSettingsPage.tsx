import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect from '@/components/common/CustomSelect'
import {
  systemService,
  catalogService,
  type SystemParameterItem,
  type RouteMatrixItem,
  type SystemFeatureFlagItem,
  type FreshnessRuleItem,
  type FreshnessRulePriority,
  type SignCategoryItem,
} from '@/api/services'
import {
  FloppyDisk,
  ShieldCheck,
  ArrowsClockwise,
  SlidersHorizontal,
  Plus,
  Table,
  ToggleLeft,
  RocketLaunch,
  CircleNotch,
  PencilSimple,
  X,
} from '@phosphor-icons/react'

interface SwitchDisplayMeta {
  titleVi: string
  titleEn: string
  descVi: string
  descEn: string
}

const DEMO_SWITCH_LABELS: Record<string, SwitchDisplayMeta> = {
  DEMO_MODE_ACTIVE: {
    titleVi: 'Chế độ Demo tổng',
    titleEn: 'Master Demo Mode',
    descVi: 'Tự động bật toàn bộ các tùy chọn rút gọn bên dưới',
    descEn: 'Automatically turns on all demo shortcuts below',
  },
  SINGLE_VOTE_CONSENSUS: {
    titleVi: 'Duyệt nhanh chỉ với 1 phiếu',
    titleEn: 'Single-vote approval',
    descVi: 'Biển báo được duyệt hoặc từ chối ngay sau lượt đánh giá đầu tiên',
    descEn: 'Approve or reject a sign right after the first reviewer vote',
  },
  ALLOW_SELF_REVIEW: {
    titleVi: 'Cho phép tự đánh giá bài của mình',
    titleEn: 'Allow self-review',
    descVi: 'Người khảo sát có thể xem và tự duyệt ảnh do chính mình gửi lên',
    descEn: 'Surveyors can review and vote on their own submissions',
  },
  BYPASS_RECAPTURE_GEOFENCE: {
    titleVi: 'Bỏ qua kiểm tra khoảng cách GPS',
    titleEn: 'Bypass GPS distance check',
    descVi: 'Có thể nhận và hoàn thành yêu cầu chụp lại ở bất kỳ vị trí nào',
    descEn: 'Accept and submit recapture tasks from any location',
  },
  AUTO_ASSIGN_RECAPTURE_EMAIL: {
    titleVi: 'Giao việc chụp lại cho tài khoản thử nghiệm',
    titleEn: 'Assign recaptures to test account',
    descVi: 'Tự động gửi nhiệm vụ chụp lại về email mặc định thay vì mở công khai',
    descEn: 'Route new recapture tasks directly to the target email',
  },
  ENABLE_TEST_UTILITY_ENDPOINTS: {
    titleVi: 'Mở công cụ hỗ trợ kiểm thử',
    titleEn: 'Enable testing utilities',
    descVi: 'Cho phép dùng các API tạo nhanh dữ liệu và gán đánh giá',
    descEn: 'Allow test helper APIs for quick review injection and assignment',
  },
}

const ROAD_TYPE_LABELS: Record<string, { vi: string; en: string }> = {
  EXPRESSWAY: { vi: 'Đường cao tốc', en: 'Expressway' },
  HIGHWAY: { vi: 'Quốc lộ', en: 'Highway' },
  NATIONAL_HIGHWAY: { vi: 'Quốc lộ', en: 'National highway' },
  PROVINCIAL_ROAD: { vi: 'Đường tỉnh', en: 'Provincial road' },
  URBAN: { vi: 'Đường đô thị', en: 'Urban road' },
  URBAN_STREET: { vi: 'Đường đô thị', en: 'Urban street' },
  RURAL: { vi: 'Đường nông thôn', en: 'Rural road' },
  RURAL_LOCAL: { vi: 'Đường liên xã', en: 'Rural local' },
}

const PRIORITY_LABELS: Record<string, { vi: string; en: string; className: string }> = {
  LOW: {
    vi: 'Thấp',
    en: 'Low',
    className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  },
  MEDIUM: {
    vi: 'Trung bình',
    en: 'Medium',
    className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  HIGH: {
    vi: 'Cao',
    en: 'High',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
}

function getCategoryDisplayName(
  rule: FreshnessRuleItem,
  categories: SignCategoryItem[],
  isEn: boolean
): string {
  if (isEn && rule.categoryNameEn) return rule.categoryNameEn
  if (!isEn && rule.categoryNameVi) return rule.categoryNameVi
  if (rule.signCategoryId != null) {
    const matched = categories.find((c) => c.id === rule.signCategoryId)
    if (matched) return isEn ? matched.nameEn || matched.nameVi : matched.nameVi
    return isEn ? `Category #${rule.signCategoryId}` : `Nhóm #${rule.signCategoryId}`
  }
  return isEn ? 'All categories' : 'Tất cả nhóm biển'
}

function getRouteDisplayName(item: RouteMatrixItem, isEn: boolean): string {
  if (item.name) return item.name
  const typeKey = (item.roadType || item.road_type || item.routeClass || item.route_class || '').toUpperCase()
  const mapped = ROAD_TYPE_LABELS[typeKey]
  if (mapped) return isEn ? mapped.en : mapped.vi
  return typeKey || (isEn ? `Route #${item.id}` : `Tuyến đường #${item.id}`)
}

export default function SystemSettingsPage() {
  const { i18n } = useTranslation('ops')
  const toast = useToast()
  const isEn = i18n.language?.startsWith('en')

  const [activeTab, setActiveTab] = useState<'consensus' | 'freshness' | 'parameters' | 'demo_mode'>('consensus')
  const [isLoading, setIsLoading] = useState(true)

  // ── Tab 1: Consensus Config ──
  const [approvalThreshold, setApprovalThreshold] = useState(2.0)
  const [rejectionThreshold, setRejectionThreshold] = useState(-2.0)
  const [minVotesRequired, setMinVotesRequired] = useState(3)
  const [maxVotesLimit, setMaxVotesLimit] = useState(9)
  const [alphaSmoothingFactor, setAlphaSmoothingFactor] = useState(0.1)
  const [weightCorrect, setWeightCorrect] = useState(1.0)
  const [penaltyFalse, setPenaltyFalse] = useState(2.0)
  const [provisionalVoteWeight, setProvisionalVoteWeight] = useState(0.5)
  const [minSampleBaseline, setMinSampleBaseline] = useState(5)
  const [minReliabilityThreshold, setMinReliabilityThreshold] = useState(50)
  const [consecutiveErrorLimit, setConsecutiveErrorLimit] = useState(3)
  const [suspensionCooldownDays, setSuspensionCooldownDays] = useState(7)
  const [consensusReason, setConsensusReason] = useState('')
  const [isSavingConsensus, setIsSavingConsensus] = useState(false)

  // ── Tab 2: Freshness Rules & Route Matrix ──
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [freshnessRules, setFreshnessRules] = useState<FreshnessRuleItem[]>([])
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [ruleCategoryId, setRuleCategoryId] = useState<string>('')
  const [rulePeriodDays, setRulePeriodDays] = useState<number>(30)
  const [rulePriority, setRulePriority] = useState<FreshnessRulePriority>('MEDIUM')
  const [ruleProximityMeters, setRuleProximityMeters] = useState<number>(50)
  const [ruleDailyLimit, setRuleDailyLimit] = useState<number>(3)
  const [ruleReason, setRuleReason] = useState('')
  const [isSavingRule, setIsSavingRule] = useState(false)
  const [togglingRuleId, setTogglingRuleId] = useState<number | null>(null)

  const [routeMatrix, setRouteMatrix] = useState<RouteMatrixItem[]>([])
  const [routeReason, setRouteReason] = useState('')
  const [isSavingRoutes, setIsSavingRoutes] = useState(false)

  // ── Tab 3: System Parameters ──
  const [rawParameters, setRawParameters] = useState<SystemParameterItem[]>([])
  const [paramKey, setParamKey] = useState('')
  const [paramValue, setParamValue] = useState('')
  const [paramDesc, setParamDesc] = useState('')
  const [isSavingParam, setIsSavingParam] = useState(false)

  // ── Tab 4: Dynamic Demo Switchboard ──
  const [systemSwitches, setSystemSwitches] = useState<SystemFeatureFlagItem[]>([])
  const [demoTargetEmail, setDemoTargetEmail] = useState('demo@stm.dev')
  const [switchReason, setSwitchReason] = useState('')
  const [togglingSwitchKey, setTogglingSwitchKey] = useState<string | null>(null)
  const [isBulkTogglingDemo, setIsBulkTogglingDemo] = useState(false)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [paramsRes, consensusRes, matrixRes, rulesRes, catsRes, switchesRes] =
        await Promise.allSettled([
          systemService.getParameters(),
          systemService.getConsensusConfig(),
          systemService.getRouteMatrix(),
          systemService.listFreshnessRules(),
          catalogService.getCategories(),
          systemService.getSystemSwitches(),
        ])

      if (paramsRes.status === 'fulfilled' && Array.isArray(paramsRes.value)) {
        setRawParameters(paramsRes.value)
      }

      if (consensusRes.status === 'fulfilled' && consensusRes.value) {
        const c = consensusRes.value
        if (c.approvalThreshold !== undefined) setApprovalThreshold(Number(c.approvalThreshold))
        if (c.rejectionThreshold !== undefined) setRejectionThreshold(Number(c.rejectionThreshold))
        if (c.minVotesRequired !== undefined) setMinVotesRequired(Number(c.minVotesRequired))
        if (c.maxVotesLimit !== undefined) setMaxVotesLimit(Number(c.maxVotesLimit))
        if (c.alphaSmoothingFactor !== undefined) setAlphaSmoothingFactor(Number(c.alphaSmoothingFactor))
        if (c.weightCorrect !== undefined) setWeightCorrect(Number(c.weightCorrect))
        if (c.penaltyFalse !== undefined) setPenaltyFalse(Number(c.penaltyFalse))
        if (c.provisionalVoteWeight !== undefined) setProvisionalVoteWeight(Number(c.provisionalVoteWeight))
        if (c.minSampleBaseline !== undefined) setMinSampleBaseline(Number(c.minSampleBaseline))
        if (c.minReliabilityThreshold !== undefined) setMinReliabilityThreshold(Number(c.minReliabilityThreshold))
        if (c.consecutiveErrorLimit !== undefined) setConsecutiveErrorLimit(Number(c.consecutiveErrorLimit))
        if (c.suspensionCooldownDays !== undefined) setSuspensionCooldownDays(Number(c.suspensionCooldownDays))
      }

      if (matrixRes.status === 'fulfilled' && Array.isArray(matrixRes.value)) {
        setRouteMatrix(matrixRes.value)
      }

      if (rulesRes.status === 'fulfilled' && Array.isArray(rulesRes.value)) {
        setFreshnessRules(rulesRes.value)
      }

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories(catsRes.value)
      }

      if (switchesRes.status === 'fulfilled' && Array.isArray(switchesRes.value)) {
        setSystemSwitches(switchesRes.value)
        const autoEmailFlag = switchesRes.value.find(
          (f) => f.key === 'AUTO_ASSIGN_RECAPTURE_EMAIL' || f.key === 'DEMO_MODE_ACTIVE'
        )
        const storedEmail = autoEmailFlag?.metadata?.targetEmail
        if (typeof storedEmail === 'string' && storedEmail.trim()) {
          setDemoTargetEmail(storedEmail.trim())
        }
      }
    } catch (err) {
      console.warn('Could not load some settings from backend:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ── Consensus Save ──
  async function handleSaveConsensus(e: React.FormEvent) {
    e.preventDefault()
    if (minVotesRequired < 1 || maxVotesLimit < minVotesRequired) {
      toast.warning(
        isEn
          ? 'Max votes must be greater than or equal to min votes.'
          : 'Số phiếu tối đa phải lớn hơn hoặc bằng số phiếu tối thiểu.'
      )
      return
    }
    setIsSavingConsensus(true)
    try {
      await systemService.updateConsensusConfig({
        approvalThreshold,
        rejectionThreshold,
        minVotesRequired,
        maxVotesLimit,
        alphaSmoothingFactor,
        weightCorrect,
        penaltyFalse,
        provisionalVoteWeight,
        minSampleBaseline,
        minReliabilityThreshold,
        consecutiveErrorLimit,
        suspensionCooldownDays,
        reason: consensusReason.trim() || undefined,
      })
      setConsensusReason('')
      toast.success(isEn ? 'Consensus configuration saved.' : 'Đã lưu cấu hình đồng thuận.')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save consensus settings.' : 'Không thể lưu cấu hình đồng thuận.'))
    } finally {
      setIsSavingConsensus(false)
    }
  }

  // ── Freshness Rule Helpers ──
  function openCreateRuleForm() {
    setEditingRuleId(null)
    setRuleCategoryId('')
    setRulePeriodDays(30)
    setRulePriority('MEDIUM')
    setRuleProximityMeters(50)
    setRuleDailyLimit(3)
    setRuleReason('')
    setIsRuleFormOpen(true)
  }

  function openEditRuleForm(rule: FreshnessRuleItem) {
    setEditingRuleId(rule.id)
    setRuleCategoryId(rule.signCategoryId != null ? String(rule.signCategoryId) : '')
    setRulePeriodDays(rule.freshnessPeriodDays)
    const p = (rule.defaultPriority || 'MEDIUM').toUpperCase()
    setRulePriority(p === 'LOW' || p === 'HIGH' ? p : 'MEDIUM')
    setRuleProximityMeters(rule.maxProximityMeters)
    setRuleDailyLimit(rule.dailySubmissionLimit)
    setRuleReason('')
    setIsRuleFormOpen(true)
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingRule(true)
    try {
      const catIdNum = ruleCategoryId ? Number(ruleCategoryId) : undefined
      if (editingRuleId != null) {
        await systemService.updateFreshnessRule(editingRuleId, {
          signCategoryId: catIdNum,
          freshnessPeriodDays: rulePeriodDays,
          defaultPriority: rulePriority,
          maxProximityMeters: ruleProximityMeters,
          dailySubmissionLimit: ruleDailyLimit,
          reason: ruleReason.trim() || undefined,
        })
        toast.success(isEn ? 'Freshness rule updated.' : 'Đã cập nhật quy tắc độ tươi.')
      } else {
        await systemService.createFreshnessRule({
          signCategoryId: catIdNum,
          freshnessPeriodDays: rulePeriodDays,
          defaultPriority: rulePriority,
          maxProximityMeters: ruleProximityMeters,
          dailySubmissionLimit: ruleDailyLimit,
          isActive: true,
          reason: ruleReason.trim() || undefined,
        })
        toast.success(isEn ? 'Freshness rule created.' : 'Đã tạo quy tắc độ tươi mới.')
      }
      setIsRuleFormOpen(false)
      setEditingRuleId(null)
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save freshness rule.' : 'Không thể lưu quy tắc độ tươi.'))
    } finally {
      setIsSavingRule(false)
    }
  }

  async function handleToggleRuleActive(rule: FreshnessRuleItem) {
    setTogglingRuleId(rule.id)
    try {
      if (rule.isActive) {
        await systemService.deleteFreshnessRule(rule.id)
        toast.success(isEn ? 'Rule turned off.' : 'Đã ngừng áp dụng quy tắc.')
      } else {
        await systemService.updateFreshnessRule(rule.id, { isActive: true })
        toast.success(isEn ? 'Rule activated.' : 'Đã bật lại quy tắc.')
      }
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not update rule status.' : 'Không thể thay đổi trạng thái quy tắc.'))
    } finally {
      setTogglingRuleId(null)
    }
  }

  // ── Route Matrix Helpers ──
  function handleRouteFieldChange(id: number, field: keyof RouteMatrixItem, val: string | number) {
    setRouteMatrix((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  async function handleSaveRoutes(e: React.FormEvent) {
    e.preventDefault()
    if (routeMatrix.length === 0) return
    setIsSavingRoutes(true)
    try {
      await Promise.all(
        routeMatrix.map((item) =>
          systemService.updateRouteMatrix(item.id, {
            roadType: item.roadType || item.road_type || undefined,
            defaultLifetimeDays: Number(item.defaultLifetimeDays ?? item.default_lifetime_days ?? 180),
            revalidationThresholdDays: Number(
              item.revalidationThresholdDays ??
                item.revalidation_threshold_days ??
                item.revalThresholdDays ??
                30
            ),
            spatialBufferMeters: Number(item.spatialBufferMeters ?? item.spatial_buffer_meters ?? 15),
            reason: routeReason.trim() || undefined,
          })
        )
      )
      setRouteReason('')
      toast.success(isEn ? 'Route matrix saved.' : 'Đã lưu bảng cấp đường.')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save route matrix.' : 'Không thể lưu bảng cấp đường.'))
    } finally {
      setIsSavingRoutes(false)
    }
  }

  // ── System Parameter Helpers ──
  async function handleSaveParameter(e: React.FormEvent) {
    e.preventDefault()
    const cleanKey = paramKey.trim()
    if (!cleanKey) {
      toast.warning(isEn ? 'Please enter a parameter key.' : 'Vui lòng nhập mã tham số.')
      return
    }
    if (!paramValue.trim()) {
      toast.warning(isEn ? 'Please enter a parameter value.' : 'Vui lòng nhập giá trị tham số.')
      return
    }
    setIsSavingParam(true)
    try {
      await systemService.upsertParameter(cleanKey, {
        value: paramValue.trim(),
        description: paramDesc.trim() || undefined,
      })
      toast.success(isEn ? `Parameter ${cleanKey} saved.` : `Đã lưu tham số ${cleanKey}.`)
      setParamKey('')
      setParamValue('')
      setParamDesc('')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save parameter.' : 'Không thể lưu tham số.'))
    } finally {
      setIsSavingParam(false)
    }
  }

  function handleSelectParameterForEdit(item: SystemParameterItem) {
    setParamKey(item.key)
    setParamValue(typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? ''))
    setParamDesc(item.description || '')
  }

  // ── Demo Switchboard Helpers ──
  async function handleToggleSwitch(flag: SystemFeatureFlagItem) {
    setTogglingSwitchKey(flag.key)
    try {
      const nextState = !flag.isEnabled
      const metadata =
        flag.key === 'AUTO_ASSIGN_RECAPTURE_EMAIL' || flag.key === 'DEMO_MODE_ACTIVE'
          ? { ...flag.metadata, targetEmail: demoTargetEmail.trim() || 'demo@stm.dev' }
          : flag.metadata
      const updated = await systemService.updateSystemSwitch(flag.key, {
        isEnabled: nextState,
        metadata,
        reason: switchReason.trim() || undefined,
      })
      setSystemSwitches((prev) => {
        const exists = prev.some((item) => item.key === flag.key)
        if (!exists) return [...prev, updated]
        return prev.map((item) => (item.key === flag.key ? { ...item, ...updated } : item))
      })
      const meta = DEMO_SWITCH_LABELS[flag.key]
      const label = meta ? (isEn ? meta.titleEn : meta.titleVi) : flag.key
      toast.success(
        isEn
          ? `${label} turned ${nextState ? 'on' : 'off'}`
          : `Đã ${nextState ? 'bật' : 'tắt'} ${label}`
      )
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not update setting' : 'Không thể cập nhật tùy chọn'))
    } finally {
      setTogglingSwitchKey(null)
    }
  }

  async function handleEnableDemoMode() {
    setIsBulkTogglingDemo(true)
    try {
      const updatedList = await systemService.enableDemoMode({
        targetEmail: demoTargetEmail.trim() || 'demo@stm.dev',
        reason: switchReason.trim() || undefined,
      })
      setSystemSwitches(updatedList)
      toast.success(isEn ? 'All demo mode switches enabled' : 'Đã bật toàn bộ chế độ Demo')
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Failed to enable demo mode' : 'Không thể bật chế độ Demo'))
    } finally {
      setIsBulkTogglingDemo(false)
    }
  }

  async function handleDisableDemoMode() {
    setIsBulkTogglingDemo(true)
    try {
      const updatedList = await systemService.disableDemoMode({
        reason: switchReason.trim() || undefined,
      })
      setSystemSwitches(updatedList)
      toast.success(isEn ? 'System restored to standard mode' : 'Đã khôi phục chế độ chuẩn hệ thống')
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Failed to reset demo mode' : 'Không thể tắt chế độ Demo'))
    } finally {
      setIsBulkTogglingDemo(false)
    }
  }

  const isAnyDemoActive = systemSwitches.some((f) => f.isEnabled)

  const categorySelectOptions = [
    { value: '', label: isEn ? 'All categories' : 'Tất cả nhóm biển' },
    ...categories.map((c) => ({
      value: String(c.id),
      label: isEn ? c.nameEn || c.nameVi : c.nameVi,
    })),
  ]

  return (
    <div className="p-6 sm:p-8 w-full max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={isEn ? 'System settings' : 'Cấu hình hệ thống'}
        actions={
          <button
            type="button"
            onClick={loadSettings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Menu */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('consensus')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'consensus'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={18} />
            <span>{isEn ? 'Consensus rules' : 'Đồng thuận đánh giá'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('freshness')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'freshness'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <ArrowsClockwise size={18} />
            <span>{isEn ? 'Freshness & routes' : 'Độ tươi và kiểm tra lại'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parameters')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'parameters'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Table size={18} />
            <span>{isEn ? 'System parameters' : 'Tham số hệ thống'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo_mode')}
            className={`w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'demo_mode'
                ? 'bg-[#007b8b] text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <ToggleLeft size={18} />
              <span>{isEn ? 'Demo Mode' : 'Chế độ thử nghiệm'}</span>
            </span>
            {isAnyDemoActive && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === 'demo_mode' ? 'bg-amber-300' : 'bg-amber-500 animate-pulse'
                }`}
              />
            )}
          </button>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
          {/* TAB 1: Consensus Configuration */}
          {activeTab === 'consensus' && (
            <form onSubmit={handleSaveConsensus} className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? 'Consensus configuration' : 'Cài đặt đồng thuận'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isEn
                    ? 'Adjust vote thresholds, reviewer weights, and reliability penalties.'
                    : 'Điều chỉnh số phiếu, điểm duyệt biển báo và kỷ luật người đánh giá.'}
                </p>
              </div>

              {/* Group 1: Approval & Vote Quorums */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Approval and vote thresholds' : 'Ngưỡng duyệt và số phiếu'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Approval score threshold' : 'Điểm đạt duyệt biển'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={approvalThreshold}
                      onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                    <p className="text-[11px] text-gray-400">
                      {isEn
                        ? 'Weighted sum required to approve a sign.'
                        : 'Tổng điểm phiếu cần đạt để tự động duyệt biển lên bản đồ.'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Rejection score threshold' : 'Điểm bác bỏ biển'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      max="-0.1"
                      value={rejectionThreshold}
                      onChange={(e) => setRejectionThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                    <p className="text-[11px] text-gray-400">
                      {isEn
                        ? 'Negative weighted sum to reject a candidate.'
                        : 'Tổng điểm âm để tự động từ chối biển báo sai.'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Minimum votes required' : 'Số phiếu tối thiểu'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={minVotesRequired}
                      onChange={(e) => setMinVotesRequired(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                    <p className="text-[11px] text-gray-400">
                      {isEn
                        ? 'Minimum reviews before consensus runs.'
                        : 'Số lượt đánh giá ít nhất trước khi hệ thống chốt kết quả.'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Maximum votes limit' : 'Số phiếu tối đa'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={maxVotesLimit}
                      onChange={(e) => setMaxVotesLimit(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                    <p className="text-[11px] text-gray-400">
                      {isEn
                        ? 'Escalate to admin when reached without decision.'
                        : 'Chuyển lên quản trị viên nếu đạt số phiếu này mà chưa ngã ngũ.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 2: Reviewer Weights & Discipline */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Reviewer weights and discipline' : 'Trọng số và kỷ luật người đánh giá'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Correct vote reward weight' : 'Điểm cộng khi đúng'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weightCorrect}
                      onChange={(e) => setWeightCorrect(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'False vote penalty' : 'Điểm phạt khi sai'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={penaltyFalse}
                      onChange={(e) => setPenaltyFalse(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Alpha smoothing factor' : 'Hệ số làm mượt Alpha'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1"
                      value={alphaSmoothingFactor}
                      onChange={(e) => setAlphaSmoothingFactor(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Provisional vote weight' : 'Trọng số người mới'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2"
                      value={provisionalVoteWeight}
                      onChange={(e) => setProvisionalVoteWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Min sample baseline' : 'Số phiếu thử việc tối thiểu'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minSampleBaseline}
                      onChange={(e) => setMinSampleBaseline(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Min reliability score' : 'Ngưỡng uy tín tối thiểu'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={minReliabilityThreshold}
                      onChange={(e) => setMinReliabilityThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Consecutive error limit' : 'Số lần sai liên tiếp tối đa'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={consecutiveErrorLimit}
                      onChange={(e) => setConsecutiveErrorLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Suspension days' : 'Số ngày tạm khóa tài khoản'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={suspensionCooldownDays}
                      onChange={(e) => setSuspensionCooldownDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  value={consensusReason}
                  onChange={(e) => setConsensusReason(e.target.value)}
                  placeholder={isEn ? 'Reason for update' : 'Lý do thay đổi nếu cần lưu nhật ký'}
                  className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                />
                <button
                  type="submit"
                  disabled={isSavingConsensus}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSavingConsensus ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <FloppyDisk size={16} weight="bold" />
                  )}
                  <span>{isSavingConsensus ? (isEn ? 'Saving...' : 'Đang lưu...') : isEn ? 'Save consensus' : 'Lưu cấu hình đồng thuận'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Freshness Rules & Route Matrix */}
          {activeTab === 'freshness' && (
            <div className="space-y-8">
              {/* Section 1: Category Freshness Rules */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      {isEn ? 'Category freshness rules' : 'Quy tắc theo nhóm biển báo'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isEn
                        ? 'Configure revalidation cycle, priority, GPS radius, and daily limit per sign category.'
                        : 'Cấu hình chu kỳ kiểm tra lại, mức ưu tiên, khoảng cách GPS và giới hạn nộp mỗi ngày.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateRuleForm}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} weight="bold" />
                    <span>{isEn ? 'Add rule' : 'Thêm quy tắc'}</span>
                  </button>
                </div>

                {/* Add / Edit Rule Form */}
                {isRuleFormOpen && (
                  <form
                    onSubmit={handleSaveRule}
                    className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {editingRuleId != null
                          ? isEn
                            ? `Edit rule #${editingRuleId}`
                            : `Sửa quy tắc #${editingRuleId}`
                          : isEn
                            ? 'Create freshness rule'
                            : 'Tạo quy tắc mới'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRuleFormOpen(false)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Sign category' : 'Nhóm biển báo'}
                        </label>
                        <CustomSelect
                          value={ruleCategoryId}
                          onChange={(val) => setRuleCategoryId(val)}
                          options={categorySelectOptions}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Cycle days' : 'Chu kỳ kiểm tra ngày'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={rulePeriodDays}
                          onChange={(e) => setRulePeriodDays(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Default priority' : 'Mức ưu tiên'}
                        </label>
                        <CustomSelect
                          value={rulePriority}
                          onChange={(val) => setRulePriority(val as FreshnessRulePriority)}
                          options={[
                            { value: 'LOW', label: isEn ? 'Low' : 'Thấp' },
                            { value: 'MEDIUM', label: isEn ? 'Medium' : 'Trung bình' },
                            { value: 'HIGH', label: isEn ? 'High' : 'Cao' },
                          ]}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Max GPS distance in meters' : 'Khoảng cách GPS tối đa mét'}
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="500"
                          required
                          value={ruleProximityMeters}
                          onChange={(e) => setRuleProximityMeters(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Daily submission limit' : 'Giới hạn nộp mỗi ngày'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          required
                          value={ruleDailyLimit}
                          onChange={(e) => setRuleDailyLimit(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300">
                          {isEn ? 'Reason' : 'Lý do thay đổi'}
                        </label>
                        <input
                          type="text"
                          value={ruleReason}
                          onChange={(e) => setRuleReason(e.target.value)}
                          placeholder={isEn ? 'Optional reason' : 'Nhập lý do nếu cần'}
                          className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRuleFormOpen(false)}
                        className="px-3.5 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold cursor-pointer"
                      >
                        {isEn ? 'Cancel' : 'Hủy'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingRule}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isSavingRule && <CircleNotch size={14} className="animate-spin" />}
                        <span>{isEn ? 'Save rule' : 'Lưu quy tắc'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Freshness Rules Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-3.5 py-2.5">{isEn ? 'Category' : 'Nhóm biển'}</th>
                        <th className="px-3.5 py-2.5">{isEn ? 'Cycle' : 'Chu kỳ'}</th>
                        <th className="px-3.5 py-2.5">{isEn ? 'Priority' : 'Ưu tiên'}</th>
                        <th className="px-3.5 py-2.5">{isEn ? 'GPS radius' : 'GPS tối đa'}</th>
                        <th className="px-3.5 py-2.5">{isEn ? 'Daily cap' : 'Giới hạn ngày'}</th>
                        <th className="px-3.5 py-2.5">{isEn ? 'Status' : 'Trạng thái'}</th>
                        <th className="px-3.5 py-2.5 text-center">{isEn ? 'Actions' : 'Thao tác'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {freshnessRules.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                            {isEn ? 'No freshness rules found.' : 'Chưa có quy tắc độ tươi nào.'}
                          </td>
                        </tr>
                      ) : (
                        freshnessRules.map((rule) => {
                          const pri = PRIORITY_LABELS[String(rule.defaultPriority).toUpperCase()] || PRIORITY_LABELS.MEDIUM
                          return (
                            <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                              <td className="px-3.5 py-2.5 font-semibold text-gray-900 dark:text-white">
                                {getCategoryDisplayName(rule, categories, isEn)}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono">
                                {rule.freshnessPeriodDays} {isEn ? 'days' : 'ngày'}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${pri.className}`}>
                                  {isEn ? pri.en : pri.vi}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono">{rule.maxProximityMeters}m</td>
                              <td className="px-3.5 py-2.5 font-mono">{rule.dailySubmissionLimit}</td>
                              <td className="px-3.5 py-2.5">
                                <span
                                  className={`font-semibold ${
                                    rule.isActive
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {rule.isActive ? (isEn ? 'Active' : 'Đang bật') : isEn ? 'Inactive' : 'Đã tắt'}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditRuleForm(rule)}
                                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
                                  >
                                    {isEn ? 'Edit' : 'Sửa'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={togglingRuleId === rule.id}
                                    onClick={() => handleToggleRuleActive(rule)}
                                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer disabled:opacity-50 ${
                                      rule.isActive
                                        ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    }`}
                                  >
                                    {rule.isActive ? (isEn ? 'Disable' : 'Tắt') : isEn ? 'Enable' : 'Bật'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Route Classifications Matrix */}
              <form onSubmit={handleSaveRoutes} className="pt-5 border-t border-gray-200 dark:border-white/10 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-[#007b8b]" />
                    <span>{isEn ? 'Route decay matrix' : 'Quy tắc theo cấp đường'}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn
                      ? 'Configure sign lifetime, revalidation threshold, and spatial buffer per road classification.'
                      : 'Cấu hình vòng đời biển báo, ngưỡng báo trễ và phạm vi đệm GPS cho từng loại đường.'}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3">{isEn ? 'Route' : 'Tên tuyến đường'}</th>
                        <th className="px-4 py-3">{isEn ? 'Road type' : 'Loại đường'}</th>
                        <th className="px-4 py-3">{isEn ? 'Lifetime days' : 'Vòng đời ngày'}</th>
                        <th className="px-4 py-3">{isEn ? 'Threshold days' : 'Ngưỡng trễ ngày'}</th>
                        <th className="px-4 py-3">{isEn ? 'GPS buffer meters' : 'Vùng đệm mét'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                      {routeMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center font-sans text-gray-400">
                            {isEn ? 'No route classifications found.' : 'Chưa có dữ liệu cấp đường từ máy chủ.'}
                          </td>
                        </tr>
                      ) : (
                        routeMatrix.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-4 py-3 font-sans font-bold text-gray-900 dark:text-white">
                              {getRouteDisplayName(item, isEn)}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.roadType ?? item.road_type ?? ''}
                                onChange={(e) => handleRouteFieldChange(item.id, 'roadType', e.target.value)}
                                className="w-32 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:border-[#007b8b]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                max="2000"
                                value={item.defaultLifetimeDays ?? item.default_lifetime_days ?? 180}
                                onChange={(e) =>
                                  handleRouteFieldChange(item.id, 'defaultLifetimeDays', Number(e.target.value))
                                }
                                className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold focus:outline-none focus:border-[#007b8b]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={
                                  item.revalidationThresholdDays ??
                                  item.revalidation_threshold_days ??
                                  item.revalThresholdDays ??
                                  30
                                }
                                onChange={(e) =>
                                  handleRouteFieldChange(item.id, 'revalidationThresholdDays', Number(e.target.value))
                                }
                                className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold focus:outline-none focus:border-[#007b8b]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={item.spatialBufferMeters ?? item.spatial_buffer_meters ?? 15}
                                onChange={(e) =>
                                  handleRouteFieldChange(item.id, 'spatialBufferMeters', Number(e.target.value))
                                }
                                className="w-24 px-2 py-1 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold focus:outline-none focus:border-[#007b8b]"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {routeMatrix.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      value={routeReason}
                      onChange={(e) => setRouteReason(e.target.value)}
                      placeholder={isEn ? 'Reason for route update' : 'Lý do thay đổi nếu cần lưu nhật ký'}
                      className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingRoutes}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSavingRoutes ? (
                        <CircleNotch size={15} className="animate-spin" />
                      ) : (
                        <FloppyDisk size={15} weight="bold" />
                      )}
                      <span>{isSavingRoutes ? (isEn ? 'Saving...' : 'Đang lưu...') : isEn ? 'Save route matrix' : 'Lưu bảng cấp đường'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 3: Global System Parameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? 'System parameters' : 'Tham số hệ thống'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isEn
                    ? 'Inspect and update global parameters stored in the backend database.'
                    : 'Xem và điều chỉnh các tham số vận hành đang lưu trong cơ sở dữ liệu.'}
                </p>
              </div>

              {/* Add or Update Parameter Form */}
              <form
                onSubmit={handleSaveParameter}
                className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Plus size={14} weight="bold" className="text-[#007b8b]" />
                    <span>{isEn ? 'Add or update parameter' : 'Thêm mới hoặc cập nhật tham số'}</span>
                  </p>
                  {(paramKey || paramValue || paramDesc) && (
                    <button
                      type="button"
                      onClick={() => {
                        setParamKey('')
                        setParamValue('')
                        setParamDesc('')
                      }}
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-white font-semibold cursor-pointer"
                    >
                      {isEn ? 'Clear' : 'Xóa trắng'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder={isEn ? 'Parameter key' : 'Mã tham số'}
                    value={paramKey}
                    onChange={(e) => setParamKey(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-[#007b8b]"
                  />
                  <input
                    type="text"
                    placeholder={isEn ? 'Value' : 'Giá trị'}
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-[#007b8b]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={isEn ? 'Description' : 'Mô tả'}
                      value={paramDesc}
                      onChange={(e) => setParamDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingParam}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white font-bold rounded-lg text-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {isSavingParam && <CircleNotch size={13} className="animate-spin" />}
                      <span>{isEn ? 'Save' : 'Lưu'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Parameters Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">{isEn ? 'Key' : 'Mã tham số'}</th>
                      <th className="px-4 py-3">{isEn ? 'Value' : 'Giá trị'}</th>
                      <th className="px-4 py-3">{isEn ? 'Description' : 'Mô tả'}</th>
                      <th className="px-4 py-3 text-center">{isEn ? 'Action' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {rawParameters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          {isEn ? 'No system parameters found.' : 'Chưa có tham số nào.'}
                        </td>
                      </tr>
                    ) : (
                      rawParameters.map((p) => (
                        <tr key={p.key} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-2.5 font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">
                            {p.key}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-800 dark:text-gray-200 max-w-[220px] truncate">
                            {typeof p.value === 'object' ? JSON.stringify(p.value) : String(p.value)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 max-w-[240px] truncate">
                            {p.description || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectParameterForEdit(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
                            >
                              <PencilSimple size={12} />
                              <span>{isEn ? 'Edit' : 'Sửa'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Dynamic Demo Switchboard */}
          {activeTab === 'demo_mode' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <RocketLaunch size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
                    <span>{isEn ? 'Demo Mode Switchboard' : 'Chế độ thử nghiệm nhanh'}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isEn
                      ? 'Turn on presentation shortcuts quickly or restore strict production rules.'
                      : 'Bật nhanh các quy tắc rút gọn khi trình bày hoặc khôi phục lại quy tắc chuẩn của hệ thống.'}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isAnyDemoActive
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAnyDemoActive ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {isAnyDemoActive
                      ? isEn
                        ? 'Demo mode active'
                        : 'Đang bật chế độ Demo'
                      : isEn
                        ? 'Standard production mode'
                        : 'Đang chạy chuẩn hệ thống'}
                  </span>
                </span>
              </div>

              {/* Master Controls Card */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Default demo surveyor email' : 'Email nhận việc chụp lại mặc định'}
                    </label>
                    <input
                      type="email"
                      value={demoTargetEmail}
                      onChange={(e) => setDemoTargetEmail(e.target.value)}
                      placeholder="demo@stm.dev"
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Change reason' : 'Lý do thay đổi'}
                    </label>
                    <input
                      type="text"
                      value={switchReason}
                      onChange={(e) => setSwitchReason(e.target.value)}
                      placeholder={isEn ? 'Enter reason for audit log' : 'Nhập lý do nếu cần lưu nhật ký'}
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isBulkTogglingDemo}
                    onClick={handleEnableDemoMode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isBulkTogglingDemo && <CircleNotch size={14} className="animate-spin" />}
                    <span>{isEn ? 'Enable all demo switches' : 'Bật toàn bộ chế độ Demo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBulkTogglingDemo}
                    onClick={handleDisableDemoMode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isBulkTogglingDemo && <CircleNotch size={14} className="animate-spin" />}
                    <span>{isEn ? 'Restore standard mode' : 'Khôi phục chuẩn hệ thống'}</span>
                  </button>
                </div>
              </div>

              {/* Granular Switches List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Individual rule switches' : 'Tùy chọn chi tiết từng quy tắc'}
                </h3>

                {isLoading && systemSwitches.length === 0 ? (
                  <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <CircleNotch size={16} className="animate-spin text-[#007b8b]" />
                    <span>{isEn ? 'Loading switches...' : 'Đang tải danh sách công tắc...'}</span>
                  </div>
                ) : systemSwitches.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
                    {isEn ? 'No system switches found from server.' : 'Chưa có công tắc nào từ máy chủ.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {systemSwitches.map((flag) => {
                      const meta = DEMO_SWITCH_LABELS[flag.key]
                      const title = meta ? (isEn ? meta.titleEn : meta.titleVi) : flag.name || flag.key
                      const desc = meta ? (isEn ? meta.descEn : meta.descVi) : flag.description || ''
                      const isRowLoading = togglingSwitchKey === flag.key || isBulkTogglingDemo

                      return (
                        <div
                          key={flag.key}
                          className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                            flag.isEnabled
                              ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/80 dark:border-amber-500/20'
                              : 'bg-gray-50/70 dark:bg-white/[0.02] border-gray-200/70 dark:border-white/10'
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                                {flag.key}
                              </span>
                            </div>
                            {desc && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={flag.isEnabled}
                            disabled={isRowLoading}
                            onClick={() => handleToggleSwitch(flag)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                              flag.isEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                flag.isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
