import {
  formatVnd,
  getWallet,
  getTopUpPackages,
  postTopUp,
  postTopUpCustom,
  getPaymentMethods,
  DEFAULT_TOP_UP_PACKAGES,
} from '@/api/wallet/wallet';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Wallet API Module', () => {
  const mockToken = 'wallet-user-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatVnd', () => {
    it('formats numbers into Vietnamese currency format', () => {
      const formatted = formatVnd(50000);
      expect(formatted).toMatch(/50[.,]000\s?₫/);
    });

    it('formats string numbers and rounds decimals', () => {
      const formatted = formatVnd('100000.50');
      expect(formatted).toMatch(/100[.,]001\s?₫/);
    });

    it('returns 0 ₫ for null, undefined, or NaN strings', () => {
      expect(formatVnd(null)).toBe('0 ₫');
      expect(formatVnd(undefined)).toBe('0 ₫');
      expect(formatVnd('not-a-number')).toBe('0 ₫');
    });
  });

  describe('getWallet', () => {
    it('fetches wallet balance and recent transactions', async () => {
      const mockWallet = {
        wallet: { id: 'w-1', userId: 'u-1', balance: 1500, updatedAt: '2026-11-07' },
        recentTransactions: [
          { id: 'tx-1', amount: 500, transactionType: 'TOPUP', description: 'Nạp tiền MoMo' },
        ],
      };

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockWallet);

      const res = await getWallet(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/wallet',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockWallet);
    });
  });

  describe('getTopUpPackages', () => {
    it('fetches packages from primary endpoint /wallet/top-up/packages', async () => {
      const mockPackages = [
        { id: 10, packageName: 'Gói Siêu Rẻ', priceVnd: '20000', creditAmount: 200, isActive: true },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockPackages);

      const packages = await getTopUpPackages(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/wallet/top-up/packages',
        { signal: undefined },
        mockToken,
      );
      expect(packages).toEqual(mockPackages);
    });

    it('falls back to /payments/packages when primary endpoint errors', async () => {
      const fallbackPackages = [
        { id: 20, packageName: 'Gói Dự Phòng', priceVnd: '30000', creditAmount: 300, isActive: true },
      ];

      (apiClient.apiRequest as jest.Mock)
        .mockRejectedValueOnce(new Error('Endpoint not found'))
        .mockResolvedValueOnce(fallbackPackages);

      const packages = await getTopUpPackages(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/payments/packages',
        { signal: undefined },
        mockToken,
      );
      expect(packages).toEqual(fallbackPackages);
    });

    it('falls back to DEFAULT_TOP_UP_PACKAGES when both remote endpoints fail', async () => {
      (apiClient.apiRequest as jest.Mock)
        .mockRejectedValueOnce(new Error('500 Server Error'))
        .mockRejectedValueOnce(new Error('502 Bad Gateway'));

      const packages = await getTopUpPackages(mockToken);

      expect(packages).toEqual(DEFAULT_TOP_UP_PACKAGES);
    });
  });

  describe('postTopUp & postTopUpCustom', () => {
    it('creates top-up order with packageId and gateway', async () => {
      const mockOrder = { paymentOrder: { orderCode: 'ORD-123' }, payUrl: 'https://momo.vn/pay' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockOrder);

      const res = await postTopUp(2, mockToken, 'MOMO');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/wallet/top-up',
        { packageId: 2, gateway: 'MOMO' },
        mockToken,
        undefined,
      );
      expect(res).toEqual(mockOrder);
    });

    it('creates custom amount top-up order with VIETQR gateway', async () => {
      const mockOrder = { paymentOrder: { orderCode: 'ORD-CUSTOM' }, qrCodeUrl: 'https://vietqr.net/qr.png' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockOrder);

      const res = await postTopUpCustom(75000, mockToken, 'VIETQR');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/wallet/top-up/custom',
        { amount: 75000, gateway: 'VIETQR' },
        mockToken,
        undefined,
      );
      expect(res).toEqual(mockOrder);
    });
  });

  describe('getPaymentMethods', () => {
    it('fetches saved payment methods', async () => {
      const mockCards = [
        { id: 'card-1', cardBrand: 'VISA', cardLast4: '4242', isDefault: true },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockCards);

      const res = await getPaymentMethods(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/wallet/payment-methods',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockCards);
    });
  });
});
