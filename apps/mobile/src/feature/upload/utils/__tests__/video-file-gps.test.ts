import {
  nmeaToDecimal,
  parseIso6709,
  parseNmeaSentences,
  parseQuickTimeXyzAtom,
  parse3gppLociAtom,
  parseDurationFromMvhd,
  parseCammSamples,
  parseGpmfGps,
  findTelemetryChunkOffsets,
  extractMetadataFromBuffer,
} from '../video-file-gps';

describe('video-file-gps utility', () => {
  describe('nmeaToDecimal', () => {
    it('converts North and East NMEA coordinates accurately', () => {
      // 1046.2028 N = 10 deg + 46.2028 / 60 = 10.770047
      const lat = nmeaToDecimal('1046.2028', 'N');
      expect(lat).toBeCloseTo(10.770047, 5);

      // 10641.4830 E = 106 deg + 41.4830 / 60 = 106.691383
      const lon = nmeaToDecimal('10641.4830', 'E');
      expect(lon).toBeCloseTo(106.691383, 5);
    });

    it('handles South and West coordinates with negative sign', () => {
      const lat = nmeaToDecimal('3351.4080', 'S');
      expect(lat).toBeLessThan(0);
      expect(lat).toBeCloseTo(-33.8568, 4);

      const lon = nmeaToDecimal('15112.9180', 'W');
      expect(lon).toBeLessThan(0);
      expect(lon).toBeCloseTo(-151.2153, 4);
    });

    it('returns null for invalid inputs', () => {
      expect(nmeaToDecimal('invalid', 'N')).toBeNull();
      expect(nmeaToDecimal('0', 'N')).toBeNull();
    });
  });

  describe('parseIso6709', () => {
    it('parses standard ISO 6709 QuickTime coordinate strings', () => {
      const text = 'some_atom_data_+10.770046+106.691383/_other_data';
      const result = parseIso6709(text);

      expect(result).not.toBeNull();
      expect(result?.latitude).toBe(10.770046);
      expect(result?.longitude).toBe(106.691383);
    });

    it('parses ISO 6709 strings with altitude component', () => {
      const text = '+21.028511+105.854167+015.000/';
      const result = parseIso6709(text);

      expect(result).not.toBeNull();
      expect(result?.latitude).toBe(21.028511);
      expect(result?.longitude).toBe(105.854167);
    });

    it('returns null when no valid coordinates exist', () => {
      expect(parseIso6709('no coordinates here')).toBeNull();
      expect(parseIso6709('+00.0000+000.0000/')).toBeNull();
    });
  });

  describe('parseNmeaSentences (Dashcams: VIOFO, 70mai, Thinkware, Novatek)', () => {
    it('extracts GPS from dashcam $GPRMC sentence', () => {
      const dashcamMetadata =
        'NOVATEK_STREAM_$GPRMC,081836.00,A,1046.2028,N,10641.4830,E,022.4,084.4,180926,,,A*68\r\nTRAILING';
      const result = parseNmeaSentences(dashcamMetadata);

      expect(result).not.toBeNull();
      expect(result?.source).toBe('nmea_rmc');
      expect(result?.latitude).toBeCloseTo(10.770047, 5);
      expect(result?.longitude).toBeCloseTo(106.691383, 5);
    });

    it('extracts GPS from dashcam $GPGGA sentence', () => {
      const dashcamGga =
        '$GPGGA,123519,1046.2028,N,10641.4830,E,1,08,0.9,545.4,M,46.9,M,,*47';
      const result = parseNmeaSentences(dashcamGga);

      expect(result).not.toBeNull();
      expect(result?.source).toBe('nmea_gga');
      expect(result?.latitude).toBeCloseTo(10.770047, 5);
      expect(result?.longitude).toBeCloseTo(106.691383, 5);
    });
  });

  describe('parseQuickTimeXyzAtom (Binary)', () => {
    it('detects and parses binary ©xyz atom in MP4 buffer', () => {
      const coordString = '+10.770046+106.691383/';
      const buffer = new Uint8Array(64);
      // Dummy header
      buffer[0] = 0; buffer[1] = 0; buffer[2] = 0; buffer[3] = 32; // size
      // '©', 'x', 'y', 'z'
      buffer[4] = 0xa9; buffer[5] = 0x78; buffer[6] = 0x79; buffer[7] = 0x7a;
      // Language code (2 bytes)
      buffer[8] = 0x15; buffer[9] = 0xc7;
      // String content
      for (let i = 0; i < coordString.length; i++) {
        buffer[10 + i] = coordString.charCodeAt(i);
      }

      const result = parseQuickTimeXyzAtom(buffer);
      expect(result).not.toBeNull();
      expect(result?.latitude).toBe(10.770046);
      expect(result?.longitude).toBe(106.691383);
    });

    it('detects and parses binary loci atom in 3GPP MP4 buffer', () => {
      const buffer = new Uint8Array(40);
      // 'l', 'o', 'c', 'i' at index 4
      buffer[4] = 0x6c; buffer[5] = 0x6f; buffer[6] = 0x63; buffer[7] = 0x69;
      // Skip version (4B) and language (2B): place name starts at 14
      buffer[14] = 0; // null-terminated place name
      buffer[15] = 0; // role byte
      const view = new DataView(buffer.buffer);
      // lon = 106.730093 * 65536
      view.setInt32(16, Math.round(106.730093 * 65536), false);
      // lat = 10.737595 * 65536
      view.setInt32(20, Math.round(10.737595 * 65536), false);

      const result = parse3gppLociAtom(buffer);
      expect(result).not.toBeNull();
      expect(result?.latitude).toBeCloseTo(10.737595, 3);
      expect(result?.longitude).toBeCloseTo(106.730093, 3);
    });
  });

  describe('parseDurationFromMvhd (MediaStore duration recovery)', () => {
    it('extracts correct duration in seconds from mvhd atom when MediaStore reports -0.001', () => {
      const buffer = new Uint8Array(64);
      // 'm', 'v', 'h', 'd' at index 4
      buffer[4] = 0x6d; buffer[5] = 0x76; buffer[6] = 0x68; buffer[7] = 0x64;
      const view = new DataView(buffer.buffer);
      // Version 0
      buffer[8] = 0;
      // Timescale at offset 4 + 4 + 4 + 4 = 16 -> 1000
      view.setUint32(20, 1000, false);
      // Duration at offset 20 + 4 = 24 -> 125000 (125 seconds)
      view.setUint32(24, 125000, false);

      const duration = parseDurationFromMvhd(buffer);
      expect(duration).toBe(125);
    });
  });

  describe('extractMetadataFromBuffer', () => {
    it('extracts both GPS and duration simultaneously from a multi-atom buffer', () => {
      const buffer = new Uint8Array(128);
      // 1. mvhd at index 4
      buffer[4] = 0x6d; buffer[5] = 0x76; buffer[6] = 0x68; buffer[7] = 0x64;
      const view = new DataView(buffer.buffer);
      buffer[8] = 0;
      view.setUint32(20, 1000, false); // timescale
      view.setUint32(24, 90000, false); // 90 seconds

      // 2. ©xyz at index 40
      buffer[40] = 0xa9; buffer[41] = 0x78; buffer[42] = 0x79; buffer[43] = 0x7a;
      const coordStr = '+10.823100+106.629700/';
      for (let i = 0; i < coordStr.length; i++) {
        buffer[46 + i] = coordStr.charCodeAt(i);
      }

      const extracted = extractMetadataFromBuffer(buffer);
      expect(extracted.durationSeconds).toBe(90);
      expect(extracted.gps).toBeDefined();
      expect(extracted.gps?.latitude).toBe(10.8231);
      expect(extracted.gps?.longitude).toBe(106.6297);
      expect(extracted.gps?.source).toBe('quicktime_xyz');
    });

    it('extracts GPS from Google / GoPro CAMM sample type 6', () => {
      // 60-byte CAMM type 6 sample (matches clip_000505.mp4)
      const buffer = new Uint8Array(60);
      const view = new DataView(buffer.buffer);
      // reserved = 0
      view.setUint16(0, 0, true);
      // type = 6
      view.setUint16(2, 6, true);
      // gps time epoch = 1783205883.863
      view.setFloat64(4, 1783205883.863, true);
      // fix type = 3 (3D fix)
      view.setInt32(12, 3, true);
      // latitude = 10.737595
      view.setFloat64(16, 10.737595, true);
      // longitude = 106.730093
      view.setFloat64(24, 106.730093, true);
      // altitude = 34.45
      view.setFloat32(32, 34.45, true);

      const result = parseCammSamples(buffer);
      expect(result).not.toBeNull();
      expect(result?.latitude).toBeCloseTo(10.737595, 5);
      expect(result?.longitude).toBeCloseTo(106.730093, 5);

      const extracted = extractMetadataFromBuffer(buffer);
      expect(extracted.gps?.source).toBe('camm');
      expect(extracted.gps?.latitude).toBeCloseTo(10.737595, 5);
      expect(extracted.gps?.longitude).toBeCloseTo(106.730093, 5);
    });

    it('extracts GPS from GoPro GPMF GPS5 payload', () => {
      const buffer = new Uint8Array(32);
      // 'G', 'P', 'S', '5'
      buffer[0] = 0x47; buffer[1] = 0x50; buffer[2] = 0x53; buffer[3] = 0x35;
      buffer[4] = 0x6c; // type 'l'
      buffer[5] = 20;   // sample size
      const view = new DataView(buffer.buffer);
      view.setUint16(6, 1, false); // count = 1
      // lat: 107375950 -> 10.737595
      view.setInt32(8, 107375950, false);
      // lon: 1067300930 -> 106.730093
      view.setInt32(12, 1067300930, false);

      const result = parseGpmfGps(buffer);
      expect(result).not.toBeNull();
      expect(result?.latitude).toBeCloseTo(10.737595, 5);
      expect(result?.longitude).toBeCloseTo(106.730093, 5);
    });

    it('finds telemetry track chunk offsets from moov atom', () => {
      const buffer = new Uint8Array(128);
      // 'c', 'a', 'm', 'm' at index 10
      buffer[10] = 0x63; buffer[11] = 0x61; buffer[12] = 0x6d; buffer[13] = 0x6d;
      // 'c', 'o', '6', '4' at index 20
      buffer[20] = 0x63; buffer[21] = 0x6f; buffer[22] = 0x36; buffer[23] = 0x34;
      const view = new DataView(buffer.buffer);
      view.setUint32(28, 1, false); // 1 chunk offset
      view.setUint32(32, 0, false); // high 32-bit = 0
      view.setUint32(36, 73202576, false); // low 32-bit = 73202576

      const offsets = findTelemetryChunkOffsets(buffer);
      expect(offsets).toEqual([73202576]);
    });
  });
});
