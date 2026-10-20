export type VehicleModeId = "DRIVING" | "MOTORCYCLE" | "BIKE" | "CYCLING" | "WALKING";

export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "BUS" | "BICYCLE" | "PEDESTRIAN";

export type VehicleMode = { id: VehicleModeId; label: string };

export type MapCoordinate = [longitude: number, latitude: number];

export type PreviousLocation = {
  coordinate: MapCoordinate;
  id: string;
  title: string;
  subtitle: string;
  category: "home" | "work" | "saved" | "recent";
};

export type StartLocation = {
  coordinate: MapCoordinate;
  id: string;
  title: string;
  subtitle: string;
};

export type MapSignMarker = {
  coordinate: MapCoordinate;
  id: string;
  top: `${number}%`;
  left: `${number}%`;
};

/** Request payload for POST /routing/directions & POST /navigation/route-preview */
export type RouteDirectionsRequestDto = {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  vehicleMode?: VehicleModeId;
  _vehicleMode?: string;
  vehicleType?: VehicleType;
  enabledCategoryCodes?: string[];
  alternativeThresholdPercent?: number;
  maxAlternatives?: number;
  snapRadiusMeters?: number;
};

/** Response schema for POST /navigation/route-preview */
export type NavigationRouteDto = {
  geometry: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type NavigationStepDto = {
  type: string;
  instruction: string;
  distanceMeters: number;
};

export type NavigationTrafficSignDto = {
  id: string;
  type: string;
  value?: number;
  lat: number;
  lon: number;
  actualCropUrl?: string;
  scenePhotoUrl?: string;
  routeOffsetMeters: number;
};

export type NavigationResponseDto = {
  route: NavigationRouteDto;
  steps: NavigationStepDto[];
  trafficSigns: NavigationTrafficSignDto[];
};

/** Preferences for GET / PUT /navigation/preferences */
export type NavigationPreferences = {
  vehicleType: VehicleType;
  enabledCategoryCodes: string[];
};

export type UpdateNavigationPreferencesDto = {
  vehicleType?: VehicleType;
  enabledCategoryCodes?: string[];
};

/** Session initiation with credit gate: POST /navigation/sessions/initiate */
export type InitiateNavigationSessionDto = {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  vehicleType?: string;
  idempotencyKey?: string;
};

export type InitiateNavigationSessionResponse = {
  sessionId?: string;
  id?: string;
  creditsDeducted?: number;
  remainingCredits?: number;
  status?: string;
};

export type EndNavigationSessionResponse = {
  sessionId?: string;
  status?: string;
};

export type NavigationSessionItem = {
  id: string;
  userId?: string;
  origin?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  originLatitude?: number;
  originLongitude?: number;
  originName?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationName?: string;
  vehicleType?: string;
  vehicleMode?: string;
  status: string;
  creditsDeducted?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ListNavigationSessionsResponse = {
  items: NavigationSessionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

/** Custom alert profile: POST / PUT / GET /navigation/profiles */
export type CreateAlertProfileDto = {
  name: string;
  description?: string;
  filterRules: Record<string, unknown>;
};

export type CustomAlertProfile = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  filterRules: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NearbySignsQuery = {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  headingDegrees?: number;
};

export type ConfirmSignDto = {
  isPresent: boolean;
  latitude?: number;
  longitude?: number;
  photoEvidenceUrl?: string;
  note?: string;
};

// ── Offline PMTiles Map Packs ───────────────────────────────────────────────

export type OfflineMapPack = {
  id: string;
  name: string;
  description: string;
  region: string;
  countryCode: string;
  format: string;
  fileName: string;
  sizeBytes: number;
  sizeMb: number;
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number];
  isAvailable: boolean;
  lastModified?: string | null;
  downloadUrl: string;
};

export type OfflineMapPacksResponse = {
  packs: OfflineMapPack[];
  total: number;
};

export type OfflinePackDownloadStatus =
  | 'idle'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error';

export type OfflineMapPackDownloadProgress = {
  packId: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  status: OfflinePackDownloadStatus;
  errorMessage?: string;
};

export type InstalledOfflineMapPack = {
  packId: string;
  name: string;
  fileName: string;
  localPath: string;
  fileUri: string;
  sizeBytes: number;
  installedAt: number;
  bounds: [number, number, number, number];
  minZoom: number;
  maxZoom: number;
};

export type OfflineMapStorageMetadata = {
  installedPacks: Record<string, InstalledOfflineMapPack>;
  activePackId: string | null;
};

