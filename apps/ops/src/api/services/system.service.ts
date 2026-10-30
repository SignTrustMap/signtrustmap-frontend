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
  alphaSmoothingFactor: number
  weightCorrect: number
  penaltyFalse: number
  minSampleBaseline?: number
  minReliabilityThreshold?: number
  consecutiveErrorLimit?: number
  suspensionCooldownDays?: number
  provisionalVoteWeight?: number
  isActive?: boolean
}

export interface RouteMatrixItem {
  id: number
  route_class?: string
  routeClass?: string
  name_vi?: string
  nameVi?: string
  default_lifetime_days?: number
  defaultLifetimeDays?: number
  reval_threshold_days?: number
  revalThresholdDays?: number
  spatial_buffer_meters?: number
  spatialBufferMeters?: number
}

export interface UpdateRouteMatrixInput {
  defaultLifetimeDays?: number
  revalThresholdDays?: number
  spatialBufferMeters?: number
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
    return http.put<SystemParameterItem>(API_ENDPOINTS.SETTINGS.SYSTEM_PARAMETER_KEY(key), data)
  },

  // ── Consensus Hyperparameters (Flow 4) ──────────────────────────
  getConsensusConfig: async (): Promise<ConsensusConfigItem> => {
    return http.get<ConsensusConfigItem>(API_ENDPOINTS.SETTINGS.CONSENSUS_CONFIG)
  },

  updateConsensusConfig: async (data: Partial<ConsensusConfigItem>): Promise<ConsensusConfigItem> => {
    return http.put<ConsensusConfigItem>(API_ENDPOINTS.SETTINGS.CONSENSUS_CONFIG, data)
  },

  // ── Route Freshness Decay Matrix (Flow 8) ───────────────────────
  getRouteMatrix: async (): Promise<RouteMatrixItem[]> => {
    return http.get<RouteMatrixItem[]>(API_ENDPOINTS.SETTINGS.ROUTE_MATRIX)
  },

  updateRouteMatrix: async (id: number, data: UpdateRouteMatrixInput): Promise<RouteMatrixItem> => {
    return http.put<RouteMatrixItem>(API_ENDPOINTS.SETTINGS.ROUTE_MATRIX_DETAIL(id), data)
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
