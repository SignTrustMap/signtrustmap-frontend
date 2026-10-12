import type { SignFilterPreset } from '@/context/sign-filter-provider';

describe('Saved Route Presets Route Matching Logic', () => {
  const matchingSrPreset: SignFilterPreset = {
    id: 'preset-1',
    name: 'Phường Tân Mỹ ➔ Hẻm 62C Bà Hom',
    categories: ['WARNING', 'MANDATORY'],
    onlyFixedSigns: true,
    createdAt: Date.now(),
    savedRoute: {
      id: 'sr-1',
      userId: 'user-1',
      title: 'Phường Tân Mỹ ➔ Hẻm 62C Bà Hom',
      vehicleMode: 'MOTORCYCLE',
      originName: 'Phường Tân Mỹ',
      originLatitude: 10.74,
      originLongitude: 106.72,
      destinationName: 'Hẻm 62C Bà Hom',
      destinationLatitude: 10.76,
      destinationLongitude: 106.63,
      distanceMeters: 13200,
      durationSeconds: 960,
      encodedPolyline: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  const unrelatedPreset: SignFilterPreset = {
    id: 'preset-2',
    name: 'Crescent Mall ➔ Landmark 81',
    categories: ['WARNING'],
    onlyFixedSigns: true,
    createdAt: Date.now(),
    savedRoute: {
      id: 'sr-2',
      userId: 'user-1',
      title: 'Crescent Mall ➔ Landmark 81',
      vehicleMode: 'DRIVING',
      originName: 'Crescent Mall',
      originLatitude: 10.729,
      originLongitude: 106.721,
      destinationName: 'Landmark 81',
      destinationLatitude: 10.795,
      destinationLongitude: 106.722,
      distanceMeters: 9000,
      durationSeconds: 1200,
      encodedPolyline: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  const isPresetMatchingCurrentRoute = (
    preset: SignFilterPreset,
    plannedRouteOrigin: [number, number] | undefined,
    selectedDest: { coordinate: [number, number]; title: string } | undefined,
    activeSavedRouteId?: string,
    routeStartTitle?: string
  ): boolean => {
    if (!plannedRouteOrigin || !selectedDest) return false;

    if (
      activeSavedRouteId &&
      (preset.id === activeSavedRouteId || preset.savedRoute?.id === activeSavedRouteId)
    ) {
      return true;
    }

    const sr = preset.savedRoute;
    if (!sr) return false;

    const [currOriginLng, currOriginLat] = plannedRouteOrigin;
    const [currDestLng, currDestLat] = selectedDest.coordinate;

    const originDiff =
      Math.abs(sr.originLatitude - currOriginLat) +
      Math.abs(sr.originLongitude - currOriginLng);
    const destDiff =
      Math.abs(sr.destinationLatitude - currDestLat) +
      Math.abs(sr.destinationLongitude - currDestLng);

    if (originDiff < 0.003 && destDiff < 0.003) {
      return true;
    }

    const norm = (s?: string) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[,\-–—.]/g, ' ')
        .replace(/\s+/g, ' ');

    const srOrigin = norm(sr.originName);
    const srDest = norm(sr.destinationName);
    const currOrigin = norm(routeStartTitle);
    const currDest = norm(selectedDest.title);

    if (
      srOrigin.length > 2 &&
      srDest.length > 2 &&
      currOrigin.length > 2 &&
      currDest.length > 2 &&
      (srOrigin === currOrigin || currOrigin.includes(srOrigin) || srOrigin.includes(currOrigin)) &&
      (srDest === currDest || currDest.includes(srDest) || srDest.includes(currDest))
    ) {
      return true;
    }

    return false;
  };

  it('matches preset by ID when route was opened from wishlist / saved route', () => {
    const isMatch = isPresetMatchingCurrentRoute(
      matchingSrPreset,
      [106.72, 10.74],
      { coordinate: [106.63, 10.76], title: 'Hẻm 62C Bà Hom' },
      'preset-1'
    );
    expect(isMatch).toBe(true);
  });

  it('matches preset by coordinate proximity when coordinates are within threshold', () => {
    const isMatch = isPresetMatchingCurrentRoute(
      matchingSrPreset,
      [106.7201, 10.7402],
      { coordinate: [106.6301, 10.7601], title: 'Điểm đến khác tên' },
      undefined
    );
    expect(isMatch).toBe(true);
  });

  it('matches preset by origin & destination names fallback when coordinates slightly differ', () => {
    const isMatch = isPresetMatchingCurrentRoute(
      matchingSrPreset,
      [106.8, 10.8],
      { coordinate: [106.9, 10.9], title: 'Hẻm 62C Bà Hom' },
      undefined,
      'Phường Tân Mỹ'
    );
    expect(isMatch).toBe(true);
  });

  it('filters out unrelated preset whose origin or destination do not match', () => {
    const isMatch = isPresetMatchingCurrentRoute(
      unrelatedPreset,
      [106.72, 10.74],
      { coordinate: [106.63, 10.76], title: 'Hẻm 62C Bà Hom' },
      undefined,
      'Phường Tân Mỹ'
    );
    expect(isMatch).toBe(false);
  });
});
