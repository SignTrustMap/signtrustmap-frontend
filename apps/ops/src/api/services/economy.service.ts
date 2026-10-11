import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface RewardRuleItem {
  id: number
  activityType: string
  baseAmount: number
  dailyLimit: number
  multiplierConfig?: Record<string, any> | null
  isActive: boolean
  effectiveFrom?: string | null
  effectiveTo?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateRewardRuleInput {
  activityType: string
  baseAmount: number
  dailyLimit: number
  multiplierConfig?: Record<string, any>
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export interface UpdateRewardRuleInput extends Partial<CreateRewardRuleInput> {}

export interface ManualWalletAdjustmentInput {
  amount: number
  reason: string
  referenceType?: string
}

export interface FreezeWalletInput {
  freeze: boolean
  reason: string
}

export const economyService = {
  // ── Dynamic Reward Rules (Admin Rewards) ────────────────────────
  getRules: async (): Promise<RewardRuleItem[]> => {
    return http.get<RewardRuleItem[]>(API_ENDPOINTS.ECONOMY.RULES)
  },

  getRuleById: async (id: number): Promise<RewardRuleItem> => {
    return http.get<RewardRuleItem>(API_ENDPOINTS.ECONOMY.RULE_DETAIL(id))
  },

  createRule: async (data: CreateRewardRuleInput): Promise<RewardRuleItem> => {
    return http.post<RewardRuleItem>(API_ENDPOINTS.ECONOMY.RULES, data)
  },

  updateRule: async (id: number, data: UpdateRewardRuleInput): Promise<RewardRuleItem> => {
    return http.put<RewardRuleItem>(API_ENDPOINTS.ECONOMY.RULE_DETAIL(id), data)
  },

  toggleRule: async (id: number): Promise<RewardRuleItem> => {
    return http.patch<RewardRuleItem>(API_ENDPOINTS.ECONOMY.RULE_TOGGLE(id))
  },

  // ── User Wallet Adjustments & Anti-Fraud ────────────────────────
  adjustWalletBalance: async (walletId: string, data: ManualWalletAdjustmentInput): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.ECONOMY.WALLET_ADJUST(walletId), data)
  },

  freezeWallet: async (walletId: string, data: FreezeWalletInput): Promise<any> => {
    return http.patch<any>(API_ENDPOINTS.ECONOMY.WALLET_FREEZE(walletId), data)
  },

  // ── Backward Compatibility Helpers ──────────────────────────────
  saveRules: async (data: any): Promise<any> => {
    return data
  },
  getTopupPackages: async (): Promise<any[]> => {
    return []
  },
  saveTopupPackages: async (packages: any): Promise<any> => {
    return packages
  },
  getCreditApprovals: async (): Promise<any[]> => {
    return []
  },
  decideCreditApproval: async (id: string, decision: 'Approved' | 'Rejected'): Promise<any> => {
    return { id, decision }
  },
}

export const EconomyService = economyService
