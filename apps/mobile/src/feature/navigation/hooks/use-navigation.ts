import { skipToken, useQuery } from '@tanstack/react-query'
import { getVehicleModes, getNavigationRoute } from '@/api/navigation/navigation'
import type { MapCoordinate, VehicleMode } from "@/types/navigation/navigationType";
export function useGetVehicleModes() {
    return useQuery({
        queryKey: ['vehicle-modes'],
        queryFn: ({ signal }) => getVehicleModes(signal),
    })
}

export function useGetNavigationRoute(
    startCoordinate: MapCoordinate | undefined,
    destinationCoordinate: MapCoordinate | undefined,
    vehicleMode: VehicleMode["id"] = "DRIVING"
) {
    return useQuery({
        queryKey: ['navigation-route', startCoordinate, destinationCoordinate, vehicleMode],
        queryFn: startCoordinate && destinationCoordinate
            ? ({ signal }) => getNavigationRoute(startCoordinate, destinationCoordinate, vehicleMode, signal)
            : skipToken,
        // Keep the planned route stable while following it.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })
}
