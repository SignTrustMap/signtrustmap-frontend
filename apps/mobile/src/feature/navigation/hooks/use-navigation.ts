import { useQuery } from '@tanstack/react-query'
import { getVehicleModes, getNavigationRoute } from '@/api/navigation/navigation'
import type { MapCoordinate, VehicleMode } from "@/types/navigation/navigationType";
export function useGetVehicleModes() {
    return useQuery({
        queryKey: ['vehicle-modes'],
        queryFn: () => getVehicleModes(),
    })
}

export function useGetNavigationRoute(
    startCoordinate: MapCoordinate,
    destinationCoordinate: MapCoordinate,
    vehicleMode: VehicleMode["id"] = "DRIVING"
) {
    return useQuery({
        queryKey: ['navigation-route', startCoordinate, destinationCoordinate, vehicleMode],
        queryFn: ({ signal }) => getNavigationRoute(startCoordinate, destinationCoordinate, vehicleMode, signal),
    })
}