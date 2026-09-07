import type { MapCoordinate } from '@/feature/navigation/data/navigation-locations';
import type { RouteSign } from '@/feature/navigation/services/navigation-api';
import { apiRequest } from '@/services/api-client';

type BoundsResponse = {
    signs: {
        id: string;
        latitude: number;
        longitude: number;
        signCropUrl: string;
        signType: { nameEn: string; signCode: string };
    }[];
};

export async function getSignsInBounds(
    southWest: MapCoordinate,
    northEast: MapCoordinate,
): Promise<RouteSign[]> {
    const params = new URLSearchParams({
        maxLat: String(northEast[1]),
        maxLon: String(northEast[0]),
        minLat: String(southWest[1]),
        minLon: String(southWest[0]),
    });
    const response = await apiRequest<BoundsResponse>(`/signs?${params}`);
    return response.signs.map((sign) => ({
        coordinate: [sign.longitude, sign.latitude],
        id: sign.id,
        imageUrl: sign.signCropUrl,
        name: sign.signType.nameEn,
        signCode: sign.signType.signCode,
    }));
}
