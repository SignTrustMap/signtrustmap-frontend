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

export function getSignsAlongRoute(
    request: RouteSignsRequestDto,
    signal?: AbortSignal,
): Promise<FindSignsAlongRouteResponse> {
    const res = jsonApiRequest<FindSignsAlongRouteResponse>(
        API_PATHS.SIGNS_ALONG_ROUTE,
        request,
        undefined,
        signal,
    );

    console.log('getSignsAlongRoute', res);
    return res;
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

export interface ConfirmSignDto {
    isPresent: boolean;
    latitude?: number;
    longitude?: number;
    note?: string;
}

export interface ConfirmSignResponse {
    signId: string;
    isPresent: boolean;
    creditsAwarded: number;
    cooldownActive: boolean;
    message: string;
    revalidationTaskId?: string;
}

export function confirmVerifiedSign(
    id: string,
    data: ConfirmSignDto,
    accessToken?: string,
    signal?: AbortSignal,
): Promise<ConfirmSignResponse> {
    return jsonApiRequest<ConfirmSignResponse>(
        `${API_PATHS.SIGNS}/${encodeURIComponent(id)}/confirm`,
        data,
        accessToken,
        signal,
        'POST',
    );
}


