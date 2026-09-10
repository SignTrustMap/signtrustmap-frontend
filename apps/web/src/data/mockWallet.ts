export interface TopupPackageItem {
  id: string
  name: string
  credits: number
  priceVnd: number
  bonusCredits: number
  description: string
  isPopular?: boolean
}

export interface WalletTransactionItem {
  id: string
  type: 'survey_reward' | 'review_reward' | 'daily_claim' | 'topup' | 'nav_spend'
  title: string
  amountCredits: number
  status: 'Completed' | 'Pending'
  date: string
  paymentMethod?: string
}

export const mockTopupPackages: TopupPackageItem[] = [
  {
    id: 'pkg-starter',
    name: 'Starter Contributor',
    credits: 100,
    priceVnd: 50000,
    bonusCredits: 0,
    description: 'Great for occasional navigation updates and sign verifications.',
  },
  {
    id: 'pkg-pro',
    name: 'Pro Explorer',
    credits: 500,
    priceVnd: 200000,
    bonusCredits: 50,
    description: 'Best value for daily commuters and active map contributors.',
    isPopular: true,
  },
  {
    id: 'pkg-enterprise',
    name: 'Fleet & Logistics',
    credits: 2000,
    priceVnd: 750000,
    bonusCredits: 300,
    description: 'High-frequency GIS map queries, batch export, and route analysis.',
  },
]

export const mockWalletTransactions: WalletTransactionItem[] = [
  {
    id: 'TXN-9081',
    type: 'survey_reward',
    title: 'Survey Ingestion Reward (Vo Van Kiet Highway)',
    amountCredits: 320,
    status: 'Completed',
    date: '28/08/2026 09:15',
  },
  {
    id: 'TXN-9080',
    type: 'review_reward',
    title: 'Batch Peer-Review Validation (25 Signs)',
    amountCredits: 125,
    status: 'Completed',
    date: '27/08/2026 16:30',
  },
  {
    id: 'TXN-9079',
    type: 'daily_claim',
    title: 'Daily Contributor Check-in Streak',
    amountCredits: 25,
    status: 'Completed',
    date: '27/08/2026 07:00',
  },
  {
    id: 'TXN-9078',
    type: 'topup',
    title: 'Credit Top-up: Pro Explorer Package',
    amountCredits: 550,
    status: 'Completed',
    date: '20/08/2026 11:20',
    paymentMethod: 'VietQR / MBBank',
  },
  {
    id: 'TXN-9077',
    type: 'nav_spend',
    title: 'High-Precision Route Speed Limit Cache Sync',
    amountCredits: -10,
    status: 'Completed',
    date: '19/08/2026 18:45',
  },
]
