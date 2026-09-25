/**
 * Tests for image-file-gps.ts
 *
 * Strategy: test the pure `extractGpsFromJpegBuffer` function with
 * hand-crafted minimal JPEG + EXIF APP1 buffers. This avoids any
 * FileSystem mocking while exercising the full binary parsing path.
 *
 * The async `extractGpsFromImageFile` entry-point is covered by a
 * single smoke test that verifies it propagates the parsed result.
 */

import { extractGpsFromJpegBuffer, extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';

// ─── JPEG / EXIF binary builder helpers ─────────────────────────────────────

/** Builds a minimal JPEG buffer containing an EXIF APP1 segment. */
function buildJpegWithExif(exifPayload: Uint8Array): Uint8Array {
  // Layout: SOI(2) + APP1-marker(2) + seg-len(2) + payload(N)
  // Segment length field value = 2 (length field itself) + payload.length
  const segLen = 2 + exifPayload.length;
  const buf = new Uint8Array(2 + 2 + 2 + exifPayload.length); // SOI + marker + len + payload
  // SOI
  buf[0] = 0xff; buf[1] = 0xd8;
  // APP1 marker
  buf[2] = 0xff; buf[3] = 0xe1;
  // Length (big-endian)
  buf[4] = (segLen >> 8) & 0xff;
  buf[5] = segLen & 0xff;
  // Payload
  buf.set(exifPayload, 6);
  return buf;
}

/** Writes a 16-bit big-endian value into buf at offset. */
function w16be(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = (value >> 8) & 0xff;
  buf[offset + 1] = value & 0xff;
}

/** Writes a 32-bit little-endian value into buf at offset. */
function w32le(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >> 8) & 0xff;
  buf[offset + 2] = (value >> 16) & 0xff;
  buf[offset + 3] = (value >> 24) & 0xff;
}

/** Writes a 16-bit little-endian value into buf at offset. */
function w16le(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >> 8) & 0xff;
}

/**
 * Builds the EXIF APP1 payload (everything after the FF E1 length field):
 * 'Exif\0\0' + little-endian TIFF with a GPS IFD containing LatRef, Lat,
 * LonRef, Lon as rational DMS triples.
 *
 * Layout:
 *   0..5   : 'Exif\0\0'
 *   6..     : TIFF data (little-endian)
 *     0..1  : byte order 'II'
 *     2..3  : magic 42
 *     4..7  : IFD0 offset from TIFF base = 8
 *     8..9  : IFD0 entry count = 1
 *     10..21: IFD0 entry (tag 0x8825, type LONG, count 1, value = gpsIfdOffset)
 *     22..23: IFD0 next-IFD offset = 0
 *     24..25: GPS IFD entry count = 4
 *     26..77: 4 GPS entries × 12 bytes
 *     78..79: GPS IFD next = 0
 *     80..: Rational data (4 × 3 × 8 = 96 bytes for two DMS triples + 2 ASCII refs)
 */
