import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptionalSession } from '@/context/session-provider';
import {
  createSavedRoute,
  deleteSavedRoute,
  getSavedRoutes,
  getSavedRouteSigns,
  updateSavedRoute,
  type CreateSavedRouteDto,
  type SavedRouteItem,
} from '@/api/navigation/saved-routes';

export function useSavedRoutes() {
  const session = useOptionalSession()?.session;
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const routesQuery = useQuery({
    queryKey: ['saved-routes', token],
    queryFn: ({ signal }) => getSavedRoutes(token, signal),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (dto: CreateSavedRouteDto) => createSavedRoute(dto, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSavedRouteDto> }) =>
      updateSavedRoute(id, dto, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedRoute(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });

  return {
    savedRoutes: routesQuery.data ?? [],
    isLoading: routesQuery.isLoading,
    isError: routesQuery.isError,
    refetch: routesQuery.refetch,
    saveRoute: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    updateRoute: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteRoute: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSavedRouteSigns(routeId?: string) {
  const { session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['saved-route-signs', routeId, token],
    queryFn: ({ signal }) => routeId ? getSavedRouteSigns(routeId, token, signal) : Promise.resolve([]),
    enabled: Boolean(routeId && token),
    staleTime: 60_000,
  });
}
