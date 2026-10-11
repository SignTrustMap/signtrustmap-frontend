import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';
import type {
    ConfirmHazardDto,
    CreateHazardReportDto,
    HazardItem,
    ListHazardsParams,
} from '@/types/hazardType';

/** Report a roadside hazard (speed trap, accident, pothole, road work): POST /hazards/report */
export async function reportHazard(
    dto: CreateHazardReportDto,
    accessToken?: string,
    signal?: AbortSignal,
): Promise<{ success: boolean; id?: string; message?: string }> {
    return jsonApiRequest<{ success: boolean; id?: string; message?: string }>(
        API_PATHS.HAZARDS_REPORT,
        dto,
        accessToken,
        signal,
        'POST',
    );
}

/** Vote to confirm or dismiss an active roadside hazard: POST /hazards/:id/confirm */
export async function confirmHazard(
    id: string,
    dto: ConfirmHazardDto,
    accessToken?: string,
    signal?: AbortSignal,
): Promise<{ success: boolean; message?: string }> {
    return jsonApiRequest<{ success: boolean; message?: string }>(
        `${API_PATHS.HAZARDS}/${encodeURIComponent(id)}/confirm`,
        dto,
        accessToken,
        signal,
        'POST',
    );
}

/** Retrieve active unexpired hazards filtered by bounding box or proximity radius: GET /hazards */
export async function listHazards(
    params: ListHazardsParams = {},
    signal?: AbortSignal,
): Promise<HazardItem[]> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.lat != null) searchParams.set('lat', String(params.lat));
    if (params.lon != null) searchParams.set('lon', String(params.lon));
    if (params.radiusMeters != null) searchParams.set('radiusMeters', String(params.radiusMeters));
    if (params.minLat != null) searchParams.set('minLat', String(params.minLat));
    if (params.minLon != null) searchParams.set('minLon', String(params.minLon));
    if (params.maxLat != null) searchParams.set('maxLat', String(params.maxLat));
    if (params.maxLon != null) searchParams.set('maxLon', String(params.maxLon));
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.pageSize != null) searchParams.set('pageSize', String(params.pageSize));

    const qs = searchParams.toString();
    const url = qs ? `${API_PATHS.HAZARDS}?${qs}` : API_PATHS.HAZARDS;
    return apiRequest<HazardItem[]>(url, { signal });
}

/** Fetch detailed verification status and coordinates of a roadside hazard: GET /hazards/:id */
export async function getHazard(
    id: string,
    signal?: AbortSignal,
): Promise<HazardItem> {
    return apiRequest<HazardItem>(
        `${API_PATHS.HAZARDS}/${encodeURIComponent(id)}`,
        { signal },
    );
}