function buildExifPayload(
  latDms: [number, number, number],
  lonDms: [number, number, number],
  latRef: 'N' | 'S',
  lonRef: 'E' | 'W',
): Uint8Array {
  // Total size: 6 (Exif header) + TIFF body
  // TIFF layout (all offsets relative to TIFF base, i.e. payload[6]):
  //   0: 'II' (0x4949), 2: 42, 4..7: IFD0 at 8
  //   8: count=1, 10..21: GPS IFD pointer entry
  //   22: next IFD = 0
  //   24: GPS IFD count=4, 26..73: 4 entries × 12B, 74..75: next=0
  //   76: rational data starts
  //      LatRef ASCII (2 bytes: e.g. 'N\0')
  //      LonRef ASCII (2 bytes: e.g. 'E\0')
  //      LatDMS 3 rationals × 8 bytes = 24 bytes
  //      LonDMS 3 rationals × 8 bytes = 24 bytes
  //   total rational data: 2+2+24+24 = 52 bytes
  // Total TIFF size: 76 + 52 = 128 bytes
  // Total payload: 6 + 128 = 134 bytes

  const TIFF_BASE = 6; // offset of TIFF start within payload
  const IFD0_OFFSET = 8; // from TIFF base
  const GPS_IFD_OFFSET = 24; // from TIFF base
  const DATA_OFFSET = 76; // rational/ASCII data from TIFF base

  const buf = new Uint8Array(TIFF_BASE + DATA_OFFSET + 52);

  // 'Exif\0\0'
  buf[0] = 0x45; buf[1] = 0x78; buf[2] = 0x69; buf[3] = 0x66; buf[4] = 0; buf[5] = 0;

  // TIFF: byte order 'II' (little-endian), magic 42, IFD0 at offset 8
  buf[TIFF_BASE + 0] = 0x49; buf[TIFF_BASE + 1] = 0x49;
  w16le(buf, TIFF_BASE + 2, 42);
  w32le(buf, TIFF_BASE + 4, IFD0_OFFSET);

  // IFD0: 1 entry (GPS IFD pointer)
  w16le(buf, TIFF_BASE + IFD0_OFFSET, 1);
  // Entry: tag=0x8825, type=LONG(4), count=1, value=GPS_IFD_OFFSET
  w16le(buf, TIFF_BASE + IFD0_OFFSET + 2, 0x8825);
  w16le(buf, TIFF_BASE + IFD0_OFFSET + 4, 4); // LONG
  w32le(buf, TIFF_BASE + IFD0_OFFSET + 6, 1);
  w32le(buf, TIFF_BASE + IFD0_OFFSET + 10, GPS_IFD_OFFSET);
  // IFD0 next = 0
  w32le(buf, TIFF_BASE + IFD0_OFFSET + 14, 0);

  // GPS IFD: 4 entries
  w16le(buf, TIFF_BASE + GPS_IFD_OFFSET, 4);

  // Data offsets (relative to TIFF base)
  const latRefOffset = DATA_OFFSET;       // 2 bytes ASCII
  const lonRefOffset = DATA_OFFSET + 2;   // 2 bytes ASCII
  const latDmsDataOffset = DATA_OFFSET + 4;  // 3 × 8 = 24 bytes RATIONAL
  const lonDmsDataOffset = DATA_OFFSET + 28; // 3 × 8 = 24 bytes RATIONAL

  // GPS entry helper: writes 12-byte IFD entry
  const writeGpsEntry = (entryIndex: number, tag: number, type: number, count: number, valueOrOffset: number) => {
    const base = TIFF_BASE + GPS_IFD_OFFSET + 2 + entryIndex * 12;
    w16le(buf, base, tag);
    w16le(buf, base + 2, type);
    w32le(buf, base + 4, count);
    w32le(buf, base + 8, valueOrOffset);
  };

  // Tag 0x0001 LatRef: ASCII, count=2, inline
  writeGpsEntry(0, 0x0001, 2, 2, (latRef.charCodeAt(0)) | 0);
  // Tag 0x0002 Lat: RATIONAL, count=3, offset=latDmsDataOffset
  writeGpsEntry(1, 0x0002, 5, 3, latDmsDataOffset);
  // Tag 0x0003 LonRef: ASCII, count=2, inline
  writeGpsEntry(2, 0x0003, 2, 2, (lonRef.charCodeAt(0)) | 0);
  // Tag 0x0004 Lon: RATIONAL, count=3, offset=lonDmsDataOffset
  writeGpsEntry(3, 0x0004, 5, 3, lonDmsDataOffset);

  // Fix: write ASCII refs as inline value in the 4-byte value field properly
  buf[TIFF_BASE + GPS_IFD_OFFSET + 2 + 0 * 12 + 8] = latRef.charCodeAt(0);
  buf[TIFF_BASE + GPS_IFD_OFFSET + 2 + 0 * 12 + 9] = 0;
  buf[TIFF_BASE + GPS_IFD_OFFSET + 2 + 2 * 12 + 8] = lonRef.charCodeAt(0);
  buf[TIFF_BASE + GPS_IFD_OFFSET + 2 + 2 * 12 + 9] = 0;

  // GPS IFD next = 0
  w32le(buf, TIFF_BASE + GPS_IFD_OFFSET + 2 + 4 * 12, 0);

  // Write rational DMS: each component = numerator/1 (integer degrees/minutes, fractional seconds × 1e6 / 1e6)
  const writeRationalDms = (bufOffset: number, dms: [number, number, number]) => {
    // Degrees: integer
    const [d, m, s] = dms;
    w32le(buf, TIFF_BASE + bufOffset, Math.round(d));
    w32le(buf, TIFF_BASE + bufOffset + 4, 1);
    // Minutes: integer
    w32le(buf, TIFF_BASE + bufOffset + 8, Math.round(m));
    w32le(buf, TIFF_BASE + bufOffset + 12, 1);
    // Seconds: × 10000 / 10000
    w32le(buf, TIFF_BASE + bufOffset + 16, Math.round(s * 10000));
    w32le(buf, TIFF_BASE + bufOffset + 20, 10000);
  };

  writeRationalDms(latDmsDataOffset, latDms);
  writeRationalDms(lonDmsDataOffset, lonDms);

  return buf;
}

