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

type GeocodingResponse = {
    results: {
        displayName: string | null;
        latitude: number;
        longitude: number;
        name: string | null;
        providerPlaceId: number;
    }[];
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

/**
 * Search places using Photon OSM geocoder (open-source Elasticsearch OSM index).
 * Fast, typo-tolerant autocomplete for Vietnamese addresses and POIs without rate-limits or 502s.
 */
async function searchPlacesViaPhoton(query: string, signal?: AbortSignal): Promise<ApiPlace[]> {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Photon returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.features)) return [];

    return data.features
        .filter((f: any) => f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates))
        .map((f: any, idx: number) => {
            const props = f.properties || {};
            const streetLine = props.housenumber
                ? `${props.housenumber} ${props.street || ''}`.trim()
                : (props.street || null);
            const addressParts = [
                streetLine,
                props.locality,
                props.district,
                props.city,
                props.state,
                props.country,
            ].filter(Boolean);

            const title = props.name || streetLine || query;
            const address = addressParts.join(', ') || null;

            return {
                address,
                id: `photon-${props.osm_id || idx}`,
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0],
                title,
                type: 'recent' as const,
            };
        });
}

/**
 * Fallback to direct Nominatim OSM search if Photon is unavailable.
 */
async function searchPlacesViaNominatim(query: string, signal?: AbortSignal): Promise<ApiPlace[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&dedupe=1&q=${encodeURIComponent(query)}&limit=8&countrycodes=vn`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'SignTrustMap/0.1 (mobile)' },
        signal,
    });
    if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
        .filter((item: any) => item.lat != null && item.lon != null)
        .map((item: any) => ({
            address: item.display_name || null,
            id: `nominatim-${item.place_id}`,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            title: item.name || (item.display_name ? item.display_name.split(',')[0] : query),
            type: 'recent' as const,
        }));
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<ApiPlace[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    // 1. Primary: Fast Photon OSM geocoder (avoids upstream 502/rate-limit blocks)
    try {
        const photonResults = await searchPlacesViaPhoton(trimmed, signal);
        if (photonResults.length > 0) {
            return photonResults;
        }
    } catch (photonErr) {
        if (signal?.aborted) throw photonErr;
        console.warn('[Places] Photon geocoding failed, trying fallback:', photonErr);
    }

    // 2. Secondary fallback: Direct OpenStreetMap Nominatim
    try {
        const nominatimResults = await searchPlacesViaNominatim(trimmed, signal);
        if (nominatimResults.length > 0) {
            return nominatimResults;
        }
    } catch (nomErr) {
        if (signal?.aborted) throw nomErr;
        console.warn('[Places] Nominatim geocoding failed, trying backend:', nomErr);
    }

    // 3. Final fallback: Backend /geocoding/search endpoint via safe fetch
    try {
        const baseUrl = apiBaseUrl();
        const res = await fetch(
            `${baseUrl}/geocoding/search?q=${encodeURIComponent(trimmed)}&limit=8&countryCode=vn`,
            { signal },
        );
        if (res.ok) {
            const data: GeocodingResponse = await res.json();
            if (Array.isArray(data?.results)) {
                return data.results.map((place) => ({
                    address: place.displayName,
                    id: `geocoding-${place.providerPlaceId}`,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    title: place.name || place.displayName || trimmed,
                    type: 'recent' as const,
                }));
            }
        }
    } catch (backendErr) {
        if (signal?.aborted) throw backendErr;
        console.warn('[Places] Backend geocoding search failed:', backendErr);
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
