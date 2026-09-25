import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';

describe('extractImageGpsCoordinates', () => {
  // Ho Chi Minh City approximate coordinates
  const EXPECTED_LAT = 10.756;
  const EXPECTED_LON = 106.632;
  const PRECISION = 3;

  describe('returns null for missing or empty input', () => {
    it('returns null for null exif', () => {
      expect(extractImageGpsCoordinates(null)).toBeNull();
    });

    it('returns null for undefined exif', () => {
      expect(extractImageGpsCoordinates(undefined)).toBeNull();
    });

    it('returns null when GPS fields are absent', () => {
      expect(extractImageGpsCoordinates({ Make: 'Canon' })).toBeNull();
    });

    it('returns null for (0, 0) with no reference', () => {
      expect(
        extractImageGpsCoordinates({ GPSLatitude: 0, GPSLongitude: 0 }),
      ).toBeNull();
    });
  });

  describe('decimal degree values', () => {
    it('parses plain decimal number fields', () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: 10.756,
        GPSLongitude: 106.632,
      });
      expect(result?.latitude).toBeCloseTo(10.756, PRECISION);
      expect(result?.longitude).toBeCloseTo(106.632, PRECISION);
    });

    it('parses decimal degree strings', () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: '10.756',
        GPSLongitude: '106.632',
      });
      expect(result?.latitude).toBeCloseTo(10.756, PRECISION);
      expect(result?.longitude).toBeCloseTo(106.632, PRECISION);
    });
  });

  describe('rational (numerator/denominator) values', () => {
    it('parses rational strings', () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: '1075600/100000',
        GPSLongitude: '10663200/100000',
      });
      expect(result?.latitude).toBeCloseTo(10.756, PRECISION);
      expect(result?.longitude).toBeCloseTo(106.632, PRECISION);
    });
  });

  describe('DMS array values', () => {
    it('parses [degrees, minutes, seconds] number arrays', () => {
      // 10°45'21.6" N  →  10 + 45/60 + 21.6/3600 ≈ 10.7560
      // 106°37'55.2" E → 106 + 37/60 + 55.2/3600 ≈ 106.6320
      const result = extractImageGpsCoordinates({
        GPSLatitude: [10, 45, 21.6],
        GPSLongitude: [106, 37, 55.2],
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'E',
      });
      expect(result?.latitude).toBeCloseTo(EXPECTED_LAT, PRECISION);
      expect(result?.longitude).toBeCloseTo(EXPECTED_LON, PRECISION);
    });

    it('parses [degrees, minutes, seconds] rational-string arrays', () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: ['10/1', '45/1', '216/10'],
        GPSLongitude: ['106/1', '37/1', '552/10'],
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'E',
      });
      expect(result?.latitude).toBeCloseTo(EXPECTED_LAT, PRECISION);
      expect(result?.longitude).toBeCloseTo(EXPECTED_LON, PRECISION);
    });
  });

  describe('DMS string values', () => {
    it("parses degree-symbol delimited DMS strings (10°45'21.6\")", () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: "10°45'21.6\"",
        GPSLongitude: "106°37'55.2\"",
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'E',
      });
      expect(result?.latitude).toBeCloseTo(EXPECTED_LAT, PRECISION);
      expect(result?.longitude).toBeCloseTo(EXPECTED_LON, PRECISION);
    });

    it('parses semicolon-delimited DMS strings (dashcam EXIF format)', () => {
      // Format observed from dashcam-recorded videos:
      // Latitude:  "10; 45; 21.4676000000034151"
      // Longitude: "106; 37; 49.52159999997780365"
      const result = extractImageGpsCoordinates({
        GPSLatitude: '10; 45; 21.4676000000034151',
        GPSLongitude: '106; 37; 49.52159999997780365',
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'E',
      });
      expect(result).not.toBeNull();
      // 10 + 45/60 + 21.4676.../3600 ≈ 10.7560
      expect(result?.latitude).toBeCloseTo(10.756, 2);
      // 106 + 37/60 + 49.5216.../3600 ≈ 106.630
      expect(result?.longitude).toBeCloseTo(106.63, 2);
    });

    it('applies S/W references to negate values', () => {
      const result = extractImageGpsCoordinates({
        GPSLatitude: '10; 45; 21.4676000000034151',
        GPSLongitude: '106; 37; 49.52159999997780365',
        GPSLatitudeRef: 'S',
        GPSLongitudeRef: 'W',
      });
      expect(result?.latitude).toBeLessThan(0);
      expect(result?.longitude).toBeLessThan(0);
    });
  });

  describe('nested GPS sub-record ({GPS} key)', () => {
    it('reads from a nested {GPS} object', () => {
      const result = extractImageGpsCoordinates({
        '{GPS}': {
          GPSLatitude: '10; 45; 21.4676000000034151',
          GPSLongitude: '106; 37; 49.52159999997780365',
          GPSLatitudeRef: 'N',
          GPSLongitudeRef: 'E',
        },
      });
      expect(result).not.toBeNull();
      expect(result?.latitude).toBeCloseTo(10.756, 2);
      expect(result?.longitude).toBeCloseTo(106.63, 2);
    });
  });

  describe('bounds validation', () => {
    it('returns null when latitude exceeds 90', () => {
      expect(
        extractImageGpsCoordinates({ GPSLatitude: 91, GPSLongitude: 10 }),
      ).toBeNull();
    });

    it('returns null when longitude exceeds 180', () => {
      expect(
        extractImageGpsCoordinates({ GPSLatitude: 10, GPSLongitude: 181 }),
      ).toBeNull();
    });
  });
});
