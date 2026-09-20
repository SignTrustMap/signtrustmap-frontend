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

export function getTopUpPackages(signal?: AbortSignal) {
  return apiRequest<TopUpPackage[]>(
    `${API_PATHS.WALLET}/top-up/packages`,
    { signal },
  );
}

export function postTopUp(
  packageId: number,
  accessToken: string,
  signal?: AbortSignal,
) {
  return jsonApiRequest<TopUpOrderResponse>(
    `${API_PATHS.WALLET}/top-up`,
    { packageId },
    accessToken,
    signal,
  );
}

export function postTopUpCustom(
  amount: number,
  accessToken: string,
  signal?: AbortSignal,
) {
  return jsonApiRequest<TopUpOrderResponse>(
    `${API_PATHS.WALLET}/top-up/custom`,
    { amount },
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

