import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
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
  ArrowsClockwise,
  CircleNotch,
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
  PROVINCIAL: { vi: 'Đường tỉnh', en: 'Provincial road' },
  PROVINCIAL_ROAD: { vi: 'Đường tỉnh', en: 'Provincial road' },
  URBAN: { vi: 'Đường đô thị', en: 'Urban road' },
  URBAN_STREET: { vi: 'Đường đô thị', en: 'Urban street' },
  RURAL: { vi: 'Đường nông thôn', en: 'Rural road' },
  RURAL_LOCAL: { vi: 'Đường liên xã', en: 'Rural local' },
  TEMPORARY: { vi: 'Đường tạm', en: 'Temporary road' },
}

const ROUTE_NAME_LABELS: Record<string, { vi: string; en: string }> = {
  'Urban Corridors / Construction': {
    vi: 'Đường đô thị và công trường',
    en: 'Urban Corridors and Construction',
  },
  'Provincial Roads & Mountain Passes': {
    vi: 'Đường tỉnh và đèo núi',
    en: 'Provincial Roads and Mountain Passes',
  },
  'National Expressways & Highways': {
    vi: 'Đường cao tốc và quốc lộ',
    en: 'National Expressways and Highways',
  },
  'Temporary / Seasonal Speed Alerts': {
    vi: 'Cảnh báo tốc độ tạm thời',
    en: 'Temporary and Seasonal Speed Alerts',
  },
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

const DEFAULT_CONSENSUS_VALUES = {
  approvalThreshold: 2.0,
  rejectionThreshold: -2.0,
  minVotesRequired: 3,
  maxVotesLimit: 9,
  alphaSmoothingFactor: 0.1,
  weightCorrect: 1.0,
  penaltyFalse: 2.0,
  provisionalVoteWeight: 0.5,
  minSampleBaseline: 5,
  minReliabilityThreshold: 50,
  consecutiveErrorLimit: 3,
  suspensionCooldownDays: 7,
  provisionalMinReliabilityThreshold: 40,
  provisionalConsecutiveErrorLimit: 2,
  provisionalAutoBanEnabled: true,
}

function getCategoryDisplayName(
  rule: FreshnessRuleItem,
  categories: SignCategoryItem[],
  isEn: boolean
): string {
  if (isEn && rule.categoryNameEn) return rule.categoryNameEn
  if (!isEn && rule.categoryNameVi) return rule.categoryNameVi.replace(/\s*\/\s*/g, ' và ')
  if (rule.signCategoryId != null) {
    const matched = categories.find((c) => c.id === rule.signCategoryId)
    if (matched) {
      const name = isEn ? matched.nameEn || matched.nameVi : matched.nameVi
      return name.replace(/\s*\/\s*/g, ' và ')
    }
    return isEn ? `Category #${rule.signCategoryId}` : `Loại #${rule.signCategoryId}`
  }
  return isEn ? 'All categories' : 'Tất cả loại biển'
}

function getRouteDisplayName(item: RouteMatrixItem, isEn: boolean): string {
  if (item.name && ROUTE_NAME_LABELS[item.name]) {
    return isEn ? ROUTE_NAME_LABELS[item.name].en : ROUTE_NAME_LABELS[item.name].vi
  }
  const typeKey = (item.roadType || item.road_type || item.routeClass || item.route_class || '').toUpperCase()
  const mapped = ROAD_TYPE_LABELS[typeKey]
  if (mapped) return isEn ? mapped.en : mapped.vi
  if (item.name) return item.name.replace(/\s*\/\s*/g, ' và ')
  return typeKey || (isEn ? `Route #${item.id}` : `Tuyến đường #${item.id}`)
}

function formatDomainName(rawDomain: string | undefined | null): string {
  if (!rawDomain) return ''
  const trimmed = rawDomain.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

function getDataTypeName(type: string | undefined, isEn: boolean): string {
  const t = (type || '').toUpperCase()
  if (t === 'NUMBER') return isEn ? 'Number' : 'Số thập phân'
  if (t === 'INTEGER') return isEn ? 'Integer' : 'Số nguyên'
  if (t === 'BOOLEAN') return isEn ? 'Boolean' : 'Đúng sai'
  if (t === 'PERCENTAGE') return isEn ? 'Percentage' : 'Phần trăm'
  if (t === 'DURATION') return isEn ? 'Duration' : 'Thời gian'
  if (t === 'JSON') return isEn ? 'JSON' : 'Dữ liệu JSON'
  return isEn ? 'Text' : 'Chuỗi văn bản'
}

export interface ParamTreeNode {
  id: string
  label: string
  isFolder: boolean
  param?: SystemParameterItem
  children?: ParamTreeNode[]
}

interface ItemWithSegments {
  param: SystemParameterItem
  segments: string[]
}

function countLeaves(node: ParamTreeNode): number {
  if (!node.isFolder) return 1
  if (!node.children) return 0
  return node.children.reduce((acc, child) => acc + countLeaves(child), 0)
}

function buildParamTree(items: SystemParameterItem[], parentPath = ''): ParamTreeNode[] {
  if (!items || items.length === 0) return []

  let wrapped: ItemWithSegments[] = items.map((p) => ({
    param: p,
    segments: p.key.split('.'),
  }))

  // Strip redundant common root namespace segments when all items in this domain group share them
  // (e.g. all items in CONSENSUS share 'consensus', all items in AIOPS share 'ai', all in INGESTION share 'survey').
  // The domain header itself already represents the root container, keeping the domain at the root
  // and avoiding duplicate nesting like Aiops -> ai or Consensus -> consensus.
  if (wrapped.length > 0) {
    while (true) {
      const firstSeg = wrapped[0].segments[0]
      if (!firstSeg) break
      const allShareFirstSeg = wrapped.every(
        (item) => item.segments.length > 1 && item.segments[0].toLowerCase() === firstSeg.toLowerCase()
      )
      if (allShareFirstSeg) {
        wrapped = wrapped.map((item) => ({
          param: item.param,
          segments: item.segments.slice(1),
        }))
      } else {
        break
      }
    }
  }

  return buildSubTree(wrapped, parentPath)
}

function buildSubTree(items: ItemWithSegments[], parentPath: string): ParamTreeNode[] {
  const groupMap = new Map<string, ItemWithSegments[]>()

  for (const item of items) {
    const seg = item.segments[0]
    if (!seg) {
      if (!groupMap.has('__leaf__')) {
        groupMap.set('__leaf__', [])
      }
      groupMap.get('__leaf__')!.push(item)
      continue
    }
    if (!groupMap.has(seg)) {
      groupMap.set(seg, [])
    }
    groupMap.get(seg)!.push(item)
  }

  const nodes: ParamTreeNode[] = []

  if (groupMap.has('__leaf__')) {
    for (const item of groupMap.get('__leaf__')!) {
      nodes.push({
        id: item.param.key,
        label: item.param.key.split('.').pop() || item.param.key,
        isFolder: false,
        param: item.param,
      })
    }
    groupMap.delete('__leaf__')
  }

  for (const [segment, groupItems] of groupMap.entries()) {
    const currentPath = parentPath ? `${parentPath}.${segment}` : segment

    if (groupItems.length === 1) {
      const single = groupItems[0]
      const leafLabel = single.segments.join('.')
      nodes.push({
        id: single.param.key,
        label: leafLabel,
        isFolder: false,
        param: single.param,
      })
    } else {
      const childItems: ItemWithSegments[] = groupItems.map((gi) => ({
        param: gi.param,
        segments: gi.segments.slice(1),
      }))

      const children = buildSubTree(childItems, currentPath)

      nodes.push({
        id: currentPath,
        label: segment,
        isFolder: true,
        children,
      })
    }
  }

  return nodes.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    return a.label.localeCompare(b.label)
  })
}

