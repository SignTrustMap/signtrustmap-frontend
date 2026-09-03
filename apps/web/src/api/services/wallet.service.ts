import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface WalletBalance {
  credits: number
  lockedCredits: number
  tier: string
}

export interface TransactionItem {
  id: string
  type: 'Earn' | 'Spend' | 'Topup' | 'Reward'
  amount: number
  description: string
  createdAt: string
  status: 'Completed' | 'Pending' | 'Failed'
}

export interface TopupPackage {
  id: string
  credits: number
  priceVnd: number
  bonusCredits?: number
  isPopular?: boolean
}

export const walletService = {
  /**
   * Get user wallet balance and credit status
   */
  getBalance: () => {
    return http.get<ApiResponse<WalletBalance>>(API_ENDPOINTS.WALLET.BALANCE)
  },

  /**
   * Get transaction history
   */
  getTransactions: () => {
    return http.get<ApiResponse<TransactionItem[]>>(API_ENDPOINTS.WALLET.TRANSACTIONS)
  },

  /**
   * Get available topup packages
   */
  getTopupPackages: () => {
    return http.get<ApiResponse<TopupPackage[]>>(API_ENDPOINTS.WALLET.TOPUP_PACKAGES)
  },

  /**
   * Create credit topup payment session (VietQR / VNPay / MoMo)
   */
  createTopupSession: (packageId: string, paymentMethod: 'vietqr' | 'vnpay' | 'momo') => {
    return http.post<ApiResponse<{ paymentUrl: string; orderId: string }>>(
      API_ENDPOINTS.WALLET.CREATE_PAYMENT,
      { packageId, paymentMethod }
    )
  },

  /**
   * Claim daily check-in rewards
   */
  claimDailyReward: () => {
    return http.post<ApiResponse<{ creditsAdded: number; newBalance: number }>>(
      API_ENDPOINTS.WALLET.REWARDS_CLAIM
    )
  },
}
