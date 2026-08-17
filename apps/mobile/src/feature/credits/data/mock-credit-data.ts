export type CreditTransaction = {
  amount: number;
  date: string;
  detail?: string;
  id: string;
  title: string;
};

export type PaymentMethod = {
  detail?: string;
  id: string;
  label: string;
  symbol: string;
};

export const walletSummary = {
  balance: 500,
  nextPayout: '18 Aug 2026',
  status: 'Active Driver',
};

export const recentCreditTransactions: CreditTransaction[] = [
  { amount: 50, date: '16 Aug 2026 · 2:30 PM', id: 'bonus-16', title: 'Delivery Bonus' },
  { amount: -5, date: '15 Aug 2026 · 9:15 AM', id: 'fee-15', title: 'Platform Fee' },
  { amount: 125, date: '14 Aug 2026 · 5:45 PM', id: 'delivery-104', title: 'Completed Delivery' },
  { amount: 300, date: '12 Aug 2026 · 11:00 AM', id: 'top-up-12', title: 'Wallet Top-up' },
];

export const creditHistoryGroups = [
  {
    label: 'AUGUST 2026',
    transactions: [
      {
        amount: 24.5,
        date: '16 Aug, 2:30 PM',
        detail: 'District 1',
        id: 'delivery-105',
        title: 'Delivery #105 Completed',
      },
      { amount: 50, date: '15 Aug, 9:00 AM', id: 'weekly-bonus', title: 'Weekly Bonus' },
      { amount: -5, date: '14 Aug, 11:59 PM', id: 'weekly-fee', title: 'Weekly Platform Fee' },
      {
        amount: 18.75,
        date: '13 Aug, 4:15 PM',
        detail: 'Thu Duc City',
        id: 'delivery-104',
        title: 'Delivery #104 Completed',
      },
    ],
  },
  {
    label: 'JULY 2026',
    transactions: [
      {
        amount: 32,
        date: '30 Jul, 1:20 PM',
        detail: 'Binh Thanh',
        id: 'delivery-103',
        title: 'Delivery #103 Completed',
      },
      {
        amount: -7,
        date: '28 Jul, 10:00 AM',
        detail: 'Order #88',
        id: 'refund-88',
        title: 'Refund Adjustment',
      },
    ],
  },
];

export const paymentMethods: PaymentMethod[] = [
  { detail: 'Expires 12/28', id: 'visa-4242', label: 'Visa ···· 4242', symbol: '▰' },
  { id: 'apple-pay', label: 'Apple Pay', symbol: '●' },
  { id: 'google-pay', label: 'Google Pay', symbol: 'G' },
];
