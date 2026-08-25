export type NavigationCoordinate = {
  latitude: number;
  longitude: number;
};

export type SnappedNavigationCoordinate = NavigationCoordinate & {
  distanceMeters: number;
  nodeId: number | null;
};

export type NavigationRouteStep = {
  distanceMeters: number;
  durationSeconds: number;
  edgeId: number | null;
  fromNodeId: number | null;
  geometry: NavigationCoordinate[];
  roadClass: string;
  roadName: string | null;
  toNodeId: number | null;
};

export type NavigationRoutePath = {
  distanceMeters: number;
  distanceRatioToShortest: number;
  durationSeconds: number;
  edgeIds: number[];
  geometry: NavigationCoordinate[];
  nodeIds: number[];
  primary: boolean;
  rank: number;
  recommendation: string;
  steps: NavigationRouteStep[];
};

export type NavigationResponse = {
  alternatives: NavigationRoutePath[];
  destination: NavigationCoordinate;
  origin: NavigationCoordinate;
  shortestPath: NavigationRoutePath;
  snappedDestination: SnappedNavigationCoordinate;
  snappedOrigin: SnappedNavigationCoordinate;
};
