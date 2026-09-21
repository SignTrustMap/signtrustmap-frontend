import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/context/session-provider';
import {
  getWallet,
  getTopUpPackages,
  postTopUp,
  postTopUpCustom,
  getPaymentMethods,
  type WalletResponse,
  type TopUpPackage,
  type PaymentMethod,
  type TopUpOrderResponse,
} from '@/api/wallet/wallet';
import { reviewKeys } from '@/feature/review/hooks/use-review';

export const walletKeys = {
  all: (accountId: string | undefined) => ['wallet', accountId] as const,
  packages: () => ['wallet', 'top-up-packages'] as const,
  paymentMethods: (accountId: string | undefined) => ['wallet', 'payment-methods', accountId] as const,
};

// ─── Balance + transactions ───────────────────────────────────────────────────

/**
 * Fetches the authenticated user's real wallet balance and recent transactions.
 */
export function useGetWallet(enabled = true) {
  const { session } = useSession();
  return useQuery<WalletResponse>({
    queryKey: walletKeys.all(session?.account.id),
    queryFn: session
      ? ({ signal }) => getWallet(session.accessToken, signal)
      : skipToken,
    enabled,
    staleTime: 30_000,
  });
}

// ─── Top-up packages (public, no auth needed) ─────────────────────────────────

export function useGetTopUpPackages(enabled = true) {
  return useQuery<TopUpPackage[]>({
    queryKey: walletKeys.packages(),
    queryFn: ({ signal }) => getTopUpPackages(signal),
    enabled,
    staleTime: 60_000 * 5, // packages rarely change — keep for 5 min
  });
}

// ─── Payment methods ──────────────────────────────────────────────────────────

export function useGetPaymentMethods(enabled = true) {
  const { session } = useSession();
  return useQuery<PaymentMethod[]>({
    queryKey: walletKeys.paymentMethods(session?.account.id),
    queryFn: session
      ? ({ signal }) => getPaymentMethods(session.accessToken, signal)
      : skipToken,
    enabled,
    staleTime: 30_000,
  });
}

// ─── Top-up mutations ─────────────────────────────────────────────────────────

/**
 * Purchase a predefined top-up package. Invalidates wallet balance on success.
 */
export function useTopUp() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation<TopUpOrderResponse, Error, { packageId: number }>({
    mutationFn: ({ packageId }) => {
      if (!session) throw new Error('Not authenticated');
      return postTopUp(packageId, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all(session?.account.id) });
    },
  });
}

/**
 * Top up with a custom credit amount. Invalidates wallet balance on success.
 */
export function useTopUpCustom() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation<TopUpOrderResponse, Error, { amount: number }>({
    mutationFn: ({ amount }) => {
      if (!session) throw new Error('Not authenticated');
      return postTopUpCustom(amount, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all(session?.account.id) });
    },
  });
}

// ─── Cache invalidation helper ────────────────────────────────────────────────

/**
 * Returns a function that invalidates both the wallet balance and reviewer stats.
 * Call this after submitting reviews to force a fresh credit-score + balance fetch.
 */
export function useInvalidateWalletAndStats() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  return () => {
    const id = session?.account.id;
    queryClient.invalidateQueries({ queryKey: walletKeys.all(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.stats(id) });
  };
}



