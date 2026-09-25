export type FindSignsInBoundsParams = {
    /** Latitude in degrees, from -90 to 90. */
    minLat: number;
    /** Longitude in degrees, from -180 to 180. */
    minLon: number;
    /** Latitude in degrees, from -90 to 90. */
    maxLat: number;
    /** Longitude in degrees, from -180 to 180. */
    maxLon: number;
};

export type CreateVerifiedSignDto = {
    /** Minimum: 1. */
    signTypeId: number;
    originCandidateId: string;
    /** Latitude in degrees, from -90 to 90. */
    latitude: number;
    /** Longitude in degrees, from -180 to 180. */
    longitude: number;
    /** Direction in degrees, from 0 to 359.999999. */
    trafficDirection?: number | null;
    /** Length: 1 to 500 characters. */
    signCropUrl: string;
    /** Date-time string. */
    lastVerifiedAt?: string;
};

export type VerifiedSignStatus = 'ACTIVE' | 'STALE' | 'RETIRED' | 'MODERATED_OVERRIDE';

export type UpdateVerifiedSignDto = {
    /** Minimum: 1. */
    signTypeId?: number;
    /** Latitude in degrees, from -90 to 90. */
    latitude?: number;
    /** Longitude in degrees, from -180 to 180. */
    longitude?: number;
    /** Direction in degrees, from 0 to 359.999999. */
    trafficDirection?: number | null;
    /** Length: 1 to 500 characters. */
    signCropUrl?: string;
    /** Date-time string. */
    lastVerifiedAt?: string;
    status?: VerifiedSignStatus;
};

export type RoutePointDto = {
    /** Latitude in degrees, from -90 to 90. */
    latitude: number;
    /** Longitude in degrees, from -180 to 180. */
    longitude: number;
};

export type RouteSignsRequestDto = {
    geometry: RoutePointDto[];
};

// Read response shapes used by the existing navigation API integration.
export type VerifiedMapSign = {
    id: string;
    latitude: number;
    longitude: number;
    signCropUrl: string;
    signType: { nameEn: string; signCode: string };
};

export type FindSignsInBoundsResponse = { signs: VerifiedMapSign[] };
export type FindSignsAlongRouteResponse = { signs: { sign: VerifiedMapSign }[] };

// Write endpoints declare only `type: object` in the supplied schema.
export type CreateVerifiedSignResponse = Record<string, unknown>;
export type UpdateVerifiedSignResponse = Record<string, unknown>;
