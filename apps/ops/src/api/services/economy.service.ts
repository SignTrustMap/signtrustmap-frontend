import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export type ContributorRole = 'surveyor' | 'reviewer' | 'contributor' | 'driver'

export interface CreditApprovalItem {
  id: string
  userId?: string
  walletId?: string
  isWalletFrozen?: boolean
  user: {
    name: string
    email: string
    avatarBg: string
    role: ContributorRole
  }
  activityType: 'Khảo sát thực địa' | 'Kiểm duyệt cộng đồng' | 'Tái xác thực biển báo' | 'Nhiệm vụ hàng ngày' | string
  activityKey: 'survey' | 'review' | 'revalidation' | 'daily' | string
  amount: number
  riskLevel: 'Thấp' | 'Nghi vấn' | 'Cảnh báo gian lận'
  evidenceSummary: string
  createdAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
  evidenceUrl?: string
  riskScore?: number
  riskReason?: string
  deviceModel?: string
  gpsDistance?: number
  payoutMethod?: string
  reviewedBy?: string
  reviewedAt?: string
}

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
  referenceId?: string
}

export interface FreezeWalletInput {
  freeze: boolean
  reason: string
}

export interface CreditApprovalQueryParams {
  status?: string
  role?: string
  risk?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface CreditApprovalDecisionInput {
  decision: 'Approved' | 'Rejected'
  reason?: string
}

export interface PaginatedCreditApprovalsResponse {
  items: CreditApprovalItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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

  // ── Credit & Reward Approval Review (Xét duyệt điểm thưởng) ─────
  getCreditApprovals: async (
    params?: CreditApprovalQueryParams
  ): Promise<PaginatedCreditApprovalsResponse> => {
    try {
      const res = await http.get<any>(API_ENDPOINTS.ECONOMY.CREDITS_APPROVAL.BASE, { params })
      const raw = res?.data ?? res

      if (raw && (Array.isArray(raw.items) || Array.isArray(raw))) {
        const rawItems: any[] = Array.isArray(raw.items) ? raw.items : raw
        const items: CreditApprovalItem[] = rawItems.map((r: any) => ({
          id: r.id || `CRD-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: r.userId || r.user_id,
          walletId: r.walletId || r.wallet_id || r.userId,
          isWalletFrozen: !!(r.isWalletFrozen || r.wallet_is_frozen),
          user: {
            name: r.user?.name || r.userName || r.user_name || 'Contributor',
            email: r.user?.email || r.userEmail || r.user_email || '',
            avatarBg: r.user?.avatarBg || 'bg-[#dbeafe] text-[#1d4ed8]',
            role: r.user?.role || r.role || 'surveyor',
          },
          activityType: r.activityType || 'Khảo sát thực địa',
          activityKey: r.activityKey || 'survey',
          amount: Number(r.amount ?? r.rewardAmount ?? r.reward_amount ?? 0),
          riskLevel: r.riskLevel || (r.riskScore > 80 ? 'Cảnh báo gian lận' : r.riskScore > 40 ? 'Nghi vấn' : 'Thấp'),
          evidenceSummary: r.evidenceSummary || r.title || 'Bằng chứng ghi nhận đóng góp',
          createdAt: r.createdAt || (r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''),
          status: r.status || (r.rewardStatus === 'PAID' ? 'Approved' : r.rewardStatus === 'REJECTED' ? 'Rejected' : 'Pending'),
          evidenceUrl: r.evidenceUrl || r.firstImg,
          riskScore: r.riskScore !== undefined ? Number(r.riskScore) : undefined,
          riskReason: r.riskReason,
          deviceModel: r.deviceModel,
          gpsDistance: r.gpsDistance,
          payoutMethod: r.payoutMethod || 'Ví SignTrustMap Contributor',
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
        }))

        return {
          items,
          total: raw.total ?? items.length,
          page: raw.page ?? (params?.page ?? 1),
          pageSize: raw.pageSize ?? (params?.pageSize ?? 10),
          totalPages: raw.totalPages ?? (Math.ceil((raw.total ?? items.length) / (params?.pageSize ?? 10)) || 1),
        }
      }
    } catch (err) {
      console.warn('[EconomyService] Backend credit approvals unavailable:', err)
    }

    // Zero mock fallback - return empty list on API error / unavailability
    return {
      items: [],
      total: 0,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 0,
    }
  },

  decideCreditApproval: async (
    id: string,
    data: CreditApprovalDecisionInput
  ): Promise<{ id: string; status: 'Approved' | 'Rejected'; reason?: string }> => {
    const res = await http.post<any>(API_ENDPOINTS.ECONOMY.CREDITS_APPROVAL.DECIDE(id), data)
    const unwrapped = res?.data ?? res
    return {
      id,
      status: data.decision,
      reason: data.reason,
      ...unwrapped,
    }
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
}

export const EconomyService = economyService
