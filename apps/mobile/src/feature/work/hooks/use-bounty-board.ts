import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  abandonQuest,
  checkInCandidate,
  claimQuest,
  getAvailableQuests,
  getMyClaims,
} from '@/api/reviews/bounty-board';
import { useSession } from '@/context/session-provider';
import type {
  ClaimQuestDto,
  QueryAvailableQuestsParams,
} from '@/types/bountyBoardType';

export const bountyKeys = {
  all: (accountId?: string) => ['bounty-board', accountId] as const,
  available: (accountId: string | undefined, params: QueryAvailableQuestsParams) =>
    [...bountyKeys.all(accountId), 'available', params] as const,
  myClaims: (accountId?: string) => [...bountyKeys.all(accountId), 'my-claims'] as const,
};

export function useAvailableBountyQuests(
  params: QueryAvailableQuestsParams,
  enabled = true,
) {
  const { session } = useSession();
  return useQuery({
    queryKey: bountyKeys.available(session?.account.id, params),
    queryFn: session
      ? ({ signal }) => getAvailableQuests(params, session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session) && enabled,
    staleTime: 15_000,
  });
}

export function useMyBountyClaims(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: bountyKeys.myClaims(session?.account.id),
    queryFn: session
      ? ({ signal }) => getMyClaims(session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session) && enabled,
    refetchInterval: 30_000,
  });
}

export function useClaimBountyQuest() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ClaimQuestDto) => {
      if (!session) throw new Error('Vui lòng đăng nhập để nhận nhiệm vụ');
      return claimQuest(dto, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.all(session?.account.id) });
    },
  });
}

export function useAbandonBountyQuest() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason?: string }) => {
      if (!session) throw new Error('Vui lòng đăng nhập để thực hiện');
      return abandonQuest(claimId, reason, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.all(session?.account.id) });
    },
  });
}

export function useCheckInCandidate() {
  const { session } = useSession();

  return useMutation({
    mutationFn: ({
      candidateId,
      coords,
    }: {
      candidateId: string;
      coords: { lat: number; lon: number; accuracyMeters?: number };
    }) => {
      if (!session) throw new Error('Vui lòng đăng nhập để kiểm tra vị trí');
      return checkInCandidate(candidateId, coords, session.accessToken);
    },
  });
}
