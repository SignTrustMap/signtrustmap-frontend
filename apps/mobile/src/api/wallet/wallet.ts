import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';

// ─── Response types ───────────────────────────────────────────────────────────

export type WalletTransaction = {
  id: string;
  amount: number;
  transactionType: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string;
  createdAt: string;
};

export type WalletResponse = {
  wallet: {
    id: string;
    userId: string;
    balance: number;
    updatedAt: string;
  };
  recentTransactions: WalletTransaction[];
};

export type TopUpPackage = {
  id: number;
  packageName: string;
  priceVnd: string;
  creditAmount: number;
  isActive: boolean;
};

export const DEFAULT_TOP_UP_PACKAGES: TopUpPackage[] = [
  { id: 1, packageName: 'Gói Khởi đầu', priceVnd: '50000.00', creditAmount: 500, isActive: true },
  { id: 2, packageName: 'Gói Tiêu chuẩn', priceVnd: '100000.00', creditAmount: 1000, isActive: true },
  { id: 3, packageName: 'Gói Chuyên nghiệp', priceVnd: '200000.00', creditAmount: 2000, isActive: true },
  { id: 4, packageName: 'Gói Doanh nghiệp', priceVnd: '500000.00', creditAmount: 5000, isActive: true },
];

export function formatVnd(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0 ₫';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 ₫';
  return `${Math.round(num).toLocaleString('vi-VN')} ₫`;
}

export type PaymentGatewayOption = {
  id: 'MOMO' | 'VIETQR' | 'MOCK';
  name: string;
  detail: string;
  iconSymbol: string;
  badge?: string;
};

export const AVAILABLE_PAYMENT_GATEWAYS: PaymentGatewayOption[] = [
  {
    id: 'MOMO',
    name: 'Ví điện tử MoMo',
    detail: 'Thanh toán trực tiếp qua MoMo hoặc quét mã MoMo QR',
    iconSymbol: '▰',
    badge: 'Khuyên dùng',
  },
  {
    id: 'VIETQR',
    name: 'Chuyển khoản VietQR',
    detail: 'Quét mã VietQR chuyển khoản nhanh 24/7 liên ngân hàng',
    iconSymbol: '▦',
  },
  {
    id: 'MOCK',
    name: 'Thanh toán Sandbox (Thử nghiệm)',
    detail: 'Tạo đơn nạp & cộng Credits trực tiếp vào ví để kiểm thử',
    iconSymbol: '⚡',
    badge: 'Sandbox',
  },
];

export type PaymentMethod = {
  id: string;
  userId: string;
  cardHolderName: string;
  cardLast4: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
};

export type TopUpOrderResponse = {
  paymentOrder: {
    id: string;
    orderCode: string;
    packageId: number;
    packageName?: string;
    amountVnd: string;
    creditAmount?: number;
    customAmount?: number;
    gateway: string;
    status: string;
    createdAt: string;
  };
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  resultCode?: number;
  message: string;
};

// ─── API calls ────────────────────────────────────────────────────────────────

export function getWallet(accessToken: string, signal?: AbortSignal) {
  return apiRequest<WalletResponse>(
    `${API_PATHS.WALLET}`,
    { signal },
    accessToken,
  );
}

export async function getTopUpPackages(accessToken?: string, signal?: AbortSignal): Promise<TopUpPackage[]> {
  try {
    const data = await apiRequest<TopUpPackage[]>(
      `${API_PATHS.WALLET}/top-up/packages`,
      { signal },
      accessToken,
    );
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[WalletAPI] Failed to fetch /wallet/top-up/packages:', err);
  }

  try {
    const fallbackData = await apiRequest<TopUpPackage[]>(
      '/payments/packages',
      { signal },
      accessToken,
    );
    if (Array.isArray(fallbackData) && fallbackData.length > 0) {
      return fallbackData;
    }
  } catch (err) {
    console.warn('[WalletAPI] Failed to fetch /payments/packages fallback:', err);
  }

  return DEFAULT_TOP_UP_PACKAGES;
}

export function postTopUp(
  packageId: number,
  accessToken: string,
  gateway = 'MOMO',
  signal?: AbortSignal,
) {
  return jsonApiRequest<TopUpOrderResponse>(
    `${API_PATHS.WALLET}/top-up`,
    { packageId, gateway },
    accessToken,
    signal,
  );
}

export function postTopUpCustom(
  amount: number,
  accessToken: string,
  gateway = 'MOMO',
  signal?: AbortSignal,
) {
  return jsonApiRequest<TopUpOrderResponse>(
    `${API_PATHS.WALLET}/top-up/custom`,
    { amount, gateway },
    accessToken,
    signal,
  );
}

export function getPaymentMethods(accessToken: string, signal?: AbortSignal) {
  return apiRequest<PaymentMethod[]>(
    `${API_PATHS.WALLET}/payment-methods`,
    { signal },
    accessToken,
  );
}

