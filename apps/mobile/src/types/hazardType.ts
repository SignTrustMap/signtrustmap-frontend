export type HazardType =
    | 'SPEED_CHECK'
    | 'POTHOLE'
    | 'ACCIDENT'
    | 'OBSTACLE'
    | 'ROAD_WORK';

export type CreateHazardReportDto = {
    hazardType: HazardType | string;
    latitude: number;
    longitude: number;
    description?: string;
};

export type ConfirmHazardDto = {
    voteType: 'CONFIRM' | 'DISMISS';
    latitude: number;
    longitude: number;
};

export type HazardItem = {
    id: string;
    hazardType: HazardType | string;
    latitude: number;
    longitude: number;
    description?: string | null;
    status: 'REPORTED' | 'CONFIRMED' | 'DISMISSED' | 'EXPIRED' | string;
    confirmationsCount?: number;
    dismissalsCount?: number;
    distanceMeters?: number;
    expiresAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type ListHazardsParams = {
    status?: string;
    lat?: number;
    lon?: number;
    radiusMeters?: number;
    minLat?: number;
    minLon?: number;
    maxLat?: number;
    maxLon?: number;
    page?: number;
    pageSize?: number;
};
