import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface WalletTransaction {
  id: string
  amount: number
  balanceAfter?: number | null
  transactionType: string
  referenceType?: string | null
  referenceId?: string | null
  idempotencyKey?: string
  metadata?: any
  description: string
  createdAt: string
}

export interface WalletResponse {
  wallet: {
    id: string
    userId: string
    balance: number
    isFrozen?: boolean
    updatedAt: string
  }
  recentTransactions: WalletTransaction[]
}

export interface TransactionsResponse {
  items: WalletTransaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TopUpPackage {
  id: number
  packageName: string
  priceVnd: string
  creditAmount: number
  isActive: boolean
  isPopular?: boolean
  bonusCredits?: number
}

export interface PaymentGatewayOption {
  id: 'VIETQR' | 'MOMO' | 'MOCK'
  name: string
  detail: string
  iconSymbol: string
  badge?: string
}

export interface TopUpOrderResponse {
  paymentOrder: {
    id: string
    orderCode: string
    packageId: number
    packageName?: string
    amountVnd: string
    creditAmount?: number
    gateway: string
    status: string
    createdAt: string
  }
  payUrl?: string
  deeplink?: string
  qrCodeUrl?: string
  bankInfo?: {
    bankId: string
    accountNo: string
    accountName: string
    amount: number
    transferContent: string
  }
  message: string
}

export const DEFAULT_TOP_UP_PACKAGES: TopUpPackage[] = [
  { id: 1, packageName: 'Gói Khởi đầu', priceVnd: '50000.00', creditAmount: 500, isActive: true, bonusCredits: 0 },
  { id: 2, packageName: 'Gói Tiêu chuẩn', priceVnd: '100000.00', creditAmount: 1000, isActive: true, bonusCredits: 50 },
  { id: 3, packageName: 'Gói Chuyên nghiệp', priceVnd: '200000.00', creditAmount: 2000, isActive: true, bonusCredits: 150 },
  { id: 4, packageName: 'Gói Doanh nghiệp', priceVnd: '500000.00', creditAmount: 5000, isActive: true, bonusCredits: 500 },
]

export const AVAILABLE_PAYMENT_GATEWAYS: PaymentGatewayOption[] = [
  {
    id: 'VIETQR',
    name: 'Chuyển khoản VietQR',
    detail: 'Quét mã VietQR chuyển khoản nhanh 24/7 liên ngân hàng',
    iconSymbol: '▦',
    badge: 'Khuyên dùng',
  },
  {
    id: 'MOMO',
    name: 'Ví điện tử MoMo',
    detail: 'Thanh toán trực tiếp qua MoMo hoặc quét mã MoMo QR',
    iconSymbol: '▰',
  },
  {
    id: 'MOCK',
    name: 'Thanh toán Sandbox Thử nghiệm',
    detail: 'Tạo đơn nạp & cộng Credits trực tiếp vào ví để kiểm thử',
    iconSymbol: '⚡',
    badge: 'Sandbox',
  },
]

export const walletService = {
  /**
   * Get user wallet balance and recent transactions
   */
  getWallet: async (): Promise<WalletResponse> => {
    return http.get<WalletResponse>(API_ENDPOINTS.WALLET.BASE)
  },

  /**
   * Paginated list of transactions
   */
  getTransactions: async (params?: {
    page?: number
    pageSize?: number
    type?: string
    from?: string
    to?: string
  }): Promise<TransactionsResponse> => {
    return http.get<TransactionsResponse>(API_ENDPOINTS.WALLET.TRANSACTIONS, { params })
  },

  /**
   * Get available top-up packages with fallback to mobile defaults
   */
  getTopupPackages: async (): Promise<TopUpPackage[]> => {
    try {
      const data = await http.get<TopUpPackage[]>(API_ENDPOINTS.WALLET.PACKAGES)
      if (Array.isArray(data) && data.length > 0) {
        return data.map((pkg) => ({
          ...pkg,
          bonusCredits: pkg.creditAmount >= 5000 ? 500 : pkg.creditAmount >= 2000 ? 150 : pkg.creditAmount >= 1000 ? 50 : 0,
        }))
      }
    } catch {
      try {
        const fallback = await http.get<TopUpPackage[]>('/api/v1/payments/packages')
        if (Array.isArray(fallback) && fallback.length > 0) {
          return fallback.map((pkg) => ({
            ...pkg,
            bonusCredits: pkg.creditAmount >= 5000 ? 500 : pkg.creditAmount >= 2000 ? 150 : pkg.creditAmount >= 1000 ? 50 : 0,
          }))
        }
      } catch {
        // use default fallback
      }
    }
    return DEFAULT_TOP_UP_PACKAGES
  },

  /**
   * Create credit top-up order
   */
  topUp: async (packageId: number, gateway: string = 'VIETQR', idempotencyKey?: string): Promise<TopUpOrderResponse> => {
    return http.post<TopUpOrderResponse>(API_ENDPOINTS.WALLET.TOPUP, {
      packageId,
      gateway,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    })
  },

  /**
   * Create custom amount credit top-up order
   */
  topUpCustom: async (amount: number, gateway: string = 'VIETQR', idempotencyKey?: string): Promise<TopUpOrderResponse> => {
    return http.post<TopUpOrderResponse>(API_ENDPOINTS.WALLET.TOPUP_CUSTOM, {
      amount,
      gateway,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    })
  },
}