function collectAllFolderKeys(groups: { domainKey: string; treeNodes: ParamTreeNode[] }[]): Set<string> {
  const set = new Set<string>()
  function traverse(nodes: ParamTreeNode[], domainKey: string) {
    for (const n of nodes) {
      if (n.isFolder) {
        set.add(`${domainKey}/${n.id}`)
        if (n.children) traverse(n.children, domainKey)
      }
    }
  }
  for (const g of groups) {
    set.add(g.domainKey)
    traverse(g.treeNodes, g.domainKey)
  }
  return set
}

function ParamTreeItem({
  node,
  isLast,
  domainKey,
  expandedKeys,
  onToggle,
  onSelectParam,
  isEn,
}: {
  node: ParamTreeNode
  isLast: boolean
  domainKey: string
  expandedKeys: Set<string>
  onToggle: (key: string) => void
  onSelectParam: (param: SystemParameterItem) => void
  isEn: boolean
}) {
  const globalKey = `${domainKey}/${node.id}`
  const isExpanded = expandedKeys.has(globalKey)

  if (node.isFolder) {
    const leafCount = countLeaves(node)
    return (
      <div className="relative">
        {/* Sibling vertical trunk line */}
        <span
          className={`absolute left-0 w-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none ${isLast ? 'top-0 h-[14px]' : 'top-0 bottom-0'
            }`}
        />

        {/* Horizontal branch line from sibling trunk to this folder toggle */}
        <span className="absolute left-0 top-[14px] w-[14px] h-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none" />

        {/* Folder row */}
        <div
          onClick={() => onToggle(globalKey)}
          className="relative ml-[14px] flex items-center justify-between py-1 pl-0 pr-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
        >
          {/* Drop line from folder toggle button down to children */}
          {isExpanded && (
            <span className="absolute left-[8px] top-[22px] bottom-0 w-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none" />
          )}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggle(globalKey)
              }}
              className="w-4 h-4 shrink-0 flex items-center justify-center border border-gray-400 dark:border-white/30 rounded-xs bg-white dark:bg-[#061115] text-gray-700 dark:text-gray-200 font-mono text-[10px] font-bold select-none cursor-pointer hover:border-gray-600 transition-colors"
              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? '−' : '+'}
            </button>
            <span className="text-left font-mono font-bold text-xs text-gray-800 dark:text-gray-200 group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors truncate">
              {node.label}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
              {leafCount} {isEn ? 'parameters' : 'tham số'}
            </span>
          </div>
        </div>

        {/* Children of this folder */}
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="relative space-y-0.5 mt-0 mb-0.5" style={{ marginLeft: '22px' }}>
            {node.children.map((child, idx) => (
              <ParamTreeItem
                key={child.id}
                node={child}
                isLast={idx === node.children!.length - 1}
                domainKey={domainKey}
                expandedKeys={expandedKeys}
                onToggle={onToggle}
                onSelectParam={onSelectParam}
                isEn={isEn}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf Node
  const param = node.param!
  return (
    <div className="relative">
      {/* Sibling vertical trunk line */}
      <span
        className={`absolute left-0 w-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none ${isLast ? 'top-0 h-[14px]' : 'top-0 bottom-0'
          }`}
      />

      {/* Horizontal branch line from sibling trunk to this leaf */}
      <span className="absolute left-0 top-[14px] w-[14px] h-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none" />

      {/* Leaf content row: Click anywhere on line opens modal */}
      <div
        onClick={() => onSelectParam(param)}
        className="relative ml-[14px] flex items-center justify-between py-1 pl-1 pr-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          {/* Config key */}
          <span
            className="font-mono text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] group-hover:underline"
            title={param.key}
          >
            {node.label}
          </span>

          {/* Value badge: placed right after config name */}
          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 font-mono text-[11px] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/10 font-medium">
            {typeof param.value === 'object' ? JSON.stringify(param.value) : String(param.value)}
          </span>
        </div>

        {/* Description: placed on the far right */}
        {param.description && (
          <span
            className="text-[11px] text-gray-400 dark:text-gray-500 truncate text-right ml-4 min-w-0"
            title={param.description}
          >
            {param.description}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SystemSettingsPage() {
  const { i18n } = useTranslation('ops')
  const toast = useToast()
  const isEn = i18n.language?.startsWith('en')

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const validTabs = ['consensus', 'freshness', 'routes', 'parameters', 'demo_mode'] as const
  type TabKey = (typeof validTabs)[number]

  const activeTab: TabKey =
    tabFromUrl && (validTabs as readonly string[]).includes(tabFromUrl)
      ? (tabFromUrl as TabKey)
      : 'consensus'

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', tab)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
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
  const [provisionalMinReliabilityThreshold, setProvisionalMinReliabilityThreshold] = useState(40)
  const [provisionalConsecutiveErrorLimit, setProvisionalConsecutiveErrorLimit] = useState(2)
  const [provisionalAutoBanEnabled, setProvisionalAutoBanEnabled] = useState(true)
  const [consensusReason, setConsensusReason] = useState('')
  const [isSavingConsensus, setIsSavingConsensus] = useState(false)
  const [consensusLoaded, setConsensusLoaded] = useState(false)
  const [consensusError, setConsensusError] = useState<string | null>(null)

  // ── Tab 2: Freshness Rules & Route Matrix ──
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [freshnessRules, setFreshnessRules] = useState<FreshnessRuleItem[]>([])
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [editingRule, setEditingRule] = useState<FreshnessRuleItem | null>(null)
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
  const [paramSearch, setParamSearch] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [hasInitializedExpand, setHasInitializedExpand] = useState(false)
  const [isParamModalOpen, setIsParamModalOpen] = useState(false)
  const [editingParam, setEditingParam] = useState<SystemParameterItem | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editReason, setEditReason] = useState('')
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
        if (c.provisionalMinReliabilityThreshold !== undefined) setProvisionalMinReliabilityThreshold(Number(c.provisionalMinReliabilityThreshold))
        if (c.provisionalConsecutiveErrorLimit !== undefined) setProvisionalConsecutiveErrorLimit(Number(c.provisionalConsecutiveErrorLimit))
        if (c.provisionalAutoBanEnabled !== undefined) setProvisionalAutoBanEnabled(Boolean(c.provisionalAutoBanEnabled))
        setConsensusLoaded(true)
        setConsensusError(null)
      } else if (consensusRes.status === 'rejected') {
        const err: any = consensusRes.reason
        const msg = err?.message || (typeof err === 'string' ? err : '')
        setConsensusError(msg || (isEn ? 'Could not load consensus config from server' : 'Không thể tải cấu hình độ đồng thuận từ máy chủ'))
        setConsensusLoaded(false)
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
        provisionalMinReliabilityThreshold,
        provisionalConsecutiveErrorLimit,
        provisionalAutoBanEnabled,
        reason: consensusReason.trim() || undefined,
      })
      setConsensusReason('')
      toast.success(isEn ? 'Consensus configuration saved.' : 'Đã lưu cấu hình độ đồng thuận.')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save consensus settings.' : 'Không thể lưu cấu hình độ đồng thuận.'))
    } finally {
      setIsSavingConsensus(false)
    }
  }

  function handleResetConsensusDefaults() {
    setApprovalThreshold(DEFAULT_CONSENSUS_VALUES.approvalThreshold)
    setRejectionThreshold(DEFAULT_CONSENSUS_VALUES.rejectionThreshold)
    setMinVotesRequired(DEFAULT_CONSENSUS_VALUES.minVotesRequired)
    setMaxVotesLimit(DEFAULT_CONSENSUS_VALUES.maxVotesLimit)
    setAlphaSmoothingFactor(DEFAULT_CONSENSUS_VALUES.alphaSmoothingFactor)
    setWeightCorrect(DEFAULT_CONSENSUS_VALUES.weightCorrect)
    setPenaltyFalse(DEFAULT_CONSENSUS_VALUES.penaltyFalse)
    setProvisionalVoteWeight(DEFAULT_CONSENSUS_VALUES.provisionalVoteWeight)
    setMinSampleBaseline(DEFAULT_CONSENSUS_VALUES.minSampleBaseline)
    setMinReliabilityThreshold(DEFAULT_CONSENSUS_VALUES.minReliabilityThreshold)
    setConsecutiveErrorLimit(DEFAULT_CONSENSUS_VALUES.consecutiveErrorLimit)
    setSuspensionCooldownDays(DEFAULT_CONSENSUS_VALUES.suspensionCooldownDays)
    setProvisionalMinReliabilityThreshold(DEFAULT_CONSENSUS_VALUES.provisionalMinReliabilityThreshold)
    setProvisionalConsecutiveErrorLimit(DEFAULT_CONSENSUS_VALUES.provisionalConsecutiveErrorLimit)
    setProvisionalAutoBanEnabled(DEFAULT_CONSENSUS_VALUES.provisionalAutoBanEnabled)
    toast.info(isEn ? 'Loaded recommended baseline values' : 'Đã nạp bộ giá trị chuẩn khuyến nghị')
  }

  const reloadConsensus = useCallback(async () => {
    setIsLoading(true)
    setConsensusError(null)
    try {
      const c = await systemService.getConsensusConfig()
      if (c) {
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
        if (c.provisionalMinReliabilityThreshold !== undefined) setProvisionalMinReliabilityThreshold(Number(c.provisionalMinReliabilityThreshold))
        if (c.provisionalConsecutiveErrorLimit !== undefined) setProvisionalConsecutiveErrorLimit(Number(c.provisionalConsecutiveErrorLimit))
        if (c.provisionalAutoBanEnabled !== undefined) setProvisionalAutoBanEnabled(Boolean(c.provisionalAutoBanEnabled))
        setConsensusLoaded(true)
        setConsensusError(null)
      }
    } catch (err: any) {
      setConsensusError(err?.message || (isEn ? 'Could not load consensus config from server' : 'Không thể tải cấu hình độ đồng thuận từ máy chủ'))
      setConsensusLoaded(false)
    } finally {
      setIsLoading(false)
    }
  }, [isEn])

  // ── Freshness Rule Helpers ──
  function openEditRuleForm(rule: FreshnessRuleItem) {
    setEditingRuleId(rule.id)
    setEditingRule(rule)
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
    if (editingRuleId == null) return
    setIsSavingRule(true)
    try {
      await systemService.updateFreshnessRule(editingRuleId, {
        freshnessPeriodDays: rulePeriodDays,
        defaultPriority: rulePriority,
        maxProximityMeters: ruleProximityMeters,
        dailySubmissionLimit: ruleDailyLimit,
        reason: ruleReason.trim() || undefined,
      })
      toast.success(isEn ? 'Sign category lifetime updated.' : 'Đã cập nhật thời hạn loại biển.')
      setIsRuleFormOpen(false)
      setEditingRuleId(null)
      setEditingRule(null)
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save sign category lifetime.' : 'Không thể lưu thời hạn loại biển.'))
    } finally {
      setIsSavingRule(false)
    }
  }

  async function handleToggleRuleActive(rule: FreshnessRuleItem) {
    setTogglingRuleId(rule.id)
    try {
      if (rule.isActive) {
        await systemService.deleteFreshnessRule(rule.id)
        toast.success(isEn ? 'Category turned off.' : 'Đã tắt loại biển báo.')
      } else {
        await systemService.updateFreshnessRule(rule.id, { isActive: true })
        toast.success(isEn ? 'Category activated.' : 'Đã bật loại biển báo.')
      }
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not update status.' : 'Không thể thay đổi trạng thái.'))
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
      toast.success(isEn ? 'Road types saved.' : 'Đã lưu cấu hình loại đường.')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save road types.' : 'Không thể lưu cấu hình loại đường.'))
    } finally {
      setIsSavingRoutes(false)
    }
  }

  // ── System Parameter Tree & Modal Helpers ──
  const domainGroups = useMemo(() => {
    const query = paramSearch.trim().toLowerCase()
    const map = new Map<
      string,
      { domainKey: string; domainName: string; items: SystemParameterItem[]; treeNodes: ParamTreeNode[] }
    >()

    for (const p of rawParameters) {
      const domainKey = (
        p.domain ||
        (p.key.includes('.') ? p.key.split('.')[0].toUpperCase() : 'INFRASTRUCTURE')
      ).toUpperCase()

      const domainName = formatDomainName(domainKey)

      if (query) {
        const matchesKey = p.key.toLowerCase().includes(query)
        const matchesDesc = (p.description || '').toLowerCase().includes(query)
        const matchesDomain = domainKey.toLowerCase().includes(query) || domainName.toLowerCase().includes(query)
        const matchesVal = String(p.value || '').toLowerCase().includes(query)
        if (!matchesKey && !matchesDesc && !matchesDomain && !matchesVal) {
          continue
        }
      }

      if (!map.has(domainKey)) {
        map.set(domainKey, { domainKey, domainName, items: [], treeNodes: [] })
      }
      map.get(domainKey)!.items.push(p)
    }

    const groups = Array.from(map.values()).sort((a, b) => a.domainName.localeCompare(b.domainName))
    for (const g of groups) {
      g.treeNodes = buildParamTree(g.items)
    }
    return groups
  }, [rawParameters, paramSearch])

  useEffect(() => {
    if (!hasInitializedExpand && domainGroups.length > 0) {
      setExpandedKeys(collectAllFolderKeys(domainGroups))
      setHasInitializedExpand(true)
    }
  }, [domainGroups, hasInitializedExpand])

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const expandAllKeys = () => {
    setExpandedKeys(collectAllFolderKeys(domainGroups))
  }

  const collapseAllKeys = () => {
    setExpandedKeys(new Set())
  }

  function handleOpenUpdateModal(item: SystemParameterItem) {
    setEditingParam(item)
    setEditValue(typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? ''))
    setEditDesc(item.description || '')
    setEditReason('')
    setIsParamModalOpen(true)
  }

  function handleCloseModal() {
    setIsParamModalOpen(false)
    setEditingParam(null)
    setEditReason('')
  }

  useEffect(() => {
    if (!isParamModalOpen && !isRuleFormOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isParamModalOpen) handleCloseModal()
        if (isRuleFormOpen) setIsRuleFormOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isParamModalOpen, isRuleFormOpen])

  const initialParamValStr = editingParam
    ? typeof editingParam.value === 'object'
      ? JSON.stringify(editingParam.value)
      : String(editingParam.value ?? '')
    : ''
  const initialParamDescStr = editingParam?.description || ''

  const isParamValueChanged = editValue !== initialParamValStr
  const isParamDescChanged = editDesc !== initialParamDescStr
  const hasParamChanges = isParamValueChanged || isParamDescChanged

  // Compute validation range and allowed values for the active parameter in update modal
  const modalRules = (editingParam?.validationRules || (editingParam as any)?.validation_rules || {}) as Record<string, any>
  let modalRangeMin = typeof modalRules.min === 'number' ? modalRules.min : undefined
  let modalRangeMax = typeof modalRules.max === 'number' ? modalRules.max : undefined
  let modalRangeStep = typeof modalRules.step === 'number' ? modalRules.step : undefined

  if ((modalRangeMin === undefined || modalRangeMax === undefined) && editingParam?.range) {
    const rangeMatch = editingParam.range.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/)
    if (rangeMatch) {
      if (modalRangeMin === undefined) modalRangeMin = parseFloat(rangeMatch[1])
      if (modalRangeMax === undefined) modalRangeMax = parseFloat(rangeMatch[2])
    }
  }

  const isModalParamInteger = editingParam?.dataType === 'INTEGER'
  if (modalRangeMin !== undefined && modalRangeMax !== undefined && modalRangeStep === undefined) {
    modalRangeStep = isModalParamInteger ? 1 : (modalRangeMax - modalRangeMin <= 2 ? 0.05 : (modalRangeMax - modalRangeMin <= 10 ? 0.1 : 1))
  }

  const rawModalAllowed = modalRules.allowedValues || modalRules.allowed_values
  const modalAllowedValues: string[] | undefined =
    Array.isArray(rawModalAllowed) && rawModalAllowed.length > 0 ? rawModalAllowed.map(String) : undefined

  const isModalBoolean = editingParam?.dataType === 'BOOLEAN' || editValue === 'true' || editValue === 'false'
  const hasModalSlider = !isModalBoolean && modalRangeMin !== undefined && modalRangeMax !== undefined && modalRangeMin < modalRangeMax
  const hasModalDropdown = !isModalBoolean && !hasModalSlider && modalAllowedValues && modalAllowedValues.length > 0

  function handleResetModal() {
    if (!hasParamChanges) return
    setEditValue(initialParamValStr)
    setEditDesc(initialParamDescStr)
    setEditReason('')
  }

  const clampAndSnapModalValue = (raw: string) => {
    const num = parseFloat(raw)
    if (!isNaN(num) && modalRangeMin !== undefined && modalRangeMax !== undefined) {
      let clamped = Math.min(Math.max(num, modalRangeMin), modalRangeMax)
      if (isModalParamInteger) {
        clamped = Math.round(clamped)
        return clamped.toString()
      }
      if (modalRangeStep && modalRangeStep > 0) {
        const stepsCount = Math.round((clamped - modalRangeMin) / modalRangeStep)
        clamped = modalRangeMin + stepsCount * modalRangeStep
        clamped = Math.min(Math.max(clamped, modalRangeMin), modalRangeMax)
      }
      const stepDecimals = modalRangeStep?.toString().split('.')[1]?.length || 0
      return stepDecimals > 0 ? clamped.toFixed(stepDecimals) : clamped.toString()
    }
    return raw
  }

  async function handleUpdateParameter(e: React.FormEvent) {
    e.preventDefault()
    if (!editingParam || !hasParamChanges) return
    let valToSave = editValue.trim()
    if (hasModalSlider) {
      valToSave = clampAndSnapModalValue(valToSave)
    }
    if (!valToSave) {
      toast.warning(isEn ? 'Please enter a parameter value.' : 'Vui lòng nhập giá trị tham số.')
      return
    }
    setIsSavingParam(true)
    try {
      await systemService.upsertParameter(editingParam.key, {
        value: valToSave,
        description: isParamDescChanged && editDesc.trim() ? editDesc.trim() : undefined,
        changeReason: editReason.trim() || (isEn ? 'Update system parameter' : 'Cập nhật tham số hệ thống'),
      })
      toast.success(isEn ? `Parameter ${editingParam.key} updated.` : `Đã cập nhật tham số ${editingParam.key}.`)
      setIsParamModalOpen(false)
      setEditingParam(null)
      loadSettings()
    } catch (err: any) {
      toast.error(err?.message || (isEn ? 'Could not save parameter.' : 'Không thể lưu tham số.'))
    } finally {
      setIsSavingParam(false)
    }
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

  return (
    <div className="p-4 sm:p-6 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-5 w-full">
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

      {/* Sleek Segmented Tab Navigation Bar - Compact, Icon-Free, Never Wraps */}
      <div className="p-1 bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 rounded-xl inline-flex items-center gap-1 shadow-2xs max-w-full overflow-x-auto flex-nowrap scrollbar-none">
        {/* Tab 1: Consensus */}
        <button
          type="button"
          onClick={() => setActiveTab('consensus')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'consensus'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>{isEn ? 'Consensus rules' : 'Độ đồng thuận'}</span>
        </button>

        {/* Tab 2: Sign Categories (Thời hạn theo loại biển) */}
        <button
          type="button"
          onClick={() => setActiveTab('freshness')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'freshness'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>{isEn ? 'Sign category lifetime' : 'Thời hạn theo loại biển'}</span>
        </button>

        {/* Tab 3: Road Types (Thời hạn theo loại đường) */}
        <button
          type="button"
          onClick={() => setActiveTab('routes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'routes'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>{isEn ? 'Road type lifetime' : 'Thời hạn theo loại đường'}</span>
        </button>

        {/* Tab 4: System parameters */}
        <button
          type="button"
          onClick={() => setActiveTab('parameters')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'parameters'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>{isEn ? 'System parameters' : 'Tham số hệ thống'}</span>
        </button>

        {/* Tab 4: Demo mode */}
        <button
          type="button"
          onClick={() => setActiveTab('demo_mode')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'demo_mode'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>{isEn ? 'Demo mode' : 'Chế độ demo'}</span>
          {isAnyDemoActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
        {/* TAB 1: Consensus Configuration */}
        {activeTab === 'consensus' && (
          isLoading && !consensusLoaded && !consensusError ? (
            <div className="space-y-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-5 w-52 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="h-3 w-96 bg-gray-100 dark:bg-white/5 rounded-lg" />
              </div>

              <div className="space-y-3">
                <div className="h-3.5 w-48 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2.5 border border-gray-200/60 dark:border-white/5">
                      <div className="h-3.5 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                      <div className="h-9 w-full bg-gray-200/60 dark:bg-white/10 rounded-lg" />
                      <div className="h-2.5 w-48 bg-gray-100 dark:bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-3.5 w-56 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                      <div className="h-3 w-36 bg-gray-200 dark:bg-white/10 rounded" />
                      <div className="h-9 w-full bg-gray-200/60 dark:bg-white/10 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !consensusLoaded && consensusError ? (
            <div className="p-8 text-center space-y-3 max-w-md mx-auto my-12 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
              <div className="w-10 h-10 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-base">
                !
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {isEn ? 'Failed to load consensus configuration' : 'Không thể tải cấu hình độ đồng thuận'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {consensusError}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={reloadConsensus}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white transition-colors cursor-pointer"
                >
                  {isEn ? 'Retry' : 'Thử lại'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetConsensusDefaults()
                    setConsensusLoaded(true)
                    setConsensusError(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {isEn ? 'Use recommended defaults' : 'Dùng giá trị chuẩn'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveConsensus} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {isEn ? 'Consensus configuration' : 'Cấu hình độ đồng thuận'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isEn
                      ? 'Adjust vote thresholds, reviewer weights, and reliability penalties.'
                      : 'Cấu hình ngưỡng điểm duyệt, số lượng phiếu đánh giá và cơ chế tính điểm uy tín cho reviewer.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetConsensusDefaults}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  <span>{isEn ? 'Standard defaults' : 'Giá trị chuẩn khuyến nghị'}</span>
                </button>
              </div>

              {/* Group 1: Approval & Vote Quorums */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Approval and vote thresholds' : 'Ngưỡng điểm duyệt và số lượng phiếu'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Approval score threshold' : 'Điểm duyệt tối thiểu'}
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
                        : 'Tổng điểm trọng số cần đạt để tự động duyệt biển báo lên bản đồ.'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Rejection score threshold' : 'Điểm từ chối tối đa'}
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
                        : 'Tổng điểm âm để tự động từ chối biển báo sai hoặc không hợp lệ.'}
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
                        : 'Số lượt đánh giá tối thiểu trước khi hệ thống bắt đầu chốt kết quả.'}
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
                        : 'Tự động chuyển lên admin xử lý nếu đạt giới hạn phiếu này mà chưa có kết luận.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 2: Reviewer Weights & Discipline */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Reviewer weights and reliability' : 'Trọng số và độ uy tín reviewer'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Correct vote reward weight' : 'Điểm thưởng khi đánh giá đúng'}
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
                      {isEn ? 'False vote penalty' : 'Điểm trừ khi đánh giá sai'}
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
                      {isEn ? 'Provisional vote weight' : 'Trọng số cho reviewer mới'}
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
                      {isEn ? 'Min sample baseline' : 'Số lượt đánh giá thử việc'}
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
                      {isEn ? 'Consecutive error limit' : 'Giới hạn đánh giá sai liên tiếp'}
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
                      {isEn ? 'Suspension days' : 'Thời gian tạm khóa tính theo ngày'}
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

              {/* Group 3: Provisional Reviewer Autoban Governance */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isEn ? 'Provisional account rules' : 'Quy định tài khoản mới'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Toggle: Tự động cấm tài khoản mới */}
                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2 border border-gray-200/60 dark:border-white/5 flex flex-col justify-between">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300">
                        {isEn ? 'Automatic ban for new accounts' : 'Tự động cấm tài khoản mới'}
                      </label>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isEn ? 'Automatically ban new accounts when thresholds are exceeded.' : 'Tự động cấm tài khoản mới khi vi phạm ngưỡng uy tín hoặc chuỗi sai.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setProvisionalAutoBanEnabled(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${provisionalAutoBanEnabled
                          ? 'bg-[#007b8b] text-white'
                          : 'bg-white dark:bg-[#061115] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50'
                          }`}
                      >
                        {isEn ? 'On' : 'Bật'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProvisionalAutoBanEnabled(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${!provisionalAutoBanEnabled
                          ? 'bg-red-600 text-white'
                          : 'bg-white dark:bg-[#061115] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50'
                          }`}
                      >
                        {isEn ? 'Off' : 'Tắt'}
                      </button>
                    </div>
                  </div>

                  {/* Input: Ngưỡng uy tín tối thiểu tài khoản mới */}
                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Minimum reliability for new accounts' : 'Ngưỡng uy tín tối thiểu tài khoản mới'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={provisionalMinReliabilityThreshold}
                        onChange={(e) => setProvisionalMinReliabilityThreshold(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                      />
                      <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Score threshold below which new accounts are banned.' : 'Tài khoản mới có điểm uy tín dưới mức này sẽ bị cấm.'}
                    </p>
                  </div>

                  {/* Input: Giới hạn đánh giá sai liên tiếp */}
                  <div className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1.5 border border-gray-200/60 dark:border-white/5">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Consecutive wrong votes limit' : 'Giới hạn đánh giá sai liên tiếp'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={provisionalConsecutiveErrorLimit}
                      onChange={(e) => setProvisionalConsecutiveErrorLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Number of wrong votes in a row before automatic ban.' : 'Số lần đánh giá sai liên tiếp dẫn đến tự động cấm.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  value={consensusReason}
                  onChange={(e) => setConsensusReason(e.target.value)}
                  placeholder={isEn ? 'Reason for update' : 'Lý do thay đổi'}
                  className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                />
                <button
                  type="submit"
                  disabled={isSavingConsensus}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSavingConsensus && (
                    <CircleNotch size={16} className="animate-spin" />
                  )}
                  <span>{isSavingConsensus ? (isEn ? 'Updating...' : 'Đang cập nhật...') : isEn ? 'Update consensus rules' : 'Cập nhật cấu hình độ đồng thuận'}</span>
                </button>
              </div>
            </form>
          ))}

        {/* TAB 2: Freshness Rules */}
        {activeTab === 'freshness' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isEn ? 'Sign category lifetime' : 'Thời hạn theo loại biển'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isEn
                  ? 'Configure recapture cycle, priority, distance, and daily limit per sign category.'
                  : 'Quy định thời gian chụp lại, mức ưu tiên, bán kính vị trí và giới hạn nộp mỗi ngày cho từng loại biển báo.'}
              </p>
            </div>

            {/* Freshness Rules Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-3.5 py-2.5">{isEn ? 'Sign category' : 'Loại biển báo'}</th>
                    <th className="px-3.5 py-2.5">{isEn ? 'Recapture cycle' : 'Hạn chụp lại'}</th>
                    <th className="px-3.5 py-2.5">{isEn ? 'Priority' : 'Mức ưu tiên'}</th>
                    <th className="px-3.5 py-2.5">{isEn ? 'Radius' : 'Bán kính'}</th>
                    <th className="px-3.5 py-2.5">{isEn ? 'Daily limit' : 'Giới hạn ngày'}</th>
                    <th className="px-3.5 py-2.5 text-center">{isEn ? 'Status' : 'Trạng thái'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {freshnessRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        {isEn ? 'No sign categories found.' : 'Chưa có cấu hình loại biển báo nào.'}
                      </td>
                    </tr>
                  ) : (
                    freshnessRules.map((rule) => {
                      const pri = PRIORITY_LABELS[String(rule.defaultPriority).toUpperCase()] || PRIORITY_LABELS.MEDIUM
                      return (
                        <tr
                          key={rule.id}
                          onClick={() => openEditRuleForm(rule)}
                          className="hover:bg-teal-50/50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                          title={isEn ? 'Click to edit' : 'Bấm để chỉnh sửa'}
                        >
                          <td className="px-3.5 py-3 font-semibold text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de]">
                            {getCategoryDisplayName(rule, categories, isEn)}
                          </td>
                          <td className="px-3.5 py-3 font-mono font-medium">
                            {rule.freshnessPeriodDays} {isEn ? 'days' : 'ngày'}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${pri.className}`}>
                              {isEn ? pri.en : pri.vi}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 font-mono">{rule.maxProximityMeters}m</td>
                          <td className="px-3.5 py-3 font-mono">{rule.dailySubmissionLimit}</td>
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={togglingRuleId === rule.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleRuleActive(rule)
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 ${rule.isActive
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                                }`}
                              title={rule.isActive ? (isEn ? 'Click to disable' : 'Bấm để tắt') : (isEn ? 'Click to enable' : 'Bấm để bật')}
                            >
                              {rule.isActive ? (isEn ? 'Active' : 'Đang bật') : (isEn ? 'Inactive' : 'Đã tắt')}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Route Matrix */}
        {activeTab === 'routes' && (
          <form onSubmit={handleSaveRoutes} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? 'Road type lifetime' : 'Thời hạn theo loại đường'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isEn
                    ? 'Configure sign lifetime, recapture trigger threshold, and GPS buffer applied specifically to each road type.'
                    : 'Quy định thời hạn hiệu lực của biển báo, số ngày kích hoạt yêu cầu chụp lại và vùng đệm áp dụng cho từng loại đường.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-white/5 uppercase text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">{isEn ? 'Road' : 'Tên tuyến đường'}</th>
                    <th className="px-4 py-3 text-center">{isEn ? 'Type code' : 'Mã loại'}</th>
                    <th className="px-4 py-3 text-center">{isEn ? 'Lifetime' : 'Thời hạn hiệu lực'}</th>
                    <th className="px-4 py-3 text-center">{isEn ? 'Recapture trigger' : 'Hạn chụp lại'}</th>
                    <th className="px-4 py-3 text-center">{isEn ? 'Buffer' : 'Khoảng cách'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {routeMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center font-sans text-gray-400">
                        {isEn ? 'No road types found.' : 'Chưa có dữ liệu loại đường từ máy chủ.'}
                      </td>
                    </tr>
                  ) : (
                    routeMatrix.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-sans font-bold text-gray-900 dark:text-white">
                          {getRouteDisplayName(item, isEn)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.roadType ?? item.road_type ?? ''}
                            onChange={(e) => handleRouteFieldChange(item.id, 'roadType', e.target.value)}
                            className="w-32 px-2.5 py-1.5 text-center uppercase font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="2000"
                            value={item.defaultLifetimeDays ?? item.default_lifetime_days ?? 180}
                            onChange={(e) =>
                              handleRouteFieldChange(item.id, 'defaultLifetimeDays', Number(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 text-center font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
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
                            className="w-24 px-2.5 py-1.5 text-center font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={item.spatialBufferMeters ?? item.spatial_buffer_meters ?? 15}
                            onChange={(e) =>
                              handleRouteFieldChange(item.id, 'spatialBufferMeters', Number(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 text-center font-mono font-bold bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {routeMatrix.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  value={routeReason}
                  onChange={(e) => setRouteReason(e.target.value)}
                  placeholder={isEn ? 'Reason for update' : 'Lý do thay đổi'}
                  className="flex-1 px-3.5 py-2 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                />
                <button
                  type="submit"
                  disabled={isSavingRoutes}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSavingRoutes && (
                    <CircleNotch size={15} className="animate-spin" />
                  )}
                  <span>{isSavingRoutes ? (isEn ? 'Saving...' : 'Đang lưu...') : isEn ? 'Save road types' : 'Lưu cấu hình loại đường'}</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* TAB 3: Global System Parameters */}
        {activeTab === 'parameters' && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? 'System parameters' : 'Tham số hệ thống'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isEn
                    ? 'Global configuration parameters grouped by domain'
                    : 'Danh sách tham số vận hành phân nhóm theo domain'}
                </p>
              </div>

              <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
                <button
                  type="button"
                  onClick={expandAllKeys}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  {isEn ? 'Expand all' : 'Mở rộng tất cả'}
                </button>
                <button
                  type="button"
                  onClick={collapseAllKeys}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  {isEn ? 'Collapse all' : 'Thu gọn tất cả'}
                </button>

                {/* Thanh tìm kiếm đặt ngay sau 2 nút mở rộng và thu gọn */}
                <div className="relative flex items-center min-w-[220px] sm:w-64">
                  <input
                    type="text"
                    placeholder={isEn ? 'Search parameters...' : 'Tìm kiếm tham số...'}
                    value={paramSearch}
                    onChange={(e) => setParamSearch(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b] transition-colors"
                  />
                  {paramSearch && (
                    <button
                      type="button"
                      onClick={() => setParamSearch('')}
                      className="absolute right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                      aria-label={isEn ? 'Clear' : 'Xóa'}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tree View */}
            <div className="bg-white dark:bg-[#061115] rounded-xl border border-gray-200 dark:border-white/10 p-4 font-sans select-none">
              {domainGroups.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  {isEn ? 'No parameters found.' : 'Không tìm thấy tham số nào.'}
                </div>
              ) : (
                <div className="relative pl-1">
                  {domainGroups.map((group, groupIdx) => {
                    const isFirstGroup = groupIdx === 0
                    const isLastGroup = groupIdx === domainGroups.length - 1
                    const isExpanded = expandedKeys.has(group.domainKey)

                    return (
                      <div key={group.domainKey} className="relative">
                        {/* Vertical trunk line connecting domain to domain */}
                        <span
                          className={`absolute left-[7px] w-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none ${isFirstGroup && isLastGroup
                            ? 'hidden'
                            : isFirstGroup
                              ? 'top-[14px] bottom-0'
                              : isLastGroup
                                ? 'top-0 h-[14px]'
                                : 'top-0 bottom-0'
                            }`}
                        />

                        {/* Horizontal branch line from trunk to domain toggle */}
                        <span className="absolute left-[7px] top-[14px] w-[13px] h-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none" />

                        {/* Domain Header Row */}
                        <div
                          onClick={() => toggleKey(group.domainKey)}
                          className="relative ml-[20px] flex items-center justify-between py-1 pl-0 pr-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                          {/* Drop line from domain toggle button down to children */}
                          {isExpanded && (
                            <span className="absolute left-[8px] top-[22px] bottom-0 w-px bg-gray-300 dark:bg-white/20 z-10 pointer-events-none" />
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleKey(group.domainKey)
                              }}
                              className="w-4 h-4 shrink-0 flex items-center justify-center border border-gray-400 dark:border-white/30 rounded-xs bg-white dark:bg-[#061115] text-gray-700 dark:text-gray-200 font-mono text-[10px] font-bold select-none cursor-pointer hover:border-gray-600 transition-colors"
                              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                            >
                              {isExpanded ? '−' : '+'}
                            </button>
                            <span className="text-left font-semibold text-xs text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors truncate">
                              {group.domainName}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                              {group.items.length} {isEn ? 'parameters' : 'tham số'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded child parameters and sub-folders */}
                        {isExpanded && group.treeNodes && group.treeNodes.length > 0 && (
                          <div className="relative space-y-0.5 mt-0 mb-0.5" style={{ marginLeft: '28px' }}>
                            {group.treeNodes.map((child, idx) => (
                              <ParamTreeItem
                                key={child.id}
                                node={child}
                                isLast={idx === group.treeNodes.length - 1}
                                domainKey={group.domainKey}
                                expandedKeys={expandedKeys}
                                onToggle={toggleKey}
                                onSelectParam={handleOpenUpdateModal}
                                isEn={isEn}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Dynamic Demo Switchboard */}
        {activeTab === 'demo_mode' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {isEn ? 'Demo mode control panel' : 'Bảng điều khiển chế độ demo'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isEn
                    ? 'Turn on presentation shortcuts quickly or restore standard production rules.'
                    : 'Kích hoạt nhanh các tùy chọn rút gọn khi demo thuyết trình hoặc khôi phục quy tắc vận hành chuẩn.'}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isAnyDemoActive
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isAnyDemoActive ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                />
                <span>
                  {isAnyDemoActive
                    ? isEn
                      ? 'Demo mode active'
                      : 'Đang bật chế độ demo'
                    : isEn
                      ? 'Standard production mode'
                      : 'Đang chạy chế độ tiêu chuẩn'}
                </span>
              </span>
            </div>

            {/* Master Controls Card */}
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    {isEn ? 'Default demo surveyor email' : 'Email nhận việc chụp lại khi demo'}
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
                    placeholder={isEn ? 'Reason for update' : 'Lý do thay đổi'}
                    className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isBulkTogglingDemo}
                  onClick={handleEnableDemoMode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isBulkTogglingDemo && <CircleNotch size={14} className="animate-spin" />}
                  <span>{isEn ? 'Enable all demo switches' : 'Bật toàn bộ tính năng demo'}</span>
                </button>

                <button
                  type="button"
                  disabled={isBulkTogglingDemo}
                  onClick={handleDisableDemoMode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isBulkTogglingDemo && <CircleNotch size={14} className="animate-spin" />}
                  <span>{isEn ? 'Restore standard mode' : 'Khôi phục chế độ tiêu chuẩn'}</span>
                </button>
              </div>
            </div>

            {/* Granular Switches List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {isEn ? 'Individual demo features' : 'Tùy chọn chi tiết từng tính năng demo'}
              </h3>

              {isLoading && systemSwitches.length === 0 ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <CircleNotch size={16} className="animate-spin text-[#007b8b]" />
                  <span>{isEn ? 'Loading switches...' : 'Đang tải danh sách tính năng...'}</span>
                </div>
              ) : systemSwitches.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
                  {isEn ? 'No system switches found from server.' : 'Chưa có tính năng nào từ máy chủ.'}
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
                        className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${flag.isEnabled
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
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${flag.isEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${flag.isEnabled ? 'translate-x-6' : 'translate-x-1'
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

      {/* ─── Modal: Cập nhật tham số ─── */}
      {isParamModalOpen && editingParam && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Chỉ có nút đóng ở trên */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {isEn ? 'Update parameter' : 'Cập nhật tham số'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={isEn ? 'Close' : 'Đóng'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleUpdateParameter} className="space-y-3.5">
                {/* Thông tin tham số */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2.5">
                  <div>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                      {isEn ? 'Parameter key' : 'Mã tham số'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] break-all select-all">
                      {editingParam.key}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 dark:border-white/10 grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        Domain
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {formatDomainName(editingParam.domain || (editingParam.key.includes('.') ? editingParam.key.split('.')[0] : ''))}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {isEn ? 'Data type' : 'Kiểu dữ liệu'}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        {getDataTypeName(editingParam.dataType, isEn)}
                      </span>
                    </div>
                    {!hasModalSlider && !hasModalDropdown && editingParam.range && (
                      <div className="col-span-2">
                        <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          {isEn ? 'Allowed range' : 'Phạm vi hợp lệ'}
                        </span>
                        <span className="font-mono text-[11px] text-[#007b8b] dark:text-[#00c4de] font-semibold">
                          {editingParam.range}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nhập giá trị */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isEn ? 'Value' : 'Giá trị'}
                  </label>
                  {isModalBoolean ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditValue('true')}
                        className={`px-4 py-2 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${editValue === 'true'
                          ? 'bg-[#007b8b] text-white border-[#007b8b]'
                          : 'bg-white dark:bg-[#061115] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                          }`}
                      >
                        true
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditValue('false')}
                        className={`px-4 py-2 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${editValue === 'false'
                          ? 'bg-[#007b8b] text-white border-[#007b8b]'
                          : 'bg-white dark:bg-[#061115] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                          }`}
                      >
                        false
                      </button>
                    </div>
                  ) : hasModalDropdown ? (
                    <CustomSelect
                      value={editValue}
                      onChange={(val) => setEditValue(val)}
                      options={modalAllowedValues!.map((opt) => ({ value: opt, label: opt }))}
                      size="sm"
                      portal={true}
                      className="w-full"
                      buttonClassName="rounded-lg py-2"
                    />
                  ) : hasModalSlider ? (
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500 select-none shrink-0 min-w-[24px] text-right">
                        {modalRangeMin}
                      </span>
                      <input
                        type="range"
                        min={modalRangeMin}
                        max={modalRangeMax}
                        step={isModalParamInteger ? 1 : modalRangeStep}
                        value={Number(editValue) || modalRangeMin}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#007b8b]"
                      />
                      <span className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500 select-none shrink-0 min-w-[24px]">
                        {modalRangeMax}
                      </span>
                      <input
                        type="number"
                        min={modalRangeMin}
                        max={modalRangeMax}
                        step={isModalParamInteger ? 1 : modalRangeStep}
                        value={editValue}
                        onKeyDown={(e) => {
                          if (isModalParamInteger && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                            e.preventDefault()
                          }
                        }}
                        onChange={(e) => {
                          let val = e.target.value
                          if (isModalParamInteger) {
                            val = val.replace(/[^0-9-]/g, '')
                          }
                          setEditValue(val)
                        }}
                        onBlur={() => setEditValue(clampAndSnapModalValue(editValue))}
                        className="w-20 px-2.5 py-1.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-semibold text-xs text-right focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>
                  ) : (
                    <input
                      type={isModalParamInteger ? 'number' : 'text'}
                      step={isModalParamInteger ? '1' : undefined}
                      value={editValue}
                      onKeyDown={(e) => {
                        if (isModalParamInteger && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                          e.preventDefault()
                        }
                      }}
                      onChange={(e) => {
                        let val = e.target.value
                        if (isModalParamInteger) {
                          val = val.replace(/[^0-9-]/g, '')
                        }
                        setEditValue(val)
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-semibold text-xs focus:outline-none focus:border-[#007b8b]"
                    />
                  )}
                </div>

                {/* Nhập mô tả */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isEn ? 'Description' : 'Mô tả tham số'}
                  </label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                  />
                </div>

                {/* Nhập lý do thay đổi */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isEn ? 'Reason for change' : 'Lý do thay đổi'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'Operational justification' : 'Nhập lý do điều chỉnh tham số'}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#007b8b]"
                  />
                </div>

                {/* Footer: 2 nút cập nhật và đặt lại, chỉ bấm khi có thay đổi */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleResetModal}
                    disabled={!hasParamChanges || isSavingParam}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isEn ? 'Reset' : 'Đặt lại'}
                  </button>
                  <button
                    type="submit"
                    disabled={!hasParamChanges || isSavingParam}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSavingParam && <CircleNotch size={13} className="animate-spin" />}
                    <span>
                      {isSavingParam
                        ? (isEn ? 'Updating...' : 'Đang cập nhật...')
                        : (isEn ? 'Update' : 'Cập nhật')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Thêm mới hoặc Cập nhật loại biển báo */}
      {isRuleFormOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsRuleFormOpen(false)
                setEditingRule(null)
                setEditingRuleId(null)
              }
            }}
          >
            <div
              className="relative w-full max-w-lg bg-white dark:bg-[#0A171C] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isEn ? 'Update sign category lifetime' : 'Cập nhật thời hạn loại biển'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn
                      ? 'Adjust recapture threshold and operational constraints.'
                      : 'Điều chỉnh thời hạn chụp lại và các thông số vận hành cho loại biển này.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRuleFormOpen(false)
                    setEditingRule(null)
                    setEditingRuleId(null)
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
                {editingRule && (
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                        {isEn ? 'Sign category' : 'Loại biển báo'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
                        {getCategoryDisplayName(editingRule, categories, isEn)}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${editingRule.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                        }`}
                    >
                      {editingRule.isActive ? (isEn ? 'Active' : 'Đang bật') : (isEn ? 'Inactive' : 'Đã tắt')}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Hạn chụp lại với inline suffix ngày */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Recapture cycle' : 'Hạn chụp lại'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={rulePeriodDays}
                        onChange={(e) => setRulePeriodDays(Number(e.target.value))}
                        className="w-full pl-3 pr-14 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
                        {isEn ? 'days' : 'ngày'}
                      </span>
                    </div>
                  </div>

                  {/* Mức ưu tiên */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Priority' : 'Mức ưu tiên'}
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
                      portal={true}
                      className="w-full"
                      buttonClassName="rounded-lg py-2"
                    />
                  </div>

                  {/* Bán kính với inline suffix m */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Radius' : 'Bán kính'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        required
                        value={ruleProximityMeters}
                        onChange={(e) => setRuleProximityMeters(Number(e.target.value))}
                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
                        m
                      </span>
                    </div>
                  </div>

                  {/* Giới hạn mỗi ngày với inline suffix ảnh/ngày */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Daily limit' : 'Giới hạn mỗi ngày'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={ruleDailyLimit}
                        onChange={(e) => setRuleDailyLimit(Number(e.target.value))}
                        className="w-full pl-3 pr-18 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg font-mono font-bold focus:outline-none focus:border-[#007b8b]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
                        {isEn ? 'photos' : 'ảnh/ngày'}
                      </span>
                    </div>
                  </div>

                  {/* Lý do thay đổi */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      {isEn ? 'Reason' : 'Lý do thay đổi'}
                    </label>
                    <input
                      type="text"
                      value={ruleReason}
                      onChange={(e) => setRuleReason(e.target.value)}
                      placeholder={isEn ? 'Reason for update' : 'Ghi chú lý do cập nhật (tùy chọn)'}
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRuleFormOpen(false)
                      setEditingRule(null)
                      setEditingRuleId(null)
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'Hủy'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRule}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSavingRule && <CircleNotch size={13} className="animate-spin" />}
                    <span>
                      {isSavingRule
                        ? (isEn ? 'Saving...' : 'Đang lưu...')
                        : (isEn ? 'Save changes' : 'Lưu thay đổi')}
                    </span>
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
