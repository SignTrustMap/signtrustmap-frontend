import { http, HttpResponse } from 'msw';
import {
  mockDirectionsBike,
  mockDirectionsDriving,
  mockRecentSearches,
  mockSavedPlaces,
  mockSignsAlongRouteResponse,
  mockSignsInBoundsResponse,
  mockSpatialAddresses,
  mockVehicleModes,
} from '../fixtures/navigation.fixtures';

export const NAVIGATION_ROUTING_PATH = '*/api/v1/routing/directions';
export const VEHICLE_MODES_PATH = '*/api/v1/routing/vehicle-modes';
export const SAVED_PLACES_PATH = '*/api/v1/places/saved';
export const RECENT_SEARCHES_PATH = '*/api/v1/places/recent-searches*';
export const POST_RECENT_SEARCHES_PATH = '*/api/v1/places/recent-searches';
export const ADDRESSES_SEARCH_PATH = '*/api/v1/addresses/search*';
export const SIGNS_PATH = '*/api/v1/signs*';
export const SIGNS_ALONG_ROUTE_PATH = '*/api/v1/signs/along-route';
export const WALLET_PATH = '*/api/v1/wallet*';

export const navigationHandlers = [
  http.get(WALLET_PATH, () => {
    return HttpResponse.json({ balance: 100, pendingReward: 10 }, { status: 200 });
  }),

  // 1. POST /routing/directions
  http.post(NAVIGATION_ROUTING_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    // Inspect origin or parameters
    if (body.vehicleMode === 'BIKE' || body.vehicleType === 'MOTORCYCLE' || body.vehicleMode === 'MOTORCYCLE') {
      return HttpResponse.json(mockDirectionsBike, { status: 200 });
    }
    return HttpResponse.json(mockDirectionsDriving, { status: 200 });
  }),

  // 2. GET /routing/vehicle-modes
  http.get(VEHICLE_MODES_PATH, () => {
    return HttpResponse.json({ modes: mockVehicleModes }, { status: 200 });
  }),

  // 3. GET /places/saved
  http.get(SAVED_PLACES_PATH, () => {
    return HttpResponse.json(mockSavedPlaces, { status: 200 });
  }),

  // 4. GET /places/recent-searches
  http.get(RECENT_SEARCHES_PATH, () => {
    return HttpResponse.json(mockRecentSearches, { status: 200 });
  }),

  // 5. POST /places/recent-searches
  http.post(POST_RECENT_SEARCHES_PATH, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ success: true, item: body }, { status: 201 });
  }),

  // 6. GET /addresses/search
  http.get(ADDRESSES_SEARCH_PATH, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() ?? '';
    const filtered = mockSpatialAddresses.filter(
      (item) =>
        item.communeName.toLowerCase().includes(query) ||
        item.displayName.toLowerCase().includes(query),
    );
    return HttpResponse.json(filtered.length > 0 ? filtered : mockSpatialAddresses, {
      status: 200,
    });
  }),

  // 7. GET /signs
  http.get(SIGNS_PATH, () => {
    return HttpResponse.json(mockSignsInBoundsResponse, { status: 200 });
  }),

  // 8. POST /signs/along-route
  http.post(SIGNS_ALONG_ROUTE_PATH, () => {
    return HttpResponse.json(mockSignsAlongRouteResponse, { status: 200 });
  }),

  // 9. Photon fallback
  http.get('https://photon.komoot.io/api/*', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    return HttpResponse.json(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [106.7009, 10.7769],
            },
            properties: {
              osm_id: 12345,
              name: q ? `${q} Center` : 'Nguyen Hue Street',
              street: 'Nguyen Hue',
              city: 'Ho Chi Minh City',
              country: 'Vietnam',
            },
          },
        ],
      },
      { status: 200 },
    );
  }),

  // 10. Nominatim fallback
  http.get('https://nominatim.openstreetmap.org/search*', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    return HttpResponse.json(
      [
        {
          place_id: 67890,
          lat: '10.7769',
          lon: '106.7009',
          display_name: `${q}, Ben Nghe, District 1, Ho Chi Minh City`,
          name: q || 'Landmark',
        },
      ],
      { status: 200 },
    );
  }),

  // 11. Saved Routes: GET /saved-routes/:id/signs
  http.get('*/api/v1/saved-routes/:id/signs', ({ params }) => {
    return HttpResponse.json(
      {
        routeId: params.id,
        routeTitle: 'Lộ trình mẫu',
        vehicleMode: 'MOTORCYCLE',
        distanceMeters: 5200,
        signCount: mockSignsAlongRouteResponse.signs?.length ?? 0,
        signs: mockSignsAlongRouteResponse.signs ?? [],
      },
      { status: 200 }
    );
  }),

  // 12. Saved Routes: GET /saved-routes/:id
  http.get('*/api/v1/saved-routes/:id', ({ params }) => {
    return HttpResponse.json(
      {
        id: params.id || 'mock-saved-route-1',
        userId: 'user-123',
        title: 'Đi làm hàng ngày',
        vehicleMode: 'MOTORCYCLE',
        originName: 'Nhà riêng',
        originLatitude: 10.7769,
        originLongitude: 106.7009,
        destinationName: 'Công ty',
        destinationLatitude: 10.85,
        destinationLongitude: 106.772,
        distanceMeters: 5200,
        durationSeconds: 900,
        encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        filterRules: {
          onlyFixedSigns: true,
          categories: ['P', 'W', 'R'],
        },
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-01T08:00:00Z',
      },
      { status: 200 }
    );
  }),

  // 13. Saved Routes: GET /saved-routes
  http.get('*/api/v1/saved-routes', () => {
    return HttpResponse.json(
      [
        {
          id: 'mock-saved-route-1',
          userId: 'user-123',
          title: 'Đi làm hàng ngày',
          vehicleMode: 'MOTORCYCLE',
          originName: 'Nhà riêng',
          originLatitude: 10.7769,
          originLongitude: 106.7009,
          destinationName: 'Công ty',
          destinationLatitude: 10.85,
          destinationLongitude: 106.772,
          distanceMeters: 5200,
          durationSeconds: 900,
          encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          filterRules: {
            onlyFixedSigns: true,
            categories: ['P', 'W', 'R'],
          },
          createdAt: '2026-03-01T08:00:00Z',
          updatedAt: '2026-03-01T08:00:00Z',
        },
      ],
      { status: 200 }
    );
  }),

  // 14. Saved Routes: POST /saved-routes
  http.post('*/api/v1/saved-routes', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        id: `mock-saved-route-${Date.now()}`,
        userId: 'user-123',
        title: body.title || 'Lộ trình mới',
        vehicleMode: body.vehicleMode || 'MOTORCYCLE',
        originName: body.originName || 'Điểm xuất phát',
        originLatitude: body.originLatitude || 10.7769,
        originLongitude: body.originLongitude || 106.7009,
        destinationName: body.destinationName || 'Điểm đến',
        destinationLatitude: body.destinationLatitude || 10.85,
        destinationLongitude: body.destinationLongitude || 106.772,
        distanceMeters: body.distanceMeters || 5000,
        durationSeconds: body.durationSeconds || 850,
        encodedPolyline: body.encodedPolyline || '',
        filterRules: body.filterRules || { onlyFixedSigns: true, categories: ['P', 'W', 'R'] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // 15. Saved Routes: PATCH /saved-routes/:id
  http.patch('*/api/v1/saved-routes/:id', async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        id: params.id || 'mock-saved-route-1',
        userId: 'user-123',
        title: body.title || 'Lộ trình cập nhật',
        vehicleMode: body.vehicleMode || 'MOTORCYCLE',
        originName: 'Nhà riêng',
        originLatitude: 10.7769,
        originLongitude: 106.7009,
        destinationName: 'Công ty',
        destinationLatitude: 10.85,
        destinationLongitude: 106.772,
        distanceMeters: 5200,
        durationSeconds: 900,
        encodedPolyline: '',
        filterRules: body.filterRules || { onlyFixedSigns: true, categories: ['P', 'W', 'R'] },
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  // 16. Saved Routes: DELETE /saved-routes/:id
  http.delete('*/api/v1/saved-routes/:id', ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id || 'mock-saved-route-1' }, { status: 200 });
  }),
];
