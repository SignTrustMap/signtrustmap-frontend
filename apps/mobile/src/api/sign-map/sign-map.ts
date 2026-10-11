import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';
import type {
    CreateVerifiedSignDto,
    CreateVerifiedSignResponse,
    FindSignsAlongRouteResponse,
    FindSignsInBoundsParams,
    FindSignsInBoundsResponse,
    RouteSignsRequestDto,
    UpdateVerifiedSignDto,
    UpdateVerifiedSignResponse,
} from '@/types/signMapType';

export function getSignsInBounds(
    bounds: FindSignsInBoundsParams,
    signal?: AbortSignal,
): Promise<FindSignsInBoundsResponse> {
    const params = new URLSearchParams({
        minLat: String(bounds.minLat),
        minLon: String(bounds.minLon),
        maxLat: String(bounds.maxLat),
        maxLon: String(bounds.maxLon),
    });

    return apiRequest<FindSignsInBoundsResponse>(`${API_PATHS.SIGNS}?${params}`, { signal });
}

/** Requires a Staff/Admin bearer token. */
export function createVerifiedSign(
    request: CreateVerifiedSignDto,
    accessToken: string,
    signal?: AbortSignal,
): Promise<CreateVerifiedSignResponse> {
    return jsonApiRequest<CreateVerifiedSignResponse>(
        API_PATHS.SIGNS,
        request,
        accessToken,
        signal,
    );
}

export async function getSignsAlongRoute(
    request: RouteSignsRequestDto,
    signal?: AbortSignal,
): Promise<FindSignsAlongRouteResponse> {
    return jsonApiRequest<FindSignsAlongRouteResponse>(
        API_PATHS.SIGNS_ALONG_ROUTE,
        request,
        undefined,
        signal,
    );
}

/** Requires a Staff/Admin bearer token. */
export function updateVerifiedSign(
    id: string,
    request: UpdateVerifiedSignDto,
    accessToken: string,
    signal?: AbortSignal,
): Promise<UpdateVerifiedSignResponse> {
    return apiRequest<UpdateVerifiedSignResponse>(
        `${API_PATHS.SIGNS}/${encodeURIComponent(id)}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
            signal,
        },
        accessToken,
    );
}

/** Query verified signs near GPS location with distance and optional heading filter */
export function getNearbySignCandidates(
    params: {
        latitude: number;
        longitude: number;
        radiusMeters?: number;
        headingDegrees?: number;
    },
    signal?: AbortSignal,
): Promise<FindSignsInBoundsResponse> {
    const searchParams = new URLSearchParams({
        latitude: String(params.latitude),
        longitude: String(params.longitude),
        ...(params.radiusMeters != null ? { radiusMeters: String(params.radiusMeters) } : {}),
        ...(params.headingDegrees != null ? { headingDegrees: String(params.headingDegrees) } : {}),
    });
    return apiRequest<FindSignsInBoundsResponse>(
        `${API_PATHS.SIGNS_NEARBY_CANDIDATES}?${searchParams}`,
        { signal },
    );
}

/** Submit driver or surveyor verification confirming or reporting missing a verified sign */
export function confirmSignPresence(
    id: string,
    body: {
        isPresent: boolean;
        latitude?: number;
        longitude?: number;
        photoEvidenceUrl?: string;
        note?: string;
    },
    accessToken: string,
    signal?: AbortSignal,
): Promise<{ success: boolean; message?: string }> {
    return jsonApiRequest<{ success: boolean; message?: string }>(
        `${API_PATHS.SIGNS}/${encodeURIComponent(id)}/confirm`,
        body,
        accessToken,
        signal,
        'POST',
    );
}


