import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyRecaptures, submitCandidateRecapture } from '@/api/reviews/review';
import { useSession } from '@/context/session-provider';
import type { MyRecapturesResponse } from '@/types/reviewsType';

export const recaptureKeys = {
  all: (accountId: string | undefined) => ['recaptures', accountId] as const,
  list: (accountId: string | undefined, page: number, pageSize: number) =>
    [...recaptureKeys.all(accountId), 'list', page, pageSize] as const,
};

export function useGetMyRecaptures(
  params: { page?: number; pageSize?: number } = {},
  enabled = true,
) {
  const { session } = useSession();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  return useQuery<MyRecapturesResponse>({
    queryKey: recaptureKeys.list(session?.account.id, page, pageSize),
    queryFn: session
      ? ({ signal }) => getMyRecaptures({ page, pageSize }, session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session) && enabled,
    staleTime: 1000 * 30, // 30s
  });
}

export function useSubmitRecaptureMutation() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      candidateId,
      formData,
    }: {
      candidateId: string;
      formData: FormData;
    }) => {
      if (!session) {
        throw new Error('Vui lòng đăng nhập để nộp ảnh chụp lại.');
      }
      return submitCandidateRecapture(candidateId, formData, session.accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recaptureKeys.all(session?.account.id),
      });
      void queryClient.invalidateQueries({
        queryKey: ['my-submissions'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['survey-stats'],
      });
    },
  });
}
