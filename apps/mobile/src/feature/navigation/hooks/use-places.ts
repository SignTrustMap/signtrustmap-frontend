import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getUserPlaces, saveRecentPlace, searchPlaces, type ApiPlace } from '@/api/navigation/places';
import { useSession } from '@/context/session-provider';
import { useDebounce } from '@/hooks/use-debounce';

export function useGetUserPlaces(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: ['user-places', session?.account.id],
    queryFn: session
      ? ({ signal }) => getUserPlaces(session.accessToken, signal)
      : skipToken,
    enabled,
  });
}

export function useSearchPlaces(query: string) {
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebounce(normalizedQuery, 350);

  const isDebouncing = normalizedQuery !== debouncedQuery;
  const result = useQuery({
    queryKey: ['place-search', normalizedQuery],
    queryFn: normalizedQuery.length >= 2 && !isDebouncing
      ? ({ signal }) => searchPlaces(normalizedQuery, signal)
      : skipToken,
  });

  return { ...result, isDebouncing };
}

export function usePlaceSuggestions(query: string) {
  const isSearching = query.trim().length >= 2;
  const userPlaces = useGetUserPlaces(!isSearching);
  const search = useSearchPlaces(query);
  const result = isSearching ? search : userPlaces;

  return {
    data: result.data ?? [],
    error: result.error?.message,
    isLoading: result.isLoading || (isSearching && search.isDebouncing),
  };
}

export function useSaveRecentPlace() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (place: ApiPlace) => {
      if (!session) throw new Error('Sign in to save recent places.');
      return saveRecentPlace(place, session.accessToken);
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['user-places', session?.account.id],
    }),
  });
}
