import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptionalSession } from '@/context/session-provider';
import {
  createSavedRoute,
  deleteSavedRoute,
  getSavedRouteById,
  getSavedRoutes,
  getSavedRouteSigns,
  updateSavedRoute,
} from '@/api/saved-routes/saved-routes';
import type {
  CreateSavedRouteDto,
  SavedRoute,
  UpdateSavedRouteDto,
} from '@/types/savedRouteType';
import { toRouteSign } from '@/feature/navigation/utils/signs';
import type { RouteSign } from '@/api/navigation/navigation';

export function useGetSavedRoutes(vehicleMode?: string) {
  const session = useOptionalSession()?.session;

  return useQuery({
    queryKey: ['saved-routes', vehicleMode, session?.accessToken],
    queryFn: session?.accessToken
      ? ({ signal }) => getSavedRoutes(vehicleMode, session.accessToken, signal)
      : skipToken,
    staleTime: 30_000,
  });
}

export function useGetSavedRoute(id?: string) {
  const session = useOptionalSession()?.session;

  return useQuery({
    queryKey: ['saved-route', id, session?.accessToken],
    queryFn: session?.accessToken && id
      ? ({ signal }) => getSavedRouteById(id, session.accessToken, signal)
      : skipToken,
    enabled: Boolean(id && session?.accessToken),
  });
}

export function useGetSavedRouteSigns(id?: string) {
  const session = useOptionalSession()?.session;

  return useQuery({
    queryKey: ['saved-route-signs', id, session?.accessToken],
    queryFn: session?.accessToken && id
      ? ({ signal }) => getSavedRouteSigns(id, session.accessToken, signal)
      : skipToken,
    select: (data): { routeId: string; routeTitle: string; vehicleMode: string; distanceMeters: number; signCount: number; signs: RouteSign[] } => ({
      ...data,
      signs: (data.signs || []).map((item: any) => toRouteSign(item.sign ?? item)),
    }),
    enabled: Boolean(id && session?.accessToken),
    staleTime: 30_000,
  });
}

export function useCreateSavedRoute() {
  const session = useOptionalSession()?.session;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSavedRouteDto) => {
      if (!session?.accessToken) throw new Error('Yêu cầu đăng nhập để lưu lộ trình');
      return createSavedRoute(dto, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });
}

export function useUpdateSavedRoute() {
  const session = useOptionalSession()?.session;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSavedRouteDto }) => {
      if (!session?.accessToken) throw new Error('Yêu cầu đăng nhập để cập nhật lộ trình');
      return updateSavedRoute(id, dto, session.accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
      queryClient.invalidateQueries({ queryKey: ['saved-route', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['saved-route-signs', variables.id] });
    },
  });
}

export function useDeleteSavedRoute() {
  const session = useOptionalSession()?.session;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!session?.accessToken) throw new Error('Yêu cầu đăng nhập để xóa lộ trình');
      return deleteSavedRoute(id, session.accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });
}
