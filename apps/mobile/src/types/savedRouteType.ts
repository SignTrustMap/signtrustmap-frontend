import type { SignCategory } from '@/constants/sign-categories';

export interface RouteFilterRulesDto {
  onlyFixedSigns?: boolean;
  categories?: string[];
}

export interface SavedRoute {
  id: string;
  userId: string;
  title: string;
  vehicleMode: string;
  originName: string;
  originLatitude: number;
  originLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  waypoints?: Array<{ latitude: number; longitude: number; name?: string }>;
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  filterRules?: RouteFilterRulesDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedRouteDto {
  title: string;
  vehicleMode?: string;
  originName: string;
  originLatitude: number;
  originLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  waypoints?: Array<{ latitude: number; longitude: number; name?: string }>;
  distanceMeters?: number;
  durationSeconds?: number;
  encodedPolyline?: string;
  filterRules?: RouteFilterRulesDto;
}

export interface UpdateSavedRouteDto {
  title?: string;
  vehicleMode?: string;
  filterRules?: RouteFilterRulesDto;
}

export interface SavedRouteSignsResponse {
  routeId: string;
  routeTitle: string;
  vehicleMode: string;
  distanceMeters: number;
  signCount: number;
  signs: any[];
}

export function categoryToCode(cat: SignCategory): string {
  switch (cat) {
    case 'PROHIBITORY':
      return 'P';
    case 'WARNING':
      return 'W';
    case 'MANDATORY':
      return 'R';
    case 'INFORMATION':
      return 'I';
    case 'TEMPORARY':
      return 'TEMPORARY';
    default:
      return cat;
  }
}

export function codeToCategory(code: string): SignCategory {
  const norm = (code || '').toUpperCase().trim();
  if (norm === 'P' || norm === 'PROHIBITORY' || norm === 'PROHIBITION') return 'PROHIBITORY';
  if (norm === 'W' || norm === 'WARNING') return 'WARNING';
  if (norm === 'R' || norm === 'MANDATORY') return 'MANDATORY';
  if (norm === 'I' || norm === 'INFORMATION' || norm === 'INFO' || norm === 'GUIDE') return 'INFORMATION';
  if (norm === 'TEMPORARY') return 'TEMPORARY';
  return 'WARNING';
}
