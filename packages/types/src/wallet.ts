export interface TopupPackageItem {
  id: string
  name: string
  credits: number
  priceVnd: number
  bonusCredits: number
  popular?: boolean
  description: string
}

export interface WalletTransactionItem {
  id: string
  type: 'TOPUP' | 'REWARD' | 'REDEEM' | 'BONUS' | string
  title: string
  amount: number
  balanceAfter: number
  date: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string
  referenceId?: string
}

export interface WalletBalance {
  credits: number
  vndEquivalent: number
  pendingCredits: number
}

export interface CreditApprovalItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  requestDate: string
  bankName: string
  bankAccount: string
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối' | string
  notes?: string
}

export interface CreditRuleItem {
  id: string
  actionKey: string
  actionNameVi: string
  credits: number
  description: string
  category: 'Survey' | 'Review' | 'Bonus' | 'Penalty' | string
}
