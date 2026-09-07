import { useQuery } from '@tanstack/react-query'
import { getVehicleModes } from '@/api/navigation/navigation'

export function useVehicleModes() {
    return useQuery({
        queryKey: ['vehicle-modes'],
        queryFn: () => getVehicleModes(),
    })
}