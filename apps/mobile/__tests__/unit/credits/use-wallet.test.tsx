import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGetWallet,
  useGetTopUpPackages,
  useGetPaymentMethods,
  useTopUp,
  useTopUpCustom,
  useInvalidateWalletAndStats,
  walletKeys,
} from '@/feature/credits/hooks/use-wallet';
import {
  getWallet,
  getTopUpPackages,
  getPaymentMethods,
  postTopUp,
  postTopUpCustom,
} from '@/api/wallet/wallet';
import { useSession } from '@/context/session-provider';

jest.mock('@/api/wallet/wallet', () => ({
  getWallet: jest.fn(),
  getTopUpPackages: jest.fn(),
  getPaymentMethods: jest.fn(),
  postTopUp: jest.fn(),
  postTopUpCustom: jest.fn(),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: jest.fn(),
}));

describe('use-wallet hooks', () => {
  let queryClient: QueryClient;

  const mockSession = {
    accessToken: 'test-token',
    account: { id: 'acc-123', email: 'test@example.com' },
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ session: mockSession });
  });

  describe('walletKeys', () => {
    it('creates correct query keys', () => {
      expect(walletKeys.all('acc-1')).toEqual(['wallet', 'acc-1']);
      expect(walletKeys.packages('acc-1')).toEqual(['wallet', 'top-up-packages', 'acc-1']);
      expect(walletKeys.paymentMethods('acc-1')).toEqual(['wallet', 'payment-methods', 'acc-1']);
    });
  });

  describe('useGetWallet', () => {
    it('fetches wallet data with boolean option', async () => {
      const mockWalletData = { balance: 500, transactions: [] };
      (getWallet as jest.Mock).mockResolvedValue(mockWalletData);

      const { result } = await renderHook(() => useGetWallet(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockWalletData);
      expect(getWallet).toHaveBeenCalledWith('test-token', expect.anything());
    });

    it('supports custom options object', async () => {
      const mockWalletData = { balance: 1000, transactions: [] };
      (getWallet as jest.Mock).mockResolvedValue(mockWalletData);

      const { result } = await renderHook(
        () =>
          useGetWallet({
            enabled: true,
            staleTime: 10_000,
            gcTime: 50_000,
            refetchOnMount: 'always',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockWalletData);
    });

    it('does not run query when session is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({ session: null });

      const { result } = await renderHook(() => useGetWallet(true), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(getWallet).not.toHaveBeenCalled();
    });
  });

  describe('useGetTopUpPackages', () => {
    it('fetches top up packages', async () => {
      const mockPackages = [{ id: 1, name: 'Pack 100', credits: 100, price: 10000 }];
      (getTopUpPackages as jest.Mock).mockResolvedValue(mockPackages);

      const { result } = await renderHook(() => useGetTopUpPackages(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPackages);
      expect(getTopUpPackages).toHaveBeenCalledWith('test-token', expect.anything());
    });
  });

  describe('useGetPaymentMethods', () => {
    it('fetches payment methods when session is present', async () => {
      const mockMethods = [{ id: 'momo', name: 'MoMo' }];
      (getPaymentMethods as jest.Mock).mockResolvedValue(mockMethods);

      const { result } = await renderHook(() => useGetPaymentMethods(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockMethods);
      expect(getPaymentMethods).toHaveBeenCalledWith('test-token', expect.anything());
    });

    it('skips query when session is null', async () => {
      (useSession as jest.Mock).mockReturnValue({ session: null });

      const { result } = await renderHook(() => useGetPaymentMethods(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(getPaymentMethods).not.toHaveBeenCalled();
    });
  });

  describe('useTopUp', () => {
    it('successfully posts top up and invalidates wallet cache', async () => {
      const orderResp = { orderId: 'ord-123', paymentUrl: 'https://momo.vn/pay' };
      (postTopUp as jest.Mock).mockResolvedValue(orderResp);

      const { result } = await renderHook(() => useTopUp(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await result.current.mutateAsync({ packageId: 2, gateway: 'VNPAY' });
      });

      expect(postTopUp).toHaveBeenCalledWith(2, 'test-token', 'VNPAY');
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: walletKeys.all('acc-123'),
      });
    });

    it('throws error when session is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({ session: null });

      const { result } = await renderHook(() => useTopUp(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ packageId: 2 })
      ).rejects.toThrow();
    });
  });

  describe('useTopUpCustom', () => {
    it('successfully posts custom top up and invalidates wallet cache', async () => {
      const orderResp = { orderId: 'ord-456', paymentUrl: 'https://momo.vn/pay-custom' };
      (postTopUpCustom as jest.Mock).mockResolvedValue(orderResp);

      const { result } = await renderHook(() => useTopUpCustom(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await result.current.mutateAsync({ amount: 50000 });
      });

      expect(postTopUpCustom).toHaveBeenCalledWith(50000, 'test-token', 'MOMO');
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: walletKeys.all('acc-123'),
      });
    });

    it('throws error when session is missing', async () => {
      (useSession as jest.Mock).mockReturnValue({ session: null });

      const { result } = await renderHook(() => useTopUpCustom(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ amount: 50000 })
      ).rejects.toThrow();
    });
  });

  describe('useInvalidateWalletAndStats', () => {
    it('invalidates both wallet and review stats', async () => {
      const { result } = await renderHook(() => useInvalidateWalletAndStats(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: walletKeys.all('acc-123'),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['reviewer-stats', 'acc-123'],
      });
    });
  });
});
