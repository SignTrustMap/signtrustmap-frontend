import type {
  FindSignsAlongRouteResponse,
  FindSignsInBoundsResponse,
  VerifiedMapSign,
} from '@/types/signMapType';
import type { VehicleMode } from '@/types/navigationType';

export const mockVehicleModes: VehicleMode[] = [
  { id: 'DRIVING', label: 'Car' },
  { id: 'BIKE', label: 'Bike' },
];

export const mockSavedPlaces = [
  {
    id: 'place-home',
    label: 'Home',
    address: '123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City',
    latitude: 10.7769,
    longitude: 106.7009,
  },
  {
    id: 'place-work',
    label: 'Office',
    address: '2 Hai Trieu, Ben Nghe, District 1, Ho Chi Minh City',
    latitude: 10.771674,
    longitude: 106.704688,
  },
];

export const mockRecentSearches = [
  {
    id: 'recent-1',
    query: 'Bitexco Financial Tower',
    address: '2 Hai Trieu, Ben Nghe, District 1',
    latitude: 10.771674,
    longitude: 106.704688,
  },
  {
    id: 'recent-2',
    query: 'Ben Thanh Market',
    address: 'Le Loi, Ben Thanh, District 1',
    latitude: 10.7725,
    longitude: 106.6980,
  },
];

export const mockSpatialAddresses = [
  {
    communeCode: '79-01-01',
    communeName: 'Nguyen Hue Walking Street',
    displayName: 'Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City',
    latitude: 10.7769,
    longitude: 106.7009,
  },
  {
    communeCode: '79-01-02',
    communeName: 'Le Loi Boulevard',
    displayName: 'Le Loi, Ben Nghe, District 1, Ho Chi Minh City',
    latitude: 10.7745,
    longitude: 106.7015,
  },
];

export const mockDirectionsDriving = {
  shortestPath: {
    distanceMeters: 2450,
    durationSeconds: 420,
    geometry: [
      { latitude: 10.7769, longitude: 106.7009 },
      { latitude: 10.7750, longitude: 106.7020 },
      { latitude: 10.7730, longitude: 106.7035 },
      { latitude: 10.771674, longitude: 106.704688 },
    ],
    steps: [
      {
        distanceMeters: 550,
        durationSeconds: 90,
        geometry: [
          { latitude: 10.7769, longitude: 106.7009 },
          { latitude: 10.7750, longitude: 106.7020 },
        ],
        instruction: 'Head south on Nguyen Hue toward Le Loi',
        roadName: 'Nguyen Hue',
        type: 'depart',
      },
      {
        distanceMeters: 800,
        durationSeconds: 150,
        geometry: [
          { latitude: 10.7750, longitude: 106.7020 },
          { latitude: 10.7730, longitude: 106.7035 },
        ],
        instruction: 'Turn right onto Le Loi',
        roadName: 'Le Loi',
        type: 'turn-right',
      },
      {
        distanceMeters: 1100,
        durationSeconds: 180,
        geometry: [
          { latitude: 10.7730, longitude: 106.7035 },
          { latitude: 10.771674, longitude: 106.704688 },
        ],
        instruction: 'Arrive at Bitexco Financial Tower on your left',
        roadName: 'Hai Trieu',
        type: 'arrive',
      },
    ],
  },
};

export const mockDirectionsBike = {
  shortestPath: {
    distanceMeters: 2300,
    durationSeconds: 310,
    geometry: [
      { latitude: 10.7769, longitude: 106.7009 },
      { latitude: 10.7740, longitude: 106.7025 },
      { latitude: 10.771674, longitude: 106.704688 },
    ],
    steps: [
      {
        distanceMeters: 900,
        durationSeconds: 120,
        geometry: [
          { latitude: 10.7769, longitude: 106.7009 },
          { latitude: 10.7740, longitude: 106.7025 },
        ],
        instruction: 'Cycle south along Nguyen Hue',
        roadName: 'Nguyen Hue',
        type: 'depart',
      },
      {
        distanceMeters: 1400,
        durationSeconds: 190,
        geometry: [
          { latitude: 10.7740, longitude: 106.7025 },
          { latitude: 10.771674, longitude: 106.704688 },
        ],
        instruction: 'Arrive at destination on Hai Trieu',
        roadName: 'Hai Trieu',
        type: 'arrive',
      },
    ],
  },
};

export const mockReroutedDirections = {
  shortestPath: {
    distanceMeters: 1800,
    durationSeconds: 300,
    geometry: [
      { latitude: 10.7800, longitude: 106.7050 },
      { latitude: 10.7750, longitude: 106.7048 },
      { latitude: 10.771674, longitude: 106.704688 },
    ],
    steps: [
      {
        distanceMeters: 600,
        durationSeconds: 100,
        geometry: [
          { latitude: 10.7800, longitude: 106.7050 },
          { latitude: 10.7750, longitude: 106.7048 },
        ],
        instruction: 'Rerouting: Head south on Dong Khoi',
        roadName: 'Dong Khoi',
        type: 'depart',
      },
      {
        distanceMeters: 1200,
        durationSeconds: 200,
        geometry: [
          { latitude: 10.7750, longitude: 106.7048 },
          { latitude: 10.771674, longitude: 106.704688 },
        ],
        instruction: 'Continue to Bitexco Financial Tower',
        roadName: 'Hai Trieu',
        type: 'arrive',
      },
    ],
  },
};

export const mockTrafficSigns: VerifiedMapSign[] = [
  {
    id: 'sign-speed-50',
    latitude: 10.7750,
    longitude: 106.7020,
    signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-speed-50.jpg',
    signType: {
      signCode: 'P.127',
      nameEn: 'Maximum speed limit 50 km/h',
      nameVi: 'Tốc độ tối đa cho phép 50 km/h',
    },
    status: 'ACTIVE',
    freshnessScore: 0.95,
    roadName: 'Nguyen Hue',
    displayAddress: 'Nguyen Hue, District 1',
  },
  {
    id: 'sign-pedestrian',
    latitude: 10.7730,
    longitude: 106.7035,
    signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-pedestrian.jpg',
    signType: {
      signCode: 'W.224',
      nameEn: 'Pedestrian crossing',
      nameVi: 'Đường người đi bộ sang đường',
    },
    status: 'ACTIVE',
    freshnessScore: 0.88,
    roadName: 'Le Loi',
    displayAddress: 'Le Loi, District 1',
  },
];

export const mockSignsInBoundsResponse: FindSignsInBoundsResponse = {
  signs: mockTrafficSigns,
};

export const mockSignsAlongRouteResponse: FindSignsAlongRouteResponse = {
  signs: mockTrafficSigns.map((sign) => ({ sign })),
};
