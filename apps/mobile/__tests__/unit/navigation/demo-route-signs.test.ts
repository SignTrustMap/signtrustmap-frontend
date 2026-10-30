import {
  isCrescentMallToBitexcoRoute,
  modifyFirstSignForCarsOnly,
  filterSignsByVehicleType,
  applyDemoRouteSigns,
  CRESCENT_MALL_COORDINATE,
  BITEXCO_COORDINATE,
} from '@/feature/navigation/utils/demo-route-signs';
import type { RouteSign } from '@/api/navigation/navigation';

describe('demo-route-signs utility', () => {
  const mockSigns: RouteSign[] = [
    {
      coordinate: [106.71996, 10.730636],
      id: 'sign-1',
      imageUrl: 'https://example.com/sign1.png',
      name: 'Đường một chiều',
      nameVi: 'Đường một chiều',
      signCode: 'I.407a',
      allowedVehicles: ['CAR', 'MOTORCYCLE', 'BICYCLE', 'PEDESTRIAN'],
    },
    {
      coordinate: [106.71000, 10.750000],
      id: 'sign-2',
      imageUrl: 'https://example.com/sign2.png',
      name: 'Giới hạn tốc độ',
      nameVi: 'Giới hạn tốc độ',
      signCode: 'P.127',
      allowedVehicles: ['CAR', 'MOTORCYCLE'],
    },
  ];

  describe('isCrescentMallToBitexcoRoute', () => {
    it('returns true when coordinates match Crescent Mall to Bitexco within tolerance', () => {
      expect(
        isCrescentMallToBitexcoRoute(CRESCENT_MALL_COORDINATE, BITEXCO_COORDINATE)
      ).toBe(true);
    });

    it('returns false when coordinates belong to a different route', () => {
      const hanoiOrigin: [number, number] = [105.854444, 21.028511];
      const hanoiDest: [number, number] = [105.800000, 21.030000];
      expect(isCrescentMallToBitexcoRoute(hanoiOrigin, hanoiDest)).toBe(false);
    });

    it('returns false when origin or destination is undefined', () => {
      expect(isCrescentMallToBitexcoRoute(undefined, BITEXCO_COORDINATE)).toBe(false);
      expect(isCrescentMallToBitexcoRoute(CRESCENT_MALL_COORDINATE, undefined)).toBe(false);
    });
  });

  describe('modifyFirstSignForCarsOnly', () => {
    it('modifies the first sign to allowedVehicles: [CAR] and appends label suffix', () => {
      const modified = modifyFirstSignForCarsOnly(mockSigns);
      expect(modified[0].allowedVehicles).toEqual(['CAR']);
      expect(modified[0].name).toContain('(Chỉ ô tô)');
      expect(modified[0].nameVi).toContain('(Chỉ ô tô)');

      // Second sign remains untouched
      expect(modified[1].allowedVehicles).toEqual(['CAR', 'MOTORCYCLE']);
      expect(modified[1].name).toBe('Giới hạn tốc độ');
    });

    it('handles empty signs gracefully', () => {
      expect(modifyFirstSignForCarsOnly([])).toEqual([]);
    });
  });

  describe('filterSignsByVehicleType', () => {
    it('keeps signs allowed for CAR when vehicleMode is DRIVING', () => {
      const carOnlySigns: RouteSign[] = [
        { ...mockSigns[0], allowedVehicles: ['CAR'] },
        { ...mockSigns[1], allowedVehicles: ['MOTORCYCLE'] },
      ];
      const filtered = filterSignsByVehicleType(carOnlySigns, 'DRIVING');
      expect(filtered.map((s) => s.id)).toEqual(['sign-1']);
    });

    it('filters out car-only signs when vehicleMode is MOTORCYCLE', () => {
      const carOnlySigns: RouteSign[] = [
        { ...mockSigns[0], allowedVehicles: ['CAR'] },
        { ...mockSigns[1], allowedVehicles: ['MOTORCYCLE'] },
      ];
      const filtered = filterSignsByVehicleType(carOnlySigns, 'MOTORCYCLE');
      expect(filtered.map((s) => s.id)).toEqual(['sign-2']);
    });
  });

  describe('applyDemoRouteSigns', () => {
    it('on Crescent Mall -> Bitexco route: modifies first sign to car-only, visible for DRIVING', () => {
      const result = applyDemoRouteSigns(
        mockSigns,
        CRESCENT_MALL_COORDINATE,
        BITEXCO_COORDINATE,
        'DRIVING'
      );
      // Both signs visible (sign-1 car only, sign-2 car + moto)
      expect(result.length).toBe(2);
      expect(result[0].allowedVehicles).toEqual(['CAR']);
      expect(result[0].name).toContain('(Chỉ ô tô)');
    });

    it('on Crescent Mall -> Bitexco route: filters out first sign when vehicleMode is MOTORCYCLE', () => {
      const result = applyDemoRouteSigns(
        mockSigns,
        CRESCENT_MALL_COORDINATE,
        BITEXCO_COORDINATE,
        'MOTORCYCLE'
      );
      // sign-1 is now car-only, so only sign-2 (which allows motorcycle) remains
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('sign-2');
    });

    it('on unrelated routes: does not modify signs', () => {
      const otherOrigin: [number, number] = [105.854444, 21.028511];
      const otherDest: [number, number] = [105.800000, 21.030000];
      const result = applyDemoRouteSigns(mockSigns, otherOrigin, otherDest, 'MOTORCYCLE');
      // On other routes, sign-1 allows MOTORCYCLE so both remain
      expect(result.length).toBe(2);
      expect(result[0].name).not.toContain('(Chỉ ô tô)');
    });
  });
});
