import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface SystemParameterItem {
  id?: number
  key: string
  value: any
  description?: string | null
  updated_at?: string
  updatedAt?: string
}

export interface ConsensusConfigItem {
  id?: number
  approvalThreshold: number
  rejectionThreshold: number
  minVotesRequired: number
  maxVotesLimit?: number
  alphaSmoothingFactor: number
  weightCorrect: number
  penaltyFalse: number
  minSampleBaseline?: number
  minReliabilityThreshold?: number
  consecutiveErrorLimit?: number
  suspensionCooldownDays?: number
  provisionalVoteWeight?: number
  reason?: string
  isActive?: boolean
}

export interface RouteMatrixItem {
  id: number
  name?: string
  road_type?: string
  roadType?: string
  route_class?: string
  routeClass?: string
  name_vi?: string
  nameVi?: string
  default_lifetime_days?: number
  defaultLifetimeDays?: number
  revalidation_threshold_days?: number
  revalidationThresholdDays?: number
  reval_threshold_days?: number
  revalThresholdDays?: number
  spatial_buffer_meters?: number
  spatialBufferMeters?: number
  createdAt?: string
}

export interface UpdateRouteMatrixInput {
  roadType?: string
  defaultLifetimeDays?: number
  revalidationThresholdDays?: number
  spatialBufferMeters?: number
  reason?: string
}

export type FreshnessRulePriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface FreshnessRuleItem {
  id: number
  signCategoryId: number | null
  categoryCode?: string | null
  categoryNameEn?: string | null
  categoryNameVi?: string | null
  freshnessPeriodDays: number
  defaultPriority: FreshnessRulePriority | string
  maxProximityMeters: number
  dailySubmissionLimit: number
  isActive: boolean
  createdAt?: string
}

export interface CreateFreshnessRuleInput {
  signCategoryId?: number | null
  freshnessPeriodDays: number
  defaultPriority?: FreshnessRulePriority
  maxProximityMeters?: number
  dailySubmissionLimit?: number
  isActive?: boolean
  reason?: string
}

export interface UpdateFreshnessRuleInput {
  signCategoryId?: number | null
  freshnessPeriodDays?: number
  defaultPriority?: FreshnessRulePriority
  maxProximityMeters?: number
  dailySubmissionLimit?: number
  isActive?: boolean
  reason?: string
}

export interface SystemFeatureFlagItem {
  key: string
  name: string
  description?: string | null
  category?: string
  isEnabled: boolean
  metadata?: Record<string, any>
  updatedAt?: string
  updatedBy?: string | null
}

export const systemService = {
  // ── Global System Parameters (Flow 13) ──────────────────────────
  getParameters: async (): Promise<SystemParameterItem[]> => {
    return http.get<SystemParameterItem[]>(API_ENDPOINTS.SETTINGS.SYSTEM_PARAMETERS)
  },

  getParameterByKey: async (key: string): Promise<SystemParameterItem> => {
    return http.get<SystemParameterItem>(API_ENDPOINTS.SETTINGS.SYSTEM_PARAMETER_KEY(key))
  },

  upsertParameter: async (key: string, data: { value: any; description?: string }): Promise<SystemParameterItem> => {
    const payload = {
      value: typeof data.value === 'string' ? data.value : JSON.stringify(data.value),
      description: data.description,
    }
    return http.put<SystemParameterItem>(API_ENDPOINTS.SETTINGS.SYSTEM_PARAMETER_KEY(key), payload)
  },

  // ── Consensus Hyperparameters (Flow 4) ──────────────────────────
  getConsensusConfig: async (): Promise<ConsensusConfigItem> => {
    const res: any = await http.get(API_ENDPOINTS.SETTINGS.CONSENSUS_CONFIG)
    return res?.data || res
  },

  updateConsensusConfig: async (data: Partial<ConsensusConfigItem>): Promise<ConsensusConfigItem> => {
    const res: any = await http.put(API_ENDPOINTS.SETTINGS.CONSENSUS_CONFIG, data)
    return res?.data || res
  },

  // ── Route Freshness Decay Matrix (Flow 8) ───────────────────────
  getRouteMatrix: async (): Promise<RouteMatrixItem[]> => {
    const res: any = await http.get(API_ENDPOINTS.SETTINGS.ROUTE_MATRIX)
    return Array.isArray(res) ? res : res?.data || []
  },

  updateRouteMatrix: async (id: number, data: UpdateRouteMatrixInput): Promise<RouteMatrixItem> => {
    const res: any = await http.put(API_ENDPOINTS.SETTINGS.ROUTE_MATRIX_DETAIL(id), data)
    return res?.data || res
  },

  // ── Category Freshness Rules & Field Guardrails ─────────────────
  listFreshnessRules: async (): Promise<FreshnessRuleItem[]> => {
    const res: any = await http.get(API_ENDPOINTS.SETTINGS.FRESHNESS_RULES)
    return Array.isArray(res) ? res : res?.data || []
  },

  createFreshnessRule: async (data: CreateFreshnessRuleInput): Promise<FreshnessRuleItem> => {
    const res: any = await http.post(API_ENDPOINTS.SETTINGS.FRESHNESS_RULES, data)
    return res?.data || res
  },

  updateFreshnessRule: async (id: number, data: UpdateFreshnessRuleInput): Promise<FreshnessRuleItem> => {
    const res: any = await http.put(API_ENDPOINTS.SETTINGS.FRESHNESS_RULE_DETAIL(id), data)
    return res?.data || res
  },

  deleteFreshnessRule: async (id: number): Promise<{ id: number; deactivated: boolean }> => {
    const res: any = await http.delete(API_ENDPOINTS.SETTINGS.FRESHNESS_RULE_DETAIL(id))
    return res?.data || res
  },

  // ── System Feature Switches & Demo Controls ─────────────────────
  getSystemSwitches: async (): Promise<SystemFeatureFlagItem[]> => {
    const res: any = await http.get(API_ENDPOINTS.SETTINGS.SYSTEM_SWITCHES)
    return Array.isArray(res) ? res : res?.data || []
  },

  updateSystemSwitch: async (
    key: string,
    data: { isEnabled: boolean; metadata?: Record<string, any>; reason?: string }
  ): Promise<SystemFeatureFlagItem> => {
    const res: any = await http.patch(API_ENDPOINTS.SETTINGS.SYSTEM_SWITCH_KEY(key), data)
    return res?.data || res
  },

  enableDemoMode: async (data?: { targetEmail?: string; reason?: string }): Promise<SystemFeatureFlagItem[]> => {
    const res: any = await http.post(API_ENDPOINTS.SETTINGS.DEMO_MODE_ENABLE, data || {})
    return Array.isArray(res) ? res : res?.data || []
  },

  disableDemoMode: async (data?: { reason?: string }): Promise<SystemFeatureFlagItem[]> => {
    const res: any = await http.post(API_ENDPOINTS.SETTINGS.DEMO_MODE_DISABLE, data || {})
    return Array.isArray(res) ? res : res?.data || []
  },

  // ── Backward Compatibility Helpers ──────────────────────────────
  getSettings: async (): Promise<any> => {
    return systemService.getParameters()
  },
  updateSettings: async (data: any): Promise<any> => {
    return data
  },
  toggleMaintenance: async (enabled: boolean): Promise<any> => {
    return systemService.upsertParameter('maintenance_mode', { value: enabled, description: 'Maintenance mode toggle' })
  },
}

export const SystemService = systemService
