import { apiRequest, jsonApiRequest } from '@/services/api-client';

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

type GeocodingResponse = {
    results: {
        displayName: string | null;
        latitude: number;
        longitude: number;
        name: string | null;
        providerPlaceId: number;
    }[];
};

export async function getUserPlaces(accessToken: string): Promise<ApiPlace[]> {
    const [saved, recent] = await Promise.all([
        apiRequest<SavedPlace[]>('/places/saved', {}, accessToken),
        apiRequest<RecentSearch[]>('/places/recent-searches?limit=20', {}, accessToken),
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
    const response = await apiRequest<GeocodingResponse>(
        `/geocoding/search?q=${encodeURIComponent(query)}&limit=8&countryCode=vn`,
        { signal },
    );
    return response.results.map((place) => ({
        address: place.displayName,
        id: `geocoding-${place.providerPlaceId}`,
        latitude: place.latitude,
        longitude: place.longitude,
        title: place.name || place.displayName || query,
        type: 'recent',
    }));
}

export function saveRecentPlace(place: ApiPlace, accessToken: string) {
    return jsonApiRequest('/places/recent-searches', {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        query: place.title,
    }, accessToken);
}
