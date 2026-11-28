import {
  TARGET_SIGN_IMAGE_URL,
  deduplicateRouteSigns,
  resolveImageUrl,
  resolveRepresentativeSignUrl,
  toRouteSign,
} from '@/feature/navigation/utils/signs';
import {
  formatManeuverDistance,
  formatRouteArrivalTime,
  formatRouteDistanceInKilometers,
  formatRouteDuration,
  formatRouteEstimatedTime,
  formatRouteInstruction,
  formatRouteNavDistance,
  getManeuverSymbol,
} from '@/feature/navigation/utils/navigation-formatters';
import {
  calculateDistanceMeters,
  getRouteForwardBearing,
  isValidCoordinate,
  isWithinDistance,
} from '@/feature/navigation/utils/geo';

describe('Navigation Signs, Formatters & Geo Branch Coverage', () => {
  describe('signs.ts', () => {
    it('resolves representative sign URLs across code, nameEn, and empty inputs', () => {
      expect(TARGET_SIGN_IMAGE_URL).toContain('stm-sign-crops');
      expect(resolveRepresentativeSignUrl('No Entry', ' P.102 ')).toContain('/representative/P.102.svg');
      expect(resolveRepresentativeSignUrl('  Speed Limit 50! ', '')).toContain('/representative/SPEED_LIMIT_50.svg');
      expect(resolveRepresentativeSignUrl('---', '')).toBe('');
      expect(resolveRepresentativeSignUrl(undefined, undefined)).toBe('');
    });

    it('resolves image URLs for mock paths, insecure domains, CDN buckets, external HTTP, and relative keys', () => {
      expect(resolveImageUrl(undefined)).toBe('');
      expect(resolveImageUrl(123 as any)).toBe('');
      expect(resolveImageUrl('mock/sample.jpg')).toBe('');
      expect(resolveImageUrl('mock-crop.jpg')).toBe('');

      expect(resolveImageUrl('http://s3.signmap.site/stm-sign-crops/a.jpg')).toBe(
        'https://s3.signmap.site/stm-sign-crops/a.jpg',
      );
      expect(resolveImageUrl('http://api.signmap.site/img.jpg')).toBe(
        'https://api.signmap.site/img.jpg',
      );
      expect(resolveImageUrl('http://cdn.signmap.site/stm-raw-videos/clip.mp4')).toContain(
        '/stm-raw-videos/clip.mp4',
      );
      expect(resolveImageUrl('https://cdn.signmap.site/folder/sign.png')).toContain(
        '/stm-sign-crops/folder/sign.png',
      );
      expect(resolveImageUrl('https://example.com/custom.png')).toBe('https://example.com/custom.png');
      expect(resolveImageUrl('http://external.local/sign.png')).toBe('http://external.local/sign.png');
      expect(resolveImageUrl('/stm-gpx-logs/track.gpx')).toContain('/stm-gpx-logs/track.gpx');
      expect(resolveImageUrl('/crops/p102.jpg')).toContain('/stm-sign-crops/crops/p102.jpg');
    });

    it('normalizes camelCase and snake_case backend signs via toRouteSign', () => {
      const snake = toRouteSign({
        id: 's1',
        coordinate: [106.7, 10.7],
        sign_type: {
          sign_code: 'P.102',
          name_en: 'No Entry',
          name_vi: 'Cấm đi ngược chiều',
          allowed_vehicles: ['CAR'],
        },
        crop_url: 'crops/s1.jpg',
        best_frame_url: 'frames/f1.jpg',
        freshness_score: 0.9,
        road_name: 'Lê Lợi',
        display_address: 'Q1, HCM',
        last_verified_at: '2026-01-01T00:00:00Z',
        createdAt: 1700000000000,
      });
      expect(snake.signCode).toBe('P.102');
      expect(snake.name).toBe('Cấm đi ngược chiều');
      expect(snake.allowedVehicles).toEqual(['CAR']);
      expect(snake.imageUrl).toContain('P.102.svg');

      const minimal = toRouteSign({
        id: 's2',
        longitude: 106.8,
        latitude: 10.8,
        actualFrameURl: 'frames/f2.jpg',
      });
      expect(minimal.name).toBe('Traffic Sign');
      expect(minimal.imageUrl).toContain('frames/f2.jpg');

      const cropFallback = toRouteSign({
        id: 's3',
        longitude: 106.8,
        latitude: 10.8,
        actual_crop_url: 'crops/only.jpg',
        name_en: '!!!',
      });
      expect(cropFallback.name).toBe('!!!');
      expect(cropFallback.imageUrl).toContain('crops/only.jpg');
    });

    it('deduplicates close signs by distance, code, normalized name, and freshness score', () => {
      expect(deduplicateRouteSigns(undefined as any)).toEqual([]);
      expect(deduplicateRouteSigns([])).toEqual([]);

      const deduped = deduplicateRouteSigns([
        { id: 'invalid', coordinate: null as any, name: 'Bad', imageUrl: '', signCode: '' },
        { id: 'a1', coordinate: [106.7000, 10.7000], name: 'Stop', signCode: 'R.122', freshnessScore: 0.4, imageUrl: '' },
        // <= 5m away with higher score -> replaces a1
        { id: 'a2', coordinate: [106.70001, 10.70001], name: 'Stop', signCode: 'R.122', freshnessScore: 0.9, imageUrl: '' },
        // ~12m away, same code lower score -> skipped
        { id: 'a3', coordinate: [106.7001, 10.7000], name: 'Other', signCode: 'r.122', freshnessScore: 0.1, imageUrl: '' },
        // ~12m away, no matching code, same normalized name -> replaces if higher or keeps
        { id: 'a4', coordinate: [106.70012, 10.7000], name: '', nameVi: 'Stop', signCode: '', freshnessScore: 0.2, imageUrl: '' },
        // ~12m away, different code and name -> kept separately
        { id: 'b1', coordinate: [106.7001, 10.7000], name: 'No Parking', signCode: 'P.130', freshnessScore: 0.8, imageUrl: '' },
        // > 25m away -> kept separately
        { id: 'c1', coordinate: [106.7050, 10.7050], name: 'Stop', signCode: 'R.122', imageUrl: '' },
      ]);

      expect(deduped.map((s) => s.id)).toEqual(['a2', 'b1', 'c1']);
    });
  });

  describe('navigation-formatters.ts', () => {
    it('formats instructions, maneuver symbols, distances, durations, and ETA', () => {
      expect(
        formatRouteInstruction({ instruction: 'Đi thẳng', maneuver: { type: 'depart' }, distance: 100, duration: 10, name: '' }),
      ).toBe('Đi thẳng');

      expect(getManeuverSymbol({ instruction: 'Đến nơi', maneuver: { type: 'arrive' }, distance: 0, duration: 0, name: '' })).toBe('●');
      expect(getManeuverSymbol({ instruction: 'Vào vòng xuyến', maneuver: { type: 'roundabout' }, distance: 0, duration: 0, name: '' })).toBe('↻');
      expect(getManeuverSymbol({ instruction: 'Enter rotary', maneuver: { type: 'rotary' }, distance: 0, duration: 0, name: '' })).toBe('↻');
      expect(getManeuverSymbol({ instruction: 'Rẽ trái', maneuver: { type: 'turn' }, distance: 0, duration: 0, name: '' })).toBe('↖');
      expect(getManeuverSymbol({ instruction: 'Turn left', maneuver: { type: 'turn' }, distance: 0, duration: 0, name: '' })).toBe('↖');
      expect(getManeuverSymbol({ instruction: 'Rẽ phải', maneuver: { type: 'turn' }, distance: 0, duration: 0, name: '' })).toBe('↗');
      expect(getManeuverSymbol({ instruction: 'Quay đầu', maneuver: { type: 'turn' }, distance: 0, duration: 0, name: '' })).toBe('↶');
      expect(getManeuverSymbol({ instruction: 'Tiếp tục đi thẳng', maneuver: { type: 'continue' }, distance: 0, duration: 0, name: '' })).toBe('↑');

      expect(formatManeuverDistance(12)).toBe('Bây giờ');
      expect(formatManeuverDistance(4)).toBe('Bây giờ');
      expect(formatManeuverDistance(124)).toBe('120 m');
      expect(formatManeuverDistance(1500)).toBe('1.5 km');
      expect(formatRouteDistanceInKilometers(2340)).toBe('2.3 km');

      expect(formatRouteDuration(30)).toBe('1 phút');
      expect(formatRouteDuration(3600)).toBe('1 giờ');
      expect(formatRouteDuration(5400)).toBe('1 giờ 30 phút');
      expect(formatRouteEstimatedTime(120)).toBe('2 phút');
      expect(formatRouteEstimatedTime(7200)).toBe('2 giờ');
      expect(formatRouteEstimatedTime(7500)).toBe('2 giờ 5 phút');

      expect(formatRouteNavDistance(350)).toBe('350 m');
      expect(formatRouteNavDistance(1250)).toBe('1,3 km');
      expect(formatRouteArrivalTime(600)).toMatch(/^\d{1,2}:\d{2}$/);
    });
  });

  describe('geo.ts edge cases', () => {
    it('covers forward bearing edge cases and distance guards', () => {
      expect(isValidCoordinate(['bad' as any, 10])).toBe(false);
      expect(isWithinDistance([106.7, 10.7], [106.7, 10.7001], 50)).toBe(true);
      expect(calculateDistanceMeters([106.7, 10.7], [106.7, 10.7])).toBe(0);

      expect(getRouteForwardBearing(undefined, undefined)).toBe(0);
      expect(getRouteForwardBearing(undefined, [[106.7, 10.7]])).toBe(0);
      // Short initial route (< 25m) falls back to first segment
      expect(getRouteForwardBearing(undefined, [[106.7, 10.7], [106.70005, 10.70005]])).toBeGreaterThanOrEqual(0);
      // Coordinate near final vertex uses lookback anchor
      const longRoute: [number, number][] = [
        [106.7000, 10.7000],
        [106.7000, 10.7005],
      ];
      expect(getRouteForwardBearing([106.7000, 10.7005], longRoute)).toBe(0);
      // Short remaining final segment (< 25m after closest point)
      const threePt: [number, number][] = [
        [106.7000, 10.7000],
        [106.7000, 10.7005],
        [106.70005, 10.7005],
      ];
      expect(getRouteForwardBearing([106.7000, 10.70049], threePt)).toBe(90);
    });
  });
});