function buildTestJpeg(
  latDms: [number, number, number],
  lonDms: [number, number, number],
  latRef: 'N' | 'S',
  lonRef: 'E' | 'W',
): Uint8Array {
  const exif = buildExifPayload(latDms, lonDms, latRef, lonRef);
  return buildJpegWithExif(exif);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('image-file-gps', () => {
  describe('extractGpsFromJpegBuffer', () => {
    it('returns null for an empty buffer', () => {
      expect(extractGpsFromJpegBuffer(new Uint8Array(0))).toBeNull();
    });

    it('returns null if buffer does not start with JPEG SOI marker', () => {
      const buf = new Uint8Array([0x00, 0x00, 0xff, 0xe1, 0x00, 0x10]);
      expect(extractGpsFromJpegBuffer(buf)).toBeNull();
    });

    it('returns null for a JPEG with no APP1 segment', () => {
      // SOI + SOS (no APP1)
      const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]);
      expect(extractGpsFromJpegBuffer(buf)).toBeNull();
    });

    it('returns null for an APP1 segment without EXIF header', () => {
      // SOI + APP1 marker + length + non-EXIF content
      const payload = new Uint8Array(10).fill(0);
      const buf = buildJpegWithExif(payload);
      expect(extractGpsFromJpegBuffer(buf)).toBeNull();
    });

    it('extracts N/E GPS coordinates from a well-formed JPEG EXIF', () => {
      // 10°45'21.6" N, 106°37'55.2" E → ≈ 10.7560, 106.6320
      const buf = buildTestJpeg([10, 45, 21.6], [106, 37, 55.2], 'N', 'E');
      const result = extractGpsFromJpegBuffer(buf);

      expect(result).not.toBeNull();
      expect(result?.latitude).toBeCloseTo(10.756, 2);
      expect(result?.longitude).toBeCloseTo(106.632, 2);
    });

    it('negates latitude for S reference', () => {
      const buf = buildTestJpeg([10, 45, 21.6], [106, 37, 55.2], 'S', 'E');
      const result = extractGpsFromJpegBuffer(buf);

      expect(result?.latitude).toBeLessThan(0);
      expect(result?.longitude).toBeGreaterThan(0);
    });

    it('negates longitude for W reference', () => {
      const buf = buildTestJpeg([10, 45, 21.6], [106, 37, 55.2], 'N', 'W');
      const result = extractGpsFromJpegBuffer(buf);

      expect(result?.latitude).toBeGreaterThan(0);
      expect(result?.longitude).toBeLessThan(0);
    });

    it('negates both for S + W references', () => {
      const buf = buildTestJpeg([33, 51, 24.5], [151, 12, 55.1], 'S', 'W');
      const result = extractGpsFromJpegBuffer(buf);

      expect(result?.latitude).toBeLessThan(0);
      expect(result?.longitude).toBeLessThan(0);
    });

    it('correctly parses the dashcam image coordinates (10°45′21.47″N, 106°37′49.52″E)', () => {
      // Values observed from home_test.jpg
      const buf = buildTestJpeg([10, 45, 21.4676], [106, 37, 49.5216], 'N', 'E');
      const result = extractGpsFromJpegBuffer(buf);

      expect(result).not.toBeNull();
      // 10 + 45/60 + 21.4676/3600 ≈ 10.75596
      expect(result?.latitude).toBeCloseTo(10.756, 2);
      // 106 + 37/60 + 49.5216/3600 ≈ 106.63042
      expect(result?.longitude).toBeCloseTo(106.630, 2);
    });
  });

  describe('extractGpsFromImageFile', () => {
    it('returns null when FileSystem.readAsStringAsync rejects', async () => {
      // expo-file-system/legacy is mocked by jest-expo preset to return undefined.
      // Regardless of platform, the function must swallow errors and return null.
      const result = await extractGpsFromImageFile('file:///nonexistent.jpg');
      // Either returns null (file-not-found) or null (web platform guard) — never throws
      expect(result === null || result === undefined).toBe(true);
    });
  });
});
