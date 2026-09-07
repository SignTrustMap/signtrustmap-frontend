import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CreditApprovalItem } from '@/data'

export interface EconomyRulesConfig {
  surveyReward: number
  reviewReward: number
  revalidationBounty: number
  dailyTaskBonus: number
  navConsumptionRate: number
}

export interface TopupPackage {
  id: string
  priceVnd: number
  credits: number
  bonus: number
}

export class EconomyService {
  /**
   * Fetch credit rules configuration
   */
  static async getRules(): Promise<ApiResponse<EconomyRulesConfig>> {
    return http.get<ApiResponse<EconomyRulesConfig>>(API_ENDPOINTS.ECONOMY.RULES)
  }

  /**
   * Save credit rules configuration
   */
  static async saveRules(data: EconomyRulesConfig): Promise<ApiResponse<EconomyRulesConfig>> {
    return http.put<ApiResponse<EconomyRulesConfig>>(API_ENDPOINTS.ECONOMY.RULES, data)
  }

  /**
   * Fetch topup packages
   */
  static async getTopupPackages(): Promise<ApiResponse<TopupPackage[]>> {
    return http.get<ApiResponse<TopupPackage[]>>(API_ENDPOINTS.ECONOMY.TOPUP_PACKAGES)
  }

  /**
   * Save topup packages
   */
  static async saveTopupPackages(packages: TopupPackage[]): Promise<ApiResponse<TopupPackage[]>> {
    return http.put<ApiResponse<TopupPackage[]>>(API_ENDPOINTS.ECONOMY.TOPUP_PACKAGES, { packages })
  }

  /**
   * Fetch credit discrepancy and reward approval requests
   */
  static async getCreditApprovals(): Promise<ApiResponse<CreditApprovalItem[]>> {
    return http.get<ApiResponse<CreditApprovalItem[]>>(API_ENDPOINTS.ECONOMY.CREDITS_APPROVAL.BASE)
  }

  /**
   * Approve or reject a credit reward request
   */
  static async decideCreditApproval(id: string, decision: 'Approved' | 'Rejected'): Promise<ApiResponse<CreditApprovalItem>> {
    return http.post<ApiResponse<CreditApprovalItem>>(API_ENDPOINTS.ECONOMY.CREDITS_APPROVAL.DECISION(id), { decision })
  }
}
