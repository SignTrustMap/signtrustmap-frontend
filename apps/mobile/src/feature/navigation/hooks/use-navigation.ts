import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    activateCustomAlertProfile,
    createCustomAlertProfile,
    deleteCustomAlertProfile,
    endNavigationSession,
    getCustomAlertProfiles,
    getNavigationPreferences,
    getNavigationRoute,
    getNavigationSessions,
    getVehicleModes,
    initiateNavigationSession,
    previewNavigationRoute,
    type RoutingOptions,
    updateNavigationPreferences,
} from '@/api/navigation/navigation';
import { useSession } from '@/context/session-provider';
import type {
    CreateAlertProfileDto,
    InitiateNavigationSessionDto,
    MapCoordinate,
    UpdateNavigationPreferencesDto,
    VehicleMode,
} from "@/types/navigationType";

export function useGetVehicleModes() {
    return useQuery({
        queryKey: ['vehicle-modes'],
        queryFn: ({ signal }) => getVehicleModes(signal),
        staleTime: 5 * 60 * 1000,
    });
}

export function useGetNavigationRoute(
    startCoordinate: MapCoordinate | undefined,
    destinationCoordinate: MapCoordinate | undefined,
    vehicleMode: VehicleMode["id"] = "DRIVING",
    options?: RoutingOptions,
) {
    return useQuery({
        queryKey: ['navigation-route', startCoordinate, destinationCoordinate, vehicleMode, options],
        queryFn: startCoordinate && destinationCoordinate
            ? ({ signal }) => getNavigationRoute(startCoordinate, destinationCoordinate, vehicleMode, signal, options)
            : skipToken,
        placeholderData: (previousData) => previousData,
        // Keep the planned route stable while following it.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function usePreviewNavigationRoute(
    startCoordinate: MapCoordinate | undefined,
    destinationCoordinate: MapCoordinate | undefined,
    vehicleMode: VehicleMode["id"] = "DRIVING",
    options?: RoutingOptions,
) {
    return useQuery({
        queryKey: ['navigation-route-preview', startCoordinate, destinationCoordinate, vehicleMode, options],
        queryFn: startCoordinate && destinationCoordinate
            ? ({ signal }) => previewNavigationRoute(startCoordinate, destinationCoordinate, vehicleMode, options, signal)
            : skipToken,
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useGetNavigationPreferences(accessToken?: string) {
    return useQuery({
        queryKey: ['navigation-preferences'],
        queryFn: accessToken
            ? ({ signal }) => getNavigationPreferences(accessToken, signal)
            : skipToken,
        enabled: Boolean(accessToken),
        staleTime: 60 * 1000,
    });
}

export function useUpdateNavigationPreferences(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (preferences: UpdateNavigationPreferencesDto) => {
            if (!accessToken) throw new Error('Authentication required');
            return updateNavigationPreferences(preferences, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['navigation-preferences'] });
        },
    });
}

export function useGetNavigationSessions(
    params: { page?: number; pageSize?: number } = { page: 1, pageSize: 20 },
    enabled = true,
) {
    const { session } = useSession();
    return useQuery({
        queryKey: ['navigation-sessions', session?.account.id, params],
        queryFn: session
            ? ({ signal }) => getNavigationSessions(params, session.accessToken, signal)
            : skipToken,
        enabled: Boolean(session?.accessToken) && enabled,
        staleTime: 30_000,
    });
}

export function useInitiateNavigationSession(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: InitiateNavigationSessionDto) => {
            if (!accessToken) throw new Error('Authentication required');
            return initiateNavigationSession(dto, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['wallet'] });
            void queryClient.invalidateQueries({ queryKey: ['navigation-sessions'] });
        },
    });
}

export function useEndNavigationSession(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) => {
            if (!accessToken) throw new Error('Authentication required');
            return endNavigationSession(sessionId, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['navigation-sessions'] });
        },
    });
}

export function useCustomAlertProfiles(accessToken?: string) {
    return useQuery({
        queryKey: ['navigation-profiles'],
        queryFn: accessToken
            ? ({ signal }) => getCustomAlertProfiles(accessToken, signal)
            : skipToken,
        enabled: Boolean(accessToken),
    });
}

export function useCreateCustomAlertProfile(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateAlertProfileDto) => {
            if (!accessToken) throw new Error('Authentication required');
            return createCustomAlertProfile(dto, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['navigation-profiles'] });
            void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
    });
}

export function useActivateCustomAlertProfile(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => {
            if (!accessToken) throw new Error('Authentication required');
            return activateCustomAlertProfile(profileId, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['navigation-profiles'] });
        },
    });
}

export function useDeleteCustomAlertProfile(accessToken?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => {
            if (!accessToken) throw new Error('Authentication required');
            return deleteCustomAlertProfile(profileId, accessToken);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['navigation-profiles'] });
        },
    });
}
