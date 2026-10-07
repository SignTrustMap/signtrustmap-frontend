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
  nextPayout: '18 Th08 2026',
  status: 'Tài xế đang hoạt động',
};

export const recentCreditTransactions: CreditTransaction[] = [
  { amount: 50, date: '16 Th08 2026 · 14:30', id: 'bonus-16', title: 'Thưởng chuyến đi' },
  { amount: -5, date: '15 Th08 2026 · 09:15', id: 'fee-15', title: 'Phí nền tảng' },
  { amount: 125, date: '14 Th08 2026 · 17:45', id: 'delivery-104', title: 'Hoàn thành chuyến đi' },
  { amount: 300, date: '12 Th08 2026 · 11:00', id: 'top-up-12', title: 'Nạp Credits vào ví' },
];

export const creditHistoryGroups = [
  {
    label: 'THÁNG 8, 2026',
    transactions: [
      {
        amount: 24.5,
        date: '16 Th08, 14:30',
        detail: 'Quận 1',
        id: 'delivery-105',
        title: 'Hoàn thành chuyến đi #105',
      },
      { amount: 50, date: '15 Th08, 09:00', id: 'weekly-bonus', title: 'Thưởng tuần' },
      { amount: -5, date: '14 Th08, 23:59', id: 'weekly-fee', title: 'Phí nền tảng theo tuần' },
      {
        amount: 18.75,
        date: '13 Th08, 16:15',
        detail: 'TP. Thủ Đức',
        id: 'delivery-104',
        title: 'Hoàn thành chuyến đi #104',
      },
    ],
  },
  {
    label: 'THÁNG 7, 2026',
    transactions: [
      {
        amount: 32,
        date: '30 Th07, 13:20',
        detail: 'Bình Thạnh',
        id: 'delivery-103',
        title: 'Hoàn thành chuyến đi #103',
      },
      {
        amount: -7,
        date: '28 Th07, 10:00',
        detail: 'Đơn #88',
        id: 'refund-88',
        title: 'Điều chỉnh hoàn tiền',
      },
    ],
  },
];

export const paymentMethods: PaymentMethod[] = [
  { detail: 'Hết hạn 12/28', id: 'visa-4242', label: 'Visa ···· 4242', symbol: '▰' },
  { id: 'apple-pay', label: 'Apple Pay', symbol: '●' },
  { id: 'google-pay', label: 'Google Pay', symbol: 'G' },
];
