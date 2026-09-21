import { apiBaseUrl, apiRequest, jsonApiRequest } from '@/api/api-client';

export type ApiPlace = {
    address: string | null;
    id: string;
    latitude: number | null;
    longitude: number | null;
    title: string;
    type: 'recent' | 'saved';
};

type SavedPlace = {
    address: string;
    id: string;
    label: string;
    latitude: number;
    longitude: number;
};

type RecentSearch = {
    address: string | null;
    id: string;
    latitude: number | null;
    longitude: number | null;
    query: string;
};

type SpatialSearchResult = {
    communeCode: string;
    communeName: string;
    displayName: string;
    latitude: number;
    longitude: number;
    provinceName: string;
};

export async function getUserPlaces(accessToken: string, signal?: AbortSignal): Promise<ApiPlace[]> {
    const [saved, recent] = await Promise.all([
        apiRequest<SavedPlace[]>('/places/saved', { signal }, accessToken),
        apiRequest<RecentSearch[]>('/places/recent-searches?limit=20', { signal }, accessToken),
    ]);
    return [
        ...saved.map((place): ApiPlace => ({
            address: place.address,
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            title: place.label,
            type: 'saved',
        })),
        ...recent.map((place): ApiPlace => ({
            address: place.address,
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            title: place.query,
            type: 'recent',
        })),
    ].filter((place) => place.latitude != null && place.longitude != null);
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<ApiPlace[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    try {
        const baseUrl = apiBaseUrl();
        const res = await fetch(
            `${baseUrl}/addresses/search?q=${encodeURIComponent(trimmed)}&limit=10`,
            { signal },
        );
        if (res.ok) {
            const spatialResults: SpatialSearchResult[] = await res.json();
            if (Array.isArray(spatialResults) && spatialResults.length > 0) {
                return spatialResults.map((item) => ({
                    address: item.displayName,
                    id: `spatial-${item.communeCode}`,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    title: item.communeName,
                    type: 'recent' as const,
                }));
            }
        }
    } catch (spatialErr) {
        if (signal?.aborted) throw spatialErr;
        console.warn('[Places] Spatial address search failed:', spatialErr);
    }

    return [];
}

export function saveRecentPlace(place: ApiPlace, accessToken: string) {
    return jsonApiRequest('/places/recent-searches', {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        query: place.title,
    }, accessToken);
}
