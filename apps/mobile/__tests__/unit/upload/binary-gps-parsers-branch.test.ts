import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync } from 'expo-image-manipulator';

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: jest.fn(),
}));

import {
  bufferToAsciiString,
  extractGpsFromVideoFile,
  extractMetadataFromBuffer,
  findTelemetryChunkOffsets,
  nmeaToDecimal,
  parse3gppLociAtom,
  parseCammSamples,
  parseDurationFromMvhd,
  parseGpmfGps,
  parseIso6709,
  parseNmeaSentences,
  parseQuickTimeXyzAtom,
} from '@/feature/upload/utils/video-file-gps';
import {
  extractGpsFromImageFile,
  extractGpsFromJpegBuffer,
} from '@/feature/upload/utils/image-file-gps';
import {
  compressAndResizeSurveyImage,
  prepareSurveyImage,
} from '@/feature/upload/utils/survey-image';

describe('Binary Video/Image GPS & SurveyImage Branch Coverage', () => {
  const originalPlatform = Platform.OS;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    globalThis.fetch = originalFetch;
  });

  describe('video-file-gps.ts', () => {
    it('parses NMEA, ISO6709, QuickTime xyz, and 3GPP loci atoms across valid & invalid inputs', () => {
      expect(nmeaToDecimal('12', 'N')).toBeNull();
      expect(nmeaToDecimal('ab.cd', 'N')).toBeNull();
      expect(nmeaToDecimal('1046.2000', 'S')).toBeLessThan(0);
      expect(nmeaToDecimal('10642.0000', 'W')).toBeLessThan(0);

      expect(parseIso6709('not-coords')).toBeNull();
      expect(parseIso6709('+00.00+00.00/')).toBeNull();
      expect(parseIso6709('+10.770046+106.691383+012.0/')).toEqual({
        latitude: 10.770046,
        longitude: 106.691383,
      });

      expect(parseNmeaSentences('no sentences')).toBeNull();
      expect(parseNmeaSentences('$GNRMC,120000,A,1046.2000,N,10642.0000,E,0,0')).toMatchObject({
        source: 'nmea_rmc',
      });
      expect(parseNmeaSentences('$GPGGA,120000,1046.2000,N,10642.0000,E,1,08')).toMatchObject({
        source: 'nmea_gga',
      });

      // QuickTime ©xyz atom
      const qtStr = '\x00\x00\x00\x00\xa9xyz+10.7769+106.7009/\x00\x00\x00\x00\x00\x00';
      const qtBytes = Uint8Array.from(qtStr, (c) => c.charCodeAt(0));
      expect(parseQuickTimeXyzAtom(qtBytes)).toEqual({ latitude: 10.7769, longitude: 106.7009 });

      // 3GPP loci atom
      const lociBuf = new Uint8Array(40);
      lociBuf[4] = 0x6c;
      lociBuf[5] = 0x6f;
      lociBuf[6] = 0x63;
      lociBuf[7] = 0x69; // 'loci'
      lociBuf[14] = 0x48; // 'H' place name
      lociBuf[15] = 0x00; // null
      lociBuf[16] = 0x00; // role
      const lv = new DataView(lociBuf.buffer);
      lv.setInt32(17, Math.round(106.7 * 65536), false);
      lv.setInt32(21, Math.round(10.77 * 65536), false);
      const lociRes = parse3gppLociAtom(lociBuf);
      expect(lociRes?.latitude).toBeCloseTo(10.77, 4);
      expect(lociRes?.longitude).toBeCloseTo(106.7, 4);
    });

    it('parses mvhd v0/v1 durations, CAMM type 5/6 LE/BE, GPMF SCAL/GPS5, stco/co64, and key-value text', () => {
      // mvhd v0
      const mv0 = new Uint8Array(44);
      mv0[4] = 0x6d;
      mv0[5] = 0x76;
      mv0[6] = 0x68;
      mv0[7] = 0x64;
      const v0 = new DataView(mv0.buffer);
      mv0[8] = 0; // version 0
      v0.setUint32(20, 1000, false); // timescale
      v0.setUint32(24, 25000, false); // 25s
      expect(parseDurationFromMvhd(mv0)).toBe(25);

      // mvhd v1
      const mv1 = new Uint8Array(64);
      mv1[4] = 0x6d;
      mv1[5] = 0x76;
      mv1[6] = 0x68;
      mv1[7] = 0x64;
      const v1 = new DataView(mv1.buffer);
      mv1[8] = 1; // version 1
      v1.setUint32(28, 1000, false); // timescale
      v1.setUint32(36, 12000, false); // 12s
      expect(parseDurationFromMvhd(mv1)).toBe(12);

      // CAMM type 6 LE
      const camm6 = new Uint8Array(64);
      const cv6 = new DataView(camm6.buffer);
      cv6.setUint16(0, 0, true);
      cv6.setUint16(2, 6, true);
      cv6.setInt32(12, 3, true);
      cv6.setFloat64(16, 10.776, true);
      cv6.setFloat64(24, 106.701, true);
      expect(parseCammSamples(camm6)).toEqual({ latitude: 10.776, longitude: 106.701 });

      // CAMM type 5 BE
      const camm5 = new Uint8Array(64);
      const cv5 = new DataView(camm5.buffer);
      cv5.setUint16(0, 0, false);
      cv5.setUint16(2, 5, false);
      cv5.setFloat64(4, 10.778, false);
      cv5.setFloat64(12, 106.702, false);
      expect(parseCammSamples(camm5)).toEqual({ latitude: 10.778, longitude: 106.702 });

      // GPMF SCAL + GPS5
      const gpmf = new Uint8Array(64);
      const gv = new DataView(gpmf.buffer);
      gpmf[0] = 0x53; gpmf[1] = 0x43; gpmf[2] = 0x41; gpmf[3] = 0x4c; // SCAL
      gpmf[4] = 0x6c; // 'l'
      gv.setInt32(8, 100000, false);
      gpmf[16] = 0x47; gpmf[17] = 0x50; gpmf[18] = 0x53; gpmf[19] = 0x35; // GPS5
      gv.setInt32(24, 1077600, false);
      gv.setInt32(28, 10670100, false);
      expect(parseGpmfGps(gpmf)).toEqual({ latitude: 10.776, longitude: 106.701 });

      // Telemetry stco & co64 offsets
      const moov = new Uint8Array(64);
      const tv = new DataView(moov.buffer);
      moov[0] = 0x63; moov[1] = 0x61; moov[2] = 0x6d; moov[3] = 0x6d; // camm
      moov[10] = 0x73; moov[11] = 0x74; moov[12] = 0x63; moov[13] = 0x6f; // stco
      tv.setUint32(18, 1, false);
      tv.setUint32(22, 4096, false);
      expect(findTelemetryChunkOffsets(moov)).toEqual([4096]);

      // bufferToAsciiString & key-value text pattern
      const kvBytes = Uint8Array.from('{"latitude": 10.7765, "longitude": 106.7015}', (c) =>
        c.charCodeAt(0),
      );
      expect(bufferToAsciiString(kvBytes)).toContain('10.7765');
      expect(extractMetadataFromBuffer(kvBytes).gps).toMatchObject({ source: 'text_key_value' });
    });

    it('extracts video GPS on native (small & large files) and web Blob paths', async () => {
      const gpsPayload = Buffer.from('{"latitude": 10.7765, "longitude": 106.7015}').toString('base64');
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 100 });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(gpsPayload);
      const nativeRes = await extractGpsFromVideoFile('file:///small.mp4');
      expect(nativeRes?.latitude).toBeCloseTo(10.7765, 3);

      // Large file > 3MB triggers header + footer slices + mid-file stco fallback
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 5_000_000 });
      (FileSystem.readAsStringAsync as jest.Mock)
        .mockResolvedValueOnce(Buffer.from('no-gps-header').toString('base64'))
        .mockResolvedValueOnce(gpsPayload);
      const largeRes = await extractGpsFromVideoFile('file:///large.mp4');
      expect(largeRes?.longitude).toBeCloseTo(106.7015, 3);

      // Web blob path + HTTP 404 null
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: false });
      expect(await extractGpsFromVideoFile('https://example.com/missing.mp4')).toBeNull();
    });
  });

  describe('image-file-gps.ts', () => {
    function buildMinimalJpegWithExif(littleEndian: boolean, withHeadingTag: boolean): Uint8Array {
      const buf = new Uint8Array(256);
      const view = new DataView(buf.buffer);
      // SOI + APP1
      buf[0] = 0xff; buf[1] = 0xd8;
      buf[2] = 0xff; buf[3] = 0xe1;
      view.setUint16(4, 180, false); // segLen
      // 'Exif\0\0'
      buf[6] = 0x45; buf[7] = 0x78; buf[8] = 0x69; buf[9] = 0x66;
      const tiff = 12;
      const set16 = (off: number, val: number) => view.setUint16(tiff + off, val, littleEndian);
      const set32 = (off: number, val: number) => view.setUint32(tiff + off, val, littleEndian);

      // TIFF header: 'II' or 'MM' + magic 42 + IFD0 @ 8
      buf[tiff] = littleEndian ? 0x49 : 0x4d;
      buf[tiff + 1] = littleEndian ? 0x49 : 0x4d;
      set16(2, 42);
      set32(4, 8);

      // IFD0: 1 entry pointing to GPS IFD @ 26
      set16(8, 1);
      set16(10, 0x8825);
      set16(12, 4);
      set32(14, 1);
      set32(18, 26);

      // GPS IFD @ 26: 4 or 5 entries
      const entryCount = withHeadingTag ? 5 : 4;
      set16(26, entryCount);
      // 1: LAT_REF 'S'
      set16(28, 1); set16(30, 2); set32(32, 2); buf[tiff + 36] = 0x53; // 'S'
      // 2: LAT DMS @ 100
      set16(40, 2); set16(42, 5); set32(44, 3); set32(48, 100);
      // 3: LON_REF 'W'
      set16(52, 3); set16(54, 2); set32(56, 2); buf[tiff + 60] = 0x57; // 'W'
      // 4: LON DMS @ 124
      set16(64, 4); set16(66, 5); set32(68, 3); set32(72, 124);
      if (withHeadingTag) {
        // 5: IMG_DIRECTION (tag 0x0011, SHORT type 3 = 180)
        set16(76, 0x0011); set16(78, 3); set32(80, 1); set16(84, 180);
      }

      // LAT rationals (10, 30, 0) -> -10.5
      set32(100, 10); set32(104, 1); set32(108, 30); set32(112, 1); set32(116, 0); set32(120, 1);
      // LON rationals (106, 30, 0) -> -106.5
      set32(124, 106); set32(128, 1); set32(132, 30); set32(136, 1); set32(140, 0); set32(144, 1);
      return buf;
    }

    it('parses LE and BE TIFF EXIF GPS segments + heading and text fallback', () => {
      expect(extractGpsFromJpegBuffer(new Uint8Array([0x00, 0x00]))).toBeNull();
      expect(extractGpsFromJpegBuffer(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]))).toBeNull();

      const le = extractGpsFromJpegBuffer(buildMinimalJpegWithExif(true, true));
      expect(le).toMatchObject({ latitude: -10.5, longitude: -106.5, heading: 180 });

      const beBuf = buildMinimalJpegWithExif(false, false);
      // Append XMP PoseHeadingDegrees fallback inside tail
      const xmp = ' PoseHeadingDegrees="45/2" ';
      for (let i = 0; i < xmp.length; i++) beBuf[200 + i] = xmp.charCodeAt(i);
      const be = extractGpsFromJpegBuffer(beBuf);
      expect(be).toMatchObject({ latitude: -10.5, longitude: -106.5, heading: 22.5 });
    });

    it('extracts EXIF from image file on native and returns null on web or error', async () => {
      const b64 = Buffer.from(buildMinimalJpegWithExif(true, true)).toString('base64');
      (FileSystem.readAsStringAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Range unsupported'))
        .mockResolvedValueOnce(b64);

      const res = await extractGpsFromImageFile('content://photo.jpg');
      expect(res).toMatchObject({ latitude: -10.5, longitude: -106.5 });

      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('IO failure'));
      expect(await extractGpsFromImageFile('file:///broken.jpg')).toBeNull();

      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      expect(await extractGpsFromImageFile('blob:1')).toBeNull();
    });
  });

  describe('survey-image.ts', () => {
    it('handles compression skip for small local JPEG, resize fallback, and chunk descriptor', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 100_000 });
      const skipped = await compressAndResizeSurveyImage('file:///small.jpg');
      expect(skipped.uri).toBe('file:///small.jpg');
      expect(manipulateAsync).not.toHaveBeenCalled();

      (manipulateAsync as jest.Mock).mockRejectedValueOnce(new Error('Manipulate failed'));
      const fallback = await compressAndResizeSurveyImage('file:///photo.png');
      expect(fallback.uri).toBe('file:///photo.png');

      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: 'file:///compressed.jpg', width: 1024, height: 768 });
      const prepared = await prepareSurveyImage({ uri: 'file:///photo.png', fileName: 'snap.png' });
      expect(prepared.fileName).toBe('snap.jpg');
      expect((prepared.chunk.file as any).type).toBe('image/jpeg');

      // Oversized local video throws
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 999_999_999_999 });
      await expect(
        prepareSurveyImage({ uri: 'file:///huge.mp4', type: 'video', fileName: 'huge.mov' }),
      ).rejects.toThrow();
    });
  });
});
